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
  join(root, "src", "lib", "career-neural.ts"),
  join(root, "src", "lib", "career-alignment.ts"),
  join(root, "src", "lib", "career-tailoring.ts"),
  join(root, "src", "lib", "career-gallery.ts"),
  join(root, "src", "lib", "career-assembly.ts"),
  join(root, "src", "lib", "career-preview.ts"),
  join(root, "src", "lib", "home-templates.ts"),
  "--outDir", buildDir,
  "--module", "commonjs",
  "--target", "es2022",
  "--strict",
  "--resolveJsonModule",
  "--esModuleInterop",
  "--skipLibCheck",
], { cwd: root, encoding: "utf8" });
if (compile.status !== 0) {
  console.error(compile.stdout || "");
  console.error(compile.stderr || "");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const lib = require(join(buildDir, "career-cinema.js"));
const neural = require(join(buildDir, "career-neural.js"));
const alignment = require(join(buildDir, "career-alignment.js"));
const tailoring = require(join(buildDir, "career-tailoring.js"));
const gallery = require(join(buildDir, "career-gallery.js"));
const assembly = require(join(buildDir, "career-assembly.js"));
const preview = require(join(buildDir, "career-preview.js"));
const homeTemplates = require(join(buildDir, "home-templates.js"));
const {
  BLOCK_OBJECTS, CAMERA_KEYS, CHAPTER_WINDOW, DOCK_LABELS, JOB_ROWS, LINES, OBJECTS, RUNWAY, SCENE_COUNT,
  SCENE_DISTANCES, dockedCount, progressForUnit, samplePose, sampleValue, sampleEvidence,
  sampleCompactPose, unitForProgress, windowOpacity,
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
  check(`${object.id}: key times increase`, object.keys.every((key, index) => index === 0 || key.at > object.keys[index - 1].at));
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

// ── 6. A material change follows the same reversible scroll timeline ───────
let previousForm = 0;
for (const p of grid) {
  const evidence = sampleEvidence(p);
  check(`evidence @ ${p}: bounded`, evidence.form >= 0 && evidence.form <= 1 && evidence.match >= 0 && evidence.match <= 1);
  check(`evidence @ ${p}: form never reverses while scrolling forward`, evidence.form >= previousForm);
  previousForm = evidence.form;
  for (const object of OBJECTS) {
    const pose = sampleCompactPose(object.id, p, samplePose(object.keys, p));
    check(`portrait ${object.id} @ ${p}: finite`, finite(pose.x, pose.y, pose.z, pose.rx, pose.ry, pose.rz, pose.s, pose.o));
    check(`portrait ${object.id} @ ${p}: opacity range`, pose.o >= 0 && pose.o <= 1);
    check(`portrait ${object.id} @ ${p}: valid scale`, pose.s > .05 && pose.s < 3.5);
  }
}
check("network nodes stay intact at scene 2", sampleEvidence(1).form === 0);
check("scene 3 keeps neural outputs as neurons", sampleEvidence(2).form === 0);
check("evidence cards finish forming by scene 4", sampleEvidence(3).form === 1);
check("match labels stay out of the evidence scene", sampleEvidence(2).match === 0);
check("match labels finish by scene 4", sampleEvidence(3).match === 1);

// A section must reach the document before the document reports it as docked.
for (const [index, object] of BLOCK_OBJECTS.entries()) {
  const landing = object.keys.find((key) => key.x === 0 && key.o === 1);
  check(`${object.id}: landing exists`, !!landing);
  if (!landing) continue;
  check(`${object.id}: stays visible until landing`, samplePose(object.keys, landing.at - .01).o >= .99);
  check(`${object.id}: not docked before arrival`, dockedCount(landing.at - .001) === index);
  check(`${object.id}: docks on arrival`, dockedCount(landing.at) === index + 1);
}

// The approved neural scene must retain its five layers, complete source paths,
// readable viewport bounds, and continuous reversible geometry at both handoffs.
check("neural graph has five layers", neural.NEURAL_LAYERS.length === 5);
check("neural graph has forty neurons", neural.NEURAL_NODES.length === 40);
check("neural graph has six career outputs", neural.NEURAL_OUTPUTS.length === 6);
for (const edge of neural.NEURAL_EDGES) {
  check(`neural edge ${edge.id}: adjacent layers`, neural.NEURAL_NODES[edge.to].layer === neural.NEURAL_NODES[edge.from].layer + 1);
}
for (let input = 0; input < neural.NEURAL_INPUTS.length; input++) {
  const route = neural.neuralRoute(input);
  check(`source ${input}: path reaches every layer`, route.length === 5 && route.every((index, layer) => neural.NEURAL_NODES[index]?.layer === layer));
  check(`source ${input}: correct input`, neural.NEURAL_NODES[route[0]].row === input);
  check(`source ${input}: correct output`, neural.NEURAL_OUTPUTS[neural.NEURAL_NODES[route[4]].row] === neural.NEURAL_INPUTS[input].output);
  check(`source ${input}: all links exist`, route.slice(1).every((to, step) => neural.NEURAL_EDGES.some((edge) => edge.from === route[step] && edge.to === to)));
}
for (const [width, height] of [[1440, 900], [1920, 1080], [1024, 800], [768, 1024], [390, 844], [430, 932], [844, 390]]) {
  const layout = neural.neuralLayout(width, height);
  check(`neural ${width}x${height}: all nodes in frame`, layout.points.every((point) => point.x >= 16 && point.x <= width - 16 && point.y >= 90 && point.y < height - 20));
  const anchors = layout.points.map((point, index) => ({ x: point.x - index * 2, y: point.y + index }));
  for (const p of [1.12, 1.4, 1.82, 2, 2.2, 2.5, 2.9]) {
    const points = neural.sampleNeuralPoints(p, layout.points, anchors);
    check(`neural ${width} @ ${p}: finite`, points.every((point) => finite(point.x, point.y)));
    check(`neural ${width} @ ${p}: reversible`, JSON.stringify(points) === JSON.stringify(neural.sampleNeuralPoints(p, layout.points, anchors)));
  }
  check(`neural ${width}: exact resting graph`, neural.sampleNeuralPoints(2, layout.points, anchors).every((point, index) => Math.hypot(point.x - layout.points[index].x, point.y - layout.points[index].y) < EPS));
}
for (const p of grid) check(`neural focus @ ${p}: bounded`, neural.neuralFocus(p) >= 0 && neural.neuralFocus(p) <= 1);
check("neural: scene before stays intact", neural.neuralFocus(1) === 0);
check("neural: full graph at scene 3", neural.neuralFocus(2) === 1);
check("neural: scene after stays intact", neural.neuralFocus(3) === 0);
for (const at of [1.12, 1.82, 2.2, 2.9]) check(`neural handoff @ ${at}: continuous`, Math.abs(neural.neuralFocus(at + .00001) - neural.neuralFocus(at - .00001)) < .0001);

// The alignment scene keeps the approved cards/panel and honest route gaps.
check("alignment: five evidence cards", alignment.ALIGNMENT_CARDS.length === 5);
check("alignment: only four supported routes", alignment.ALIGNMENT_ROUTES.length === 4);
check("alignment: no fabricated route to missing evidence", alignment.ALIGNMENT_ROUTES.every((route) => JOB_ROWS[route.row]?.tone !== "missing"));
for (const p of grid) {
  const state = alignment.alignmentState(p);
  check(`alignment @ ${p}: all material values bounded`, Object.values(state).every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
}
check("alignment: absent in the preceding neural rest", alignment.alignmentState(2).presence === 0);
check("alignment: fully settled at its own rest", alignment.alignmentState(3).presence === 1);
check("alignment: leaves the tailoring rest intact", alignment.alignmentState(4).presence === 0);
for (const [w, h] of [[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]]) {
  for (const selected of [0,1,2,3,4,null]) {
    const layout = alignment.alignmentLayout(w, h, selected);
    check(`alignment ${w}x${h}/${selected}: positive row heights`, layout.rowHeight >= 24);
    check(`alignment ${w}x${h}/${selected}: panel fits`, layout.panel.x >= 0 && layout.panel.x + layout.panel.width <= w && layout.panel.y >= 90 && layout.panel.y + layout.panel.height <= h);
    check(`alignment ${w}x${h}/${selected}: rows fit panel`, layout.rows.every((row) => row.y - row.height/2 >= layout.panel.y && row.y + row.height/2 <= layout.panel.y + layout.panel.height));
    for (const route of alignment.ALIGNMENT_ROUTES) {
      const card = layout.cards.find((card) => card.id === route.card);
      const row = layout.rows[route.row];
      const curve = alignment.alignmentCurve(card, row, layout.portrait);
      check(`alignment ${w}/${selected}/${route.row}: curve anchors are exact`, curve.startsWith(`M${card.x} ${card.y}C`) && curve.endsWith(`${row.x} ${row.y}`));
    }
  }
}
for (const p of [2.4, 2.96, 3.28, 3.96]) {
  check(`alignment handoff ${p}: continuous`, Math.abs(alignment.alignmentState(p+.00001).presence-alignment.alignmentState(p-.00001).presence)<.0001);
}

// Tailoring keeps the original wording, its two exact evidence highlights and
// a reversible, bounded handoff from the approved alignment surfaces.
check("tailoring: two evidence phrases", tailoring.TAILORING_PARTS.filter((part) => part.fresh).length === 2);
check("tailoring: original wording preserved", tailoring.TAILORING_ORIGINAL === "Worked on frontend development tasks and fixed bugs.");
for (const p of grid) {
  const state = tailoring.tailoringState(p);
  check(`tailoring @ ${p}: material values bounded`, Object.values(state).every((value) => finite(value) && value >= 0 && value <= 1));
  if (p >= 3.28 && p <= 3.96) check(`tailoring @ ${p}: arrival shares alignment departure`, Math.abs(state.arrive - alignment.alignmentState(p).depart) < EPS);
}
check("tailoring: preceding scene intact", tailoring.tailoringState(3).presence === 0);
check("tailoring: settled at scene 5", tailoring.tailoringState(4).presence === 1);
check("tailoring: gallery scene intact", tailoring.tailoringState(5).presence === 0);
for (const [w,h] of [[1440,900],[1796,782],[1440,760],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]]) {
  const layout = tailoring.tailoringLayout(w,h);
  for (const key of ["original","evidence","suggestion"]) {
    const rect = layout[key];
    check(`tailoring ${w}x${h}/${key}: fits viewport`, rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.x + rect.width <= w && rect.y >= 90 && rect.y + rect.height <= h - 15);
  }
  check(`tailoring ${w}x${h}: core fits`, layout.core.x-layout.diameter/2 >= 0 && layout.core.x+layout.diameter/2 <= w && layout.core.y-layout.diameter/2 >= 90 && layout.core.y+layout.diameter/2 <= h-15);
  for (const [from,to] of [["original","originalIn"],["evidence","evidenceIn"],["output","suggestion"]]) {
    const a = layout.ports[from], b = layout.ports[to];
    const curve = tailoring.tailoringCurve(a,b,layout.portrait);
    check(`tailoring ${w}x${h}/${from}: exact ports`, curve.startsWith(`M${a.x} ${a.y}C`) && curve.endsWith(`${b.x} ${b.y}`));
  }
}
for (const p of [3.28,3.96,4.35,4.98]) check(`tailoring handoff ${p}: continuous`, Math.abs(tailoring.tailoringState(p+.00001).presence-tailoring.tailoringState(p-.00001).presence)<.0001);

// The native reflective gallery shares its arrival clock with the suggestion
// panel. Screen-space bounds reserve the heading, controls and primary CTA.
for (const p of grid) {
  const state = gallery.galleryState(p);
  check(`gallery @ ${p}: values bounded`, Object.values(state).every((value) => finite(value) && value >= 0 && value <= 1));
  check(`gallery @ ${p}: same suggestion handoff clock`, Math.abs(state.arrive - tailoring.tailoringState(p).depart) < EPS);
}
check("gallery: preceding tailoring scene intact", gallery.galleryState(4).presence === 0);
check("gallery: fully present at scene 6", gallery.galleryState(5).presence === 1);
check("gallery: leaves assembly scene intact", gallery.galleryState(6).presence === 0);
check("gallery: one paper until positions converge", gallery.galleryState(5.75).handoff === 0);
check("gallery: no second paper during the remaining approach", gallery.galleryState(5.84).handoff === 0);
check("gallery: assembly owns the final paper", gallery.galleryState(6).handoff === 1);
for (const [w,h] of [[1440,900],[1796,782],[1440,760],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]]) {
  const layout = gallery.galleryLayout(w,h), rect = layout.frame;
  check(`gallery ${w}x${h}: paper fits viewport`, rect.x >= 16 && rect.x + rect.width <= w - 16 && rect.y >= 150 && rect.height > 80);
  check(`gallery ${w}x${h}: controls clear the paper`, rect.y + rect.height <= layout.footerTop - 8);
  check(`gallery ${w}x${h}: floor meets the paper`, Math.abs(layout.floor.y - (rect.y + rect.height)) < 12);
  check(`gallery ${w}x${h}: reversible layout`, JSON.stringify(layout) === JSON.stringify(gallery.galleryLayout(w,h)));
}
for (const p of [4.35,4.98,5.42,5.96]) check(`gallery handoff ${p}: continuous`, Math.abs(gallery.galleryState(p+.00001).presence-gallery.galleryState(p-.00001).presence)<.0001);
const previewIdentity = { personal: true, name: 'A&B <script>alert(1)</script>', firstName: 'A&B', email: 'sample@example.com' };
for (const template of homeTemplates.HOME_TEMPLATES) {
  const svg = decodeURIComponent(homeTemplates.homeTemplateSvg(template, previewIdentity).split(',').slice(1).join(','));
  check(`gallery ${template.slug}: personal values remain text`, svg.includes('A&amp;B') && svg.includes('&lt;script&gt;') && !svg.includes('<script>'));
  const accepted = decodeURIComponent(homeTemplates.homeTemplateSvg(template, undefined, 'accepted').split(',').slice(1).join(','));
  check(`gallery ${template.slug}: accepted wording reaches the real layout`, accepted.includes('reusable React components') && accepted.includes('improving load performance by 31%'));
}

// Assembly uses the gallery's room and the selected layout's real section ports.
check("assembly: stays out of the gallery rest", assembly.assemblyState(5).presence === 0);
check("assembly: approved rest is fully present", assembly.assemblyState(6).presence === 1);
check("assembly: two placed sections at rest", assembly.assemblyState(6).count === 2 && assembly.assemblyState(6).active === 2 && assembly.assemblyState(6).progress === .4);
check("assembly: all sections finish before exit", assembly.assemblyState(6.4).count === 5 && assembly.assemblyState(6.4).progress === 1);
check("assembly: final scene owns its paper", assembly.assemblyState(7).presence === 0 && assembly.assemblyState(7).handoff === 1);
let previousCount = 0;
for (const p of grid) {
  const state = assembly.assemblyState(p), room = assembly.assemblyRoomState(p);
  check("assembly @ "+p+": sections bounded", state.sections.every(value=>finite(value)&&value>=0&&value<=1));
  check("assembly @ "+p+": count follows completed sections", state.count === state.sections.filter(value=>value>=1-EPS).length);
  check("assembly @ "+p+": count is monotone", state.count>=previousCount); previousCount=state.count;
  check("assembly @ "+p+": counter matches progress", state.progress===state.count/5);
  check("assembly @ "+p+": shared gallery handoff clock", Math.abs(state.arrive-gallery.galleryState(p).depart)<EPS);
  check("assembly @ "+p+": room bounded", Object.values(room).every(value=>finite(value)&&value>=0&&value<=1));
  if(p>=5&&p<=6.48)check("assembly @ "+p+": continuous paper and floor", room.presence===1&&room.floor===1);
}
for (const [w,h] of [[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390],[600,390]]) {
  const layout=assembly.assemblyLayout(w,h),paper=layout.paper,status=layout.status;
  const fits=rect=>rect.width>0&&rect.height>0&&rect.x>=0&&rect.y>=90&&rect.x+rect.width<=w+.1&&rect.y+rect.height<=h-4;
  check("assembly "+w+"x"+h+": paper fits",fits(paper));
  check("assembly "+w+"x"+h+": status fits",fits(status));
  check("assembly "+w+"x"+h+": status clears the paper",status.x>=paper.x+paper.width+8||status.y>=paper.y+paper.height+8);
  if(!layout.portrait)check("assembly "+w+"x"+h+": source queue fits",layout.cards.every(fits));
  const start=assembly.assemblyView(w,h,5),end=assembly.assemblyView(w,h,6),old=gallery.galleryLayout(w,h).frame;
  check("assembly "+w+"x"+h+": gallery pose unchanged",Object.keys(old).every(key=>Math.abs(start.frame[key]-old[key])<EPS));
  check("assembly "+w+"x"+h+": exact assembly rest",Object.keys(paper).every(key=>Math.abs(end.frame[key]-paper[key])<EPS));
  check("assembly "+w+"x"+h+": paper rests on the floor",Math.abs(end.floor.y-(paper.y+paper.height))<10);
  for(let index=0;index<5;index++){
    const region=assembly.DEFAULT_ASSEMBLY_REGIONS[index],port=assembly.assemblyPort(region,end),card=layout.cards[index],from={x:card.x+card.width,y:card.y+card.height/2};
    const first=assembly.assemblyCurvePoint(from,port,0),last=assembly.assemblyCurvePoint(from,port,1);
    check("assembly "+w+"/"+index+": travel lands at its port",Math.hypot(first.x-from.x,first.y-from.y)<EPS&&Math.hypot(last.x-port.x,last.y-port.y)<EPS);
    const rect=assembly.assemblyRegionRect(region,end);
    check("assembly "+w+"/"+index+": measured region stays on the page",rect.x>=paper.x&&rect.y>=paper.y&&rect.x+rect.width<=paper.x+paper.width&&rect.y+rect.height<=paper.y+paper.height);
  }
}
for(const p of [5.42,5.96,6.48,6.94])check("assembly handoff "+p+": continuous",Math.abs(assembly.assemblyState(p+.00001).presence-assembly.assemblyState(p-.00001).presence)<.0001);

// Physical A4 and a single continuous room through the podium reveal.
check("preview: exact A4 paper geometry", Math.abs(preview.RESUME_A4.worldWidth / preview.RESUME_A4.worldHeight - 210 / 297) < EPS);
check("preview: the paper rests on the dais", Math.abs(gallery.GALLERY_FRAME.centerY + preview.PREVIEW_RISE - preview.RESUME_A4.worldHeight / 2 - preview.PREVIEW_PODIUM.height) < EPS);
check("preview: does not replace the assembly rest", preview.previewState(6).presence === 0);
check("preview: fully present at final rest", preview.previewState(7).copy === 1);
check("preview: retires before the reading zone", preview.previewState(8).presence === 0);
for (let p = 6.4; p <= 7.15; p += .01) {
  check("preview: no floor or paper fade during transformation", preview.previewRoomState(p).floor === 1 && preview.previewRoomState(p).opacity === 1);
  check("preview: assembly and podium share the clock", Math.abs(preview.previewState(p).arrive - assembly.assemblyState(p).depart) < EPS);
}
for (const [w,h] of [[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]]) {
  const layout = preview.previewLayout(w,h);
  const fits = rect => finite(rect.x,rect.y,rect.width,rect.height) && rect.x >= 0 && rect.y >= 80 && rect.x + rect.width <= w + .1 && rect.y + rect.height <= h + .1;
  check("preview "+w+"x"+h+": A4 preview fits", fits(layout.paper));
  check("preview "+w+"x"+h+": actions fit", fits(layout.actions));
  check("preview "+w+"x"+h+": round dais fits", fits(layout.podium));
  check("preview "+w+"x"+h+": enlarge control fits", fits(layout.enlarge));
  for (const p of [6.48,6.6,6.8,6.94,7,7.5,8]) {
    const a=preview.previewView(w,h,p), b=preview.previewView(w,h,p+.000001);
    check("preview "+w+" @ "+p+": continuous camera and page", Object.keys(a.frame).every(key=>finite(a.frame[key]) && Math.abs(a.frame[key]-b.frame[key]) < .02));
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`✗ ${failures.length} of ${checks} checks failed:`);
  for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log(`✓ cinema samplers OK (${checks} checks)`);
