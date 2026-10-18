/**
 * Sampler invariant tests for the cinematic story data.
 *
 * Compiles src/lib/career-cinema.ts with the project's own TypeScript, then
 * checks the pure geometry/timing samplers the whole film depends on. This is
 * the regression net for retiming work: if a key ends up on the wrong scene
 * unit, goes out of range, or a crossfade develops a blank gap, this fails.
 *
 * Usage: node tools/cinema/verify-samplers.mjs   (no dev server needed)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const buildDir = join(here, ".build");

mkdirSync(buildDir, { recursive: true });

// ── Compile the library with the project's local TypeScript ─────────────────
const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
const compile = spawnSync(process.execPath, [
  tsc,
  join(root, "src", "lib", "career-cinema.ts"),
  "--outDir", buildDir,
  "--module", "commonjs",
  "--target", "es2022",
  "--strict",
  "--skipLibCheck",
], { cwd: root, encoding: "utf8" });
if (compile.status !== 0) {
  console.error(compile.stdout || "");
  console.error(compile.stderr || "");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const lib = require(join(buildDir, "career-cinema.js"));
const {
  BLOCK_OBJECTS, CAMERA_KEYS, CHAPTER_WINDOW, DOCK_LABELS, LINES, OBJECTS, RUNWAY, SCENE_COUNT,
  SCENE_DISTANCES, dockedCount, progressForUnit, samplePose, sampleValue, unitForProgress, windowOpacity,
} = lib;

// ── Tiny assertion harness ──────────────────────────────────────────────────
const failures = [];
let checks = 0;
const check = (label, condition, detail = "") => {
  checks += 1;
  if (!condition) failures.push(detail ? `${label} — ${detail}` : label);
};

const EPS = 1e-6;
const finite = (...values) => values.every((value) => Number.isFinite(value));
const grid = [];
for (let p = 0; p <= SCENE_COUNT + EPS; p += 0.02) grid.push(Number(p.toFixed(4)));

// ── 1. Every key at an integer scene unit is an exact resting pose ──────────
for (const object of OBJECTS) {
  for (const key of object.keys) {
    if (Math.abs(key.at - Math.round(key.at)) > EPS) continue;
    const pose = samplePose(object.keys, key.at);
    const label = `${object.id} @ ${key.at}`;
    check(`${label}: x`, Math.abs(pose.x - key.x) < 1e-9, `sampled ${pose.x} vs key ${key.x}`);
    check(`${label}: y`, Math.abs(pose.y - key.y) < 1e-9, `sampled ${pose.y} vs key ${key.y}`);
    check(`${label}: z`, Math.abs(pose.z - key.z) < 1e-9, `sampled ${pose.z} vs key ${key.z}`);
    check(`${label}: opacity`, Math.abs(pose.o - (key.o ?? 1)) < 1e-9, `sampled ${pose.o}`);
    check(`${label}: scale`, Math.abs(pose.s - (key.s ?? 1)) < 1e-9, `sampled ${pose.s}`);
  }
}
for (const key of CAMERA_KEYS) {
  if (Math.abs(key.at - Math.round(key.at)) > EPS) continue;
  const pose = samplePose(CAMERA_KEYS, key.at);
  check(`camera @ ${key.at}`, finite(pose.x, pose.y, pose.z) && Math.abs(pose.x - key.x) < 1e-9, `sampled ${pose.x}`);
}

// ── 2. Dense sweep: everything stays finite and inside sane bounds ──────────
for (const p of grid) {
  for (const object of OBJECTS) {
    const pose = samplePose(object.keys, p);
    check(`${object.id} @ ${p}: finite`, finite(pose.x, pose.y, pose.z, pose.rx, pose.ry, pose.rz, pose.s, pose.o));
    check(`${object.id} @ ${p}: opacity range`, pose.o >= -EPS && pose.o <= 1 + EPS, `o=${pose.o}`);
    check(`${object.id} @ ${p}: scale range`, pose.s > 0.05 && pose.s < 3.5, `s=${pose.s}`);
    check(`${object.id} @ ${p}: world bounds`, Math.abs(pose.x) <= 2600 && Math.abs(pose.y) <= 2600 && Math.abs(pose.z) <= 2000, `x=${pose.x} y=${pose.y} z=${pose.z}`);
  }
  for (const line of LINES) {
    const value = sampleValue(line.keys, p);
    check(`line ${line.id} @ ${p}: finite`, finite(value.o, value.w));
    check(`line ${line.id} @ ${p}: opacity range`, value.o >= -EPS && value.o <= 1 + EPS, `o=${value.o}`);
    check(`line ${line.id} @ ${p}: width range`, value.w > 0 && value.w <= 4000, `w=${value.w}`);
  }
}

// ── 3. Narrative windows: one chapter at a time, quiet gaps in between ──────
// With disjoint windows a header must never double-expose with its neighbour
// (combined opacity ≤ 1), and the transformation gap between rests stays clear.
let worstSum = 0;
let worstAt = 0;
for (const p of grid) {
  if (p > SCENE_COUNT - 1 + EPS) break;
  let sum = 0;
  for (let index = 0; index < SCENE_COUNT; index += 1) {
    sum += windowOpacity(p, index - CHAPTER_WINDOW.pad, index + CHAPTER_WINDOW.pad, CHAPTER_WINDOW.fade);
  }
  if (sum > worstSum) { worstSum = sum; worstAt = p; }
}
check("no two narrative blocks double-expose", worstSum <= 1 + 1e-6, `combined opacity ${worstSum.toFixed(3)} at p=${worstAt}`);
for (let index = 0; index < SCENE_COUNT - 1; index += 1) {
  const gap = index + 0.5;
  let sum = 0;
  for (let other = 0; other < SCENE_COUNT; other += 1) {
    sum += windowOpacity(gap, other - CHAPTER_WINDOW.pad, other + CHAPTER_WINDOW.pad, CHAPTER_WINDOW.fade);
  }
  check(`transformation gap stays clear @ ${gap}`, sum <= EPS, `combined opacity ${sum.toFixed(3)}`);
}

// At every resting integer, the chapter for that scene is fully opaque.
for (let index = 0; index < SCENE_COUNT; index += 1) {
  const value = windowOpacity(index, index - CHAPTER_WINDOW.pad, index + CHAPTER_WINDOW.pad, CHAPTER_WINDOW.fade);
  check(`chapter ${index + 1} opaque at rest`, value >= 0.999, `opacity ${value}`);
}

// ── 3b. Runway allocation maps scroll travel onto scene units ───────────────
check("SCENE_DISTANCES covers every segment", SCENE_DISTANCES.length === SCENE_COUNT);
check("SCENE_DISTANCES all positive", SCENE_DISTANCES.every((step) => step > 0));
const distancesTotal = SCENE_DISTANCES.reduce((sum, step) => sum + step, 0);
check("RUNWAY equals travel plus the sticky frame", Math.abs(RUNWAY - (distancesTotal + 1)) < EPS, `runway ${RUNWAY}`);
check("unitForProgress starts at 0", Math.abs(unitForProgress(0)) < EPS);
check("unitForProgress ends at SCENE_COUNT", Math.abs(unitForProgress(1) - SCENE_COUNT) < EPS);
let previousUnit = -1;
for (let progress = 0; progress <= 1 + EPS; progress += 0.005) {
  const unit = unitForProgress(progress);
  check(`unitForProgress monotonic @ ${progress.toFixed(3)}`, unit >= previousUnit - EPS, `${previousUnit} → ${unit}`);
  previousUnit = unit;
}
for (let index = 0; index < SCENE_COUNT; index += 1) {
  const progress = progressForUnit(index);
  check(`progressForUnit(${index}) inverts the map`, Math.abs(unitForProgress(progress) - index) < 1e-9, `round-trip ${unitForProgress(progress)}`);
  check(`progressForUnit(${index}) stays in range`, progress >= 0 && progress <= 1, `progress ${progress}`);
}
check("scene 1 gets the generous opening segment", SCENE_DISTANCES[0] >= 1, `step ${SCENE_DISTANCES[0]}`);

// ── 4. Toggle windows behave like trapezoids ────────────────────────────────
check("windowOpacity starts at 0", windowOpacity(1, 1, 2, 0.3) === 0);
check("windowOpacity ends at 0", windowOpacity(2, 1, 2, 0.3) === 0);
check("windowOpacity is 1 in the middle", windowOpacity(1.5, 1, 2, 0.3) === 1);
check("windowOpacity is symmetric", Math.abs(windowOpacity(1.1, 1, 2, 0.3) - windowOpacity(1.9, 1, 2, 0.3)) < EPS);

// ── 5. Assembly dock counter walks 0 → all blocks, never backwards ──────────
let previous = 0;
for (const p of grid) {
  const count = dockedCount(p);
  check(`dockedCount integral @ ${p}`, Number.isInteger(count), `got ${count}`);
  check(`dockedCount monotonic @ ${p}`, count >= previous, `${previous} → ${count}`);
  check(`dockedCount in range @ ${p}`, count >= 0 && count <= DOCK_LABELS.length, `got ${count}`);
  previous = count;
}
check("dockedCount empty before assembly", dockedCount(5.5) === 0);
check("dockedCount completes by the last scene", dockedCount(SCENE_COUNT) === DOCK_LABELS.length);
check("block objects match dock labels", BLOCK_OBJECTS.length === DOCK_LABELS.length);

// ── Report ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`✗ ${failures.length} of ${checks} checks failed:`);
  for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log(`✓ cinema samplers OK (${checks} checks)`);
