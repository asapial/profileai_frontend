/**
 * Structural validation for the dependency-free resume PDF writer.
 *
 * Compiles src/lib/resume-pdf.ts with the project's own TypeScript, builds
 * the PDF in Node and asserts the low-level contract a viewer depends on:
 * xref offsets point at real objects, `/Length` matches the stream bytes
 * exactly, and the expected text lands in the content stream. A copy is
 * written to tools/cinema/.build/ for manual review.
 *
 * Usage: node tools/cinema/verify-pdf.mjs   (no dev server needed)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const buildDir = join(here, ".build");

mkdirSync(buildDir, { recursive: true });

// ── Compile the writer with the project's local TypeScript ──────────────────
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
const compile = spawnSync(process.execPath, [
  tsc,
  join(root, "src", "lib", "resume-pdf.ts"),
  "--outDir", buildDir,
  "--module", "commonjs",
  "--target", "es2022",
  "--lib", "es2022,dom",
  "--strict",
  "--skipLibCheck",
], { cwd: root, encoding: "utf8" });
if (compile.status !== 0) {
  console.error(compile.stdout || "");
  console.error(compile.stderr || "");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { buildResumePdf, personalizeResumeLines } = require(join(buildDir, "resume-pdf.js"));

const failures = [];
let checks = 0;
const check = (label, condition, detail = "") => {
  checks += 1;
  if (!condition) failures.push(detail ? `${label} — ${detail}` : label);
};

// ── Build and inspect ───────────────────────────────────────────────────────
const blob = buildResumePdf();
check("blob is application/pdf", blob.type === "application/pdf", `got ${blob.type}`);

const bytes = Buffer.from(await blob.arrayBuffer());
const pdf = bytes.toString("latin1");

check("pdf header", pdf.startsWith("%PDF-1.4\n"), JSON.stringify(pdf.slice(0, 12)));
check("pdf trailer", pdf.trimEnd().endsWith("%%EOF"), JSON.stringify(pdf.slice(-24)));

const xrefMatch = pdf.match(/startxref\n(\d+)\n%%EOF/);
check("startxref present", xrefMatch !== null);
const xrefAt = Number(xrefMatch?.[1] ?? -1);
check("startxref points at xref table", pdf.slice(xrefAt, xrefAt + 4) === "xref", pdf.slice(xrefAt, xrefAt + 12));

const entries = [...pdf.matchAll(/^(\d{10}) 00000 n/gm)].map((match) => Number(match[1]));
check("xref lists six objects", entries.length === 6, `got ${entries.length}`);
entries.forEach((offset, index) => {
  check(`object ${index + 1} at its xref offset`, pdf.startsWith(`${index + 1} 0 obj`, offset), pdf.slice(offset, offset + 14));
});

const streamMatch = pdf.match(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);
check("content stream present", streamMatch !== null);
if (streamMatch) {
  const declared = Number(streamMatch[1]);
  const body = streamMatch[2];
  // Parsed byte count: an octal escape (\ddd) is one byte, like \x.
  let parsed = 0;
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] === "\\") {
      const next = body[index + 1] ?? "";
      index += next >= "0" && next <= "7" ? 3 : 1;
    }
    parsed += 1;
  }
  check("stream /Length exact", declared === parsed, `declared ${declared}, parsed ${parsed}`);
}

// ── Content sanity: the resume text is really in the page stream ────────────
for (const probe of [
  "ALEX MORGAN",
  "Frontend Engineer",
  "PROFESSIONAL SUMMARY",
  "WORK EXPERIENCE",
  "SELECTED PROJECTS",
  "EDUCATION",
  "SKILLS",
  "Illustrative resume",
]) {
  check(`content carries "${probe}"`, pdf.includes(`(${probe})`) || pdf.includes(probe));
}
check("fonts: regular + bold", pdf.includes("/BaseFont /Helvetica ") && pdf.includes("/BaseFont /Helvetica-Bold"));

// ── Personalization: a signed-in visitor's identity lands in the header ─────
const personalPdf = Buffer.from(
  await buildResumePdf(personalizeResumeLines({ name: "Rifat Ahmed", email: "rifat.ahmed@example.com" })).arrayBuffer(),
).toString("latin1");
check("personal: name replaces the illustrative header", personalPdf.includes("(RIFAT AHMED)"));
check("personal: email on the sheet", personalPdf.includes("rifat.ahmed@example.com"));
check("personal: illustrative header is gone", !personalPdf.includes("ALEX MORGAN"));
check("personal: footer marks the sample body", personalPdf.includes("Sample body content") && !personalPdf.includes("Not a real person"));

// WinAnsi cannot render Bengali: an unusable name falls back to a placeholder.
const fallbackPdf = Buffer.from(
  await buildResumePdf(personalizeResumeLines({ name: "রিফাত", email: "rifat@example.com" })).arrayBuffer(),
).toString("latin1");
check("personal: non-latin name falls back", fallbackPdf.includes("(YOUR NAME)") && !fallbackPdf.includes("(RIFAT"));

// ── Keep a copy for manual review ───────────────────────────────────────────
const out = join(buildDir, "alex-morgan-resume.pdf");
writeFileSync(out, bytes);

// ── Report ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`✗ resume pdf: ${failures.length} of ${checks} checks failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`✓ resume pdf OK (${checks} checks, ${bytes.length} bytes) → tools/cinema/.build/alex-morgan-resume.pdf`);
