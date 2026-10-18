/**
 * Minimal, dependency-free one-page PDF writer for the illustrative resume.
 *
 * Hand-builds a single-page PDF (Helvetica, WinAnsi, no compression) so the
 * story's "Download PDF" action produces a real file. All content is plain
 * ASCII; anything outside the printable range is stripped, and `( ) \` are
 * escaped, so byte offsets for the xref table stay exact.
 */

export type ResumePdfLine = {
  text: string;
  size: number;
  bold?: boolean;
  tone?: "ink" | "muted" | "accent";
  /** Extra leading (pt) before this line. */
  spaceBefore?: number;
  /** Horizontal indent (pt). */
  indent?: number;
};

const INK = "0.17 0.12 0.27";
const MUTED = "0.45 0.42 0.52";
const ACCENT = "0.49 0.23 0.96";
const TONES = { ink: INK, muted: MUTED, accent: ACCENT } as const;

/** The illustrative resume, shared with scene 08. */
export const RESUME_PDF_LINES: ResumePdfLine[] = [
  { text: "ALEX MORGAN", size: 22, bold: true },
  { text: "Frontend Engineer", size: 11, tone: "muted" },
  { text: "alex@example.com  |  Austin, TX  |  Portfolio", size: 9, tone: "muted" },
  { text: "PROFESSIONAL SUMMARY", size: 10.5, bold: true, tone: "accent", spaceBefore: 30 },
  { text: "Frontend engineer building accessible products and thoughtful design", size: 10, spaceBefore: 4 },
  { text: "systems with React and TypeScript.", size: 10 },
  { text: "WORK EXPERIENCE", size: 10.5, bold: true, tone: "accent", spaceBefore: 18 },
  { text: "Frontend Engineer  |  2022 - Present", size: 10, bold: true, spaceBefore: 4 },
  { text: "- Improved load performance by 31%.", size: 10, spaceBefore: 2 },
  { text: "- Partnered with design and product teams.", size: 10 },
  { text: "SELECTED PROJECTS", size: 10.5, bold: true, tone: "accent", spaceBefore: 18 },
  { text: "Customer Dashboard", size: 10, bold: true, spaceBefore: 4 },
  { text: "A shared component library with accessible interfaces.", size: 10 },
  { text: "EDUCATION", size: 10.5, bold: true, tone: "accent", spaceBefore: 18 },
  { text: "BSc in Computer Science", size: 10, bold: true, spaceBefore: 4 },
  { text: "SKILLS", size: 10.5, bold: true, tone: "accent", spaceBefore: 18 },
  { text: "React  |  TypeScript  |  UI systems  |  Git", size: 10, spaceBefore: 4 },
  { text: "Illustrative resume  |  Built with ProfileAI  |  Not a real person.", size: 8.5, tone: "muted", spaceBefore: 40 },
];

const escapeText = (text: string) =>
  text.replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/** Public shape for a personalized document header (no src imports: this file stays dependency-free). */
export type ResumePdfIdentity = { name: string; email: string };

/**
 * Swaps the illustrative header (and footer note) for the signed-in visitor's
 * name and email. WinAnsi can't render Bengali; if nothing printable remains,
 * the PDF falls back to a neutral placeholder instead of an empty line.
 */
export function personalizeResumeLines(identity: ResumePdfIdentity): ResumePdfLine[] {
  const printable = (value: string) => value.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
  const name = printable(identity.name) || "Your Name";
  const email = printable(identity.email) || "you@example.com";
  return [
    { text: name.toUpperCase(), size: 22, bold: true },
    { text: "Frontend Engineer", size: 11, tone: "muted" },
    { text: `${email}  |  Your details  |  ProfileAI`, size: 9, tone: "muted" },
    ...RESUME_PDF_LINES.slice(3, -1),
    { text: "Built with ProfileAI  |  Sample body content for layout preview.", size: 8.5, tone: "muted", spaceBefore: 40 },
  ];
}

/** Byte length after PDF string escapes are parsed. */
const parsedLength = (text: string) => {
  let length = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\\") {
      const next = text[index + 1] ?? "";
      index += next >= "0" && next <= "7" ? 3 : 1;
    }
    length += 1;
  }
  return length;
};

export function buildResumePdf(lines: ResumePdfLine[] = RESUME_PDF_LINES): Blob {
  const page = { w: 612, h: 792, margin: 56 };
  const ops: string[] = [];
  let y = page.h - page.margin;
  let drewHeaderRule = false;

  for (const line of lines) {
    y -= (line.spaceBefore ?? 0) + line.size * 1.45;
    if (!drewHeaderRule && line.tone === "accent") {
      drewHeaderRule = true;
      const ruleY = y + line.size * 1.45 + 12;
      ops.push(`0.55 0.23 0.93 RG 0.8 w ${page.margin} ${ruleY.toFixed(1)} m ${page.w - page.margin} ${ruleY.toFixed(1)} l S`);
    }
    const x = page.margin + (line.indent ?? 0);
    ops.push(
      `BT /${line.bold ? "F2" : "F1"} ${line.size} Tf ${TONES[line.tone ?? "ink"]} rg ` +
      `1 0 0 1 ${x} ${y.toFixed(1)} Tm (${escapeText(line.text)}) Tj ET`,
    );
  }

  const content = `${ops.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.w} ${page.h}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${parsedLength(content)} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}

/** Trigger a download of the resume; personalized when an identity is given. */
export function downloadResume(identity?: ResumePdfIdentity) {
  const url = URL.createObjectURL(buildResumePdf(identity ? personalizeResumeLines(identity) : undefined));
  const anchor = document.createElement("a");
  const slug = identity?.name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  anchor.href = url;
  anchor.download = slug ? `${slug}-resume.pdf` : "alex-morgan-resume.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
