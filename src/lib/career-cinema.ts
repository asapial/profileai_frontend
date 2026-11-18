/**
 * Keyframe data and pure samplers for the ProfileAI cinematic homepage.
 *
 * The story is one continuous 3D world. Nothing is replaced between chapters:
 * every object keeps its identity and travels to a new pose. Scroll progress is
 * measured in "scene units" (0 … 8): the resting pose of chapter N sits on the
 * integer N, transitions happen between integers, and every value can be
 * sampled backwards as well as forwards.
 */

export const SCENE_COUNT = 8;
/** Highest scene unit; the film maps its full travel onto 0 … SCENE_COUNT. */
export const SCENE_SPAN = SCENE_COUNT;
/**
 * Per-segment scroll allocation in viewports (rest n → rest n+1). Act 1 opens
 * on a generous 1.2-viewport frame. Each transformation then gets nearly a full
 * viewport so its source, travel and destination can all be followed.
 */
export const SCENE_DISTANCES = [1.2, 0.9, 0.85, 0.95, 1.0, 1.0, 0.9, 1.0] as const;
/** Total sticky runway in viewports, including the opening sticky frame. */
export const RUNWAY = SCENE_DISTANCES.reduce((sum, step) => sum + step, 0) + 1;

/** Map normalised travel progress (0…1) onto scene units (0…SCENE_SPAN), piecewise. */
export function unitForProgress(progress: number): number {
  const travel = clamp01(progress) * (RUNWAY - 1);
  let start = 0;
  for (let index = 0; index < SCENE_DISTANCES.length; index += 1) {
    const step = SCENE_DISTANCES[index]!;
    if (travel <= start + step || index === SCENE_DISTANCES.length - 1) {
      return index + clamp01((travel - start) / step);
    }
    start += step;
  }
  return SCENE_SPAN;
}

/** Inverse of unitForProgress: normalised travel progress of a scene unit. */
export function progressForUnit(unit: number): number {
  const clamped = Math.max(0, Math.min(SCENE_SPAN, unit));
  const index = Math.min(SCENE_DISTANCES.length - 1, Math.floor(clamped));
  let start = 0;
  for (let i = 0; i < index; i += 1) start += SCENE_DISTANCES[i]!;
  return (start + (clamped - index) * SCENE_DISTANCES[index]!) / (RUNWAY - 1);
}

/** Milliseconds for the exponential response of the scroll, template and pointer drivers. */
export const MOTION = {
  /** Scroll driver: time to close 63% of the gap to its target. */
  driveTau: 90,
  /** Template swap easing. */
  templateTau: 170,
  /** Pointer parallax easing. */
  pointerTau: 220,
} as const;

/**
 * Chapter header hold window. Windows are disjoint: a narrative block is
 * readable around its rest pose — fade in, hold, fade out — and the space
 * between rests stays clear for the object transformation. Exit ≈20%, the
 * transformation gap ≈60%, hold ≈20% of each segment, and never two blocks
 * on screen at once.
 */
export const CHAPTER_WINDOW = { pad: 0.26, fade: 0.16 } as const;

export type CinemaPose = {
  /** World offset in px, origin at stage centre. y is positive downwards. */
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  o?: number;
};

export type CinemaKey = CinemaPose & {
  /** Scene unit of this key. */
  at: number;
  /** Upward arc lifted mid-flight, in px. */
  arc?: number;
  /** Extra forward arc mid-flight, in px. */
  arcZ?: number;
};

export type ValueKey = { at: number; o: number; w?: number };
export type BandMark = { at: number; name: string };

export type CinemaObject = {
  id: string;
  keys: CinemaKey[];
  /** Idle vertical bob amplitude, px. */
  float?: number;
  bands?: BandMark[];
  /** Scene-unit range where the object accepts pointer and keyboard input. */
  interactive?: { from: number; to: number };
};

export type LineTone = "wire" | "matched" | "partial" | "missing";
export type CinemaLine = {
  id: string;
  from: string;
  to: string;
  tone: LineTone;
  keys: ValueKey[];
  /** Endpoint offsets from each object anchor, world px. */
  fromOffset?: { x: number; y: number };
  toOffset?: { x: number; y: number };
  pulse?: number;
};

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const smoothstep = (value: number) => value * value * (3 - 2 * value);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scroll-owned material changes stay in step with the object path in both directions. */
export function sampleEvidence(p: number) {
  return {
    form: smoothstep(clamp01((p - 2.18) / 0.72)),
    match: smoothstep(clamp01((p - 2.52) / 0.4)),
  };
}

const poseOf = (key: CinemaKey): Required<CinemaPose> => ({
  x: key.x,
  y: key.y,
  z: key.z,
  rx: key.rx ?? 0,
  ry: key.ry ?? 0,
  rz: key.rz ?? 0,
  s: key.s ?? 1,
  o: key.o ?? 1,
});

/** Sample a keyframed pose at scene unit p. Segments ease with a soft smoothstep. */
export function samplePose(keys: CinemaKey[], p: number): Required<CinemaPose> {
  const first = keys[0];
  if (!first) return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1 };
  if (p <= first.at) return poseOf(first);
  const last = keys[keys.length - 1]!;
  if (p >= last.at) return poseOf(last);
  let index = 0;
  while (index < keys.length - 1 && keys[index + 1]!.at <= p) index += 1;
  const a = keys[index]!;
  const b = keys[index + 1]!;
  const t = smoothstep(clamp01((p - a.at) / Math.max(1e-6, b.at - a.at)));
  const from = poseOf(a);
  const to = poseOf(b);
  const lift = Math.sin(Math.PI * t);
  return {
    x: mix(from.x, to.x, t),
    y: mix(from.y, to.y, t) - lift * (b.arc ?? 0),
    z: mix(from.z, to.z, t) + lift * (b.arcZ ?? (b.arc ?? 0) * 0.7),
    rx: mix(from.rx, to.rx, t),
    ry: mix(from.ry, to.ry, t),
    rz: mix(from.rz, to.rz, t),
    s: mix(from.s, to.s, t),
    o: mix(from.o, to.o, t),
  };
}

/** Sample a keyframed scalar (line opacity or width) at scene unit p. */
export function sampleValue(keys: ValueKey[], p: number): { o: number; w: number } {
  const first = keys[0];
  if (!first) return { o: 0, w: 1 };
  if (p <= first.at) return { o: first.o, w: first.w ?? 1 };
  const last = keys[keys.length - 1]!;
  if (p >= last.at) return { o: last.o, w: last.w ?? 1 };
  let index = 0;
  while (index < keys.length - 1 && keys[index + 1]!.at <= p) index += 1;
  const a = keys[index]!;
  const b = keys[index + 1]!;
  const t = smoothstep(clamp01((p - a.at) / Math.max(1e-6, b.at - a.at)));
  return { o: mix(a.o, b.o, t), w: mix(a.w ?? 1, b.w ?? 1, t) };
}

/** Trapezoid window used to cross-fade chapter copy. */
export function windowOpacity(p: number, from: number, to: number, fade = 0.2) {
  const ramp = Math.max(1e-3, fade);
  return clamp01(Math.min((p - from) / ramp, (to - p) / ramp, 1));
}

// ── Chapter copy ─────────────────────────────────────────────────────────────

export type ChapterMeta = { kicker: string; title: string; description: string };

export const CHAPTERS: ChapterMeta[] = [
  { kicker: "Chapter 01", title: "Career Universe", description: "Your skills, experience and achievements floating in a dynamic career space." },
  { kicker: "Chapter 02", title: "Evidence Network", description: "Your career data connects and forms a meaningful intelligence network." },
  { kicker: "Chapter 03", title: "Structured Profile", description: "Your real work gets organized into verifiable resume evidence." },
  { kicker: "Chapter 04", title: "Job Alignment", description: "See how your experience matches the job you want with clear insights." },
  { kicker: "Chapter 05", title: "AI Tailoring", description: "Get AI-powered suggestions to make your resume stronger and more impactful." },
  { kicker: "Chapter 06", title: "Resume Style", description: "Professional templates designed for your industry and career goals." },
  { kicker: "Chapter 07", title: "Live Assembly", description: "Your verified content is intelligently placed into your selected template." },
  { kicker: "Chapter 08", title: "Ready", description: "A clean, modern, ATS-friendly resume — ready to download and apply." },
];

export const SCENE_CAPTIONS: { at: number; text: string }[] = [
  { at: 2, text: "Every card keeps a link to the source you confirmed." },
  { at: 3, text: "Missing evidence stays visible. Nothing is invented." },
  { at: 4, text: "You review every change before it touches your resume." },
  { at: 6.2, text: "Watch each section dock into the document." },
];

// ── Persistent objects ───────────────────────────────────────────────────────

export type IconName = "code" | "file" | "briefcase" | "folder" | "trophy" | "graduation" | "sparkles" | "users" | "chart" | "link" | "user" | "download" | "send" | "shield";

export type ChipMeta = { id: string; label: string; icon: IconName; parent: string };

export type CardTone = "violet" | "blue" | "orange" | "pink" | "indigo";

export type CardMeta = {
  id: string;
  title: string;
  note: string;
  icon: IconName;
  tone: CardTone;
  match: { label: string; tone: Exclude<LineTone, "wire"> };
};

export const CARDS: CardMeta[] = [
  { id: "card-summary", title: "Professional summary", note: "Grounded in your experience", icon: "file", tone: "indigo", match: { label: "Strong match", tone: "matched" } },
  { id: "card-skills", title: "Skills", note: "12 technical & soft skills", icon: "chart", tone: "violet", match: { label: "Strong match", tone: "matched" } },
  { id: "card-experience", title: "Work experience", note: "3 source-linked entries", icon: "briefcase", tone: "blue", match: { label: "Strong match", tone: "matched" } },
  { id: "card-projects", title: "Projects", note: "5 projects with evidence", icon: "folder", tone: "orange", match: { label: "Strong match", tone: "matched" } },
  { id: "card-achievements", title: "Achievements", note: "3 measured outcomes", icon: "trophy", tone: "pink", match: { label: "No evidence", tone: "missing" } },
  { id: "card-education", title: "Education", note: "Your academic background", icon: "graduation", tone: "violet", match: { label: "Related experience", tone: "partial" } },
];

export const CHIPS: ChipMeta[] = [
  { id: "chip-react", label: "React", icon: "code", parent: "card-skills" },
  { id: "chip-typescript", label: "TypeScript", icon: "code", parent: "card-skills" },
  { id: "chip-python", label: "Python", icon: "code", parent: "card-skills" },
  { id: "chip-design", label: "Design systems", icon: "sparkles", parent: "card-projects" },
  { id: "chip-opensource", label: "Open source", icon: "folder", parent: "card-projects" },
  { id: "chip-problem", label: "Problem solving", icon: "sparkles", parent: "card-experience" },
  { id: "chip-leadership", label: "Team leadership", icon: "users", parent: "card-experience" },
  { id: "chip-metric", label: "LCP improved 31%", icon: "chart", parent: "card-achievements" },
  { id: "chip-hackathon", label: "Hackathon winner", icon: "trophy", parent: "card-achievements" },
  { id: "chip-education", label: "BSc in Computer Science", icon: "graduation", parent: "card-education" },
];

export type TemplateKey = "editorial" | "technical" | "minimal" | "grid";

/** Cinematic carousel keeps three presentations: content stays, only type,
 *  spacing and layout change between them. */
export const TEMPLATES: { id: TemplateKey; name: string; description: string }[] = [
  { id: "editorial", name: "Editorial", description: "Timeless typography. Quiet presence." },
  { id: "technical", name: "Technical", description: "Clear structure. Confident detail." },
  { id: "minimal", name: "Minimal", description: "Focused content. Room to breathe." },
];

export const JOB_ROWS: { requirement: string; state: string; tone: Exclude<LineTone, "wire">; icon: IconName }[] = [
  { requirement: "React / Next.js", state: "Strong match", tone: "matched", icon: "code" },
  { requirement: "Build user interfaces", state: "Strong match", tone: "matched", icon: "file" },
  { requirement: "Work inside a team", state: "Strong match", tone: "matched", icon: "users" },
  { requirement: "System design knowledge", state: "No evidence", tone: "missing", icon: "folder" },
  { requirement: "Mentor junior developers", state: "Related work", tone: "partial", icon: "graduation" },
];

/** Sections that dock into the document during assembly, in order. */
export const DOCK_LABELS: { label: string; icon: IconName }[] = [
  { label: "Professional summary", icon: "file" },
  { label: "Work experience", icon: "briefcase" },
  { label: "Projects", icon: "folder" },
  { label: "Skills", icon: "chart" },
  { label: "Education", icon: "graduation" },
];

// ── Camera ───────────────────────────────────────────────────────────────────

export const CAMERA_KEYS: CinemaKey[] = [
  { at: 0, x: 250, y: 34, z: -40, rx: 3, ry: 0 },
  { at: 1, x: -200, y: 28, z: -210, rx: 4, ry: -3, arc: 16 },
  { at: 2, x: 180, y: 14, z: -80, rx: 2, ry: 0, arc: 12 },
  { at: 3, x: -22, y: 20, z: -120, rx: 2, ry: 2, arc: 10 },
  { at: 4, x: 0, y: 30, z: -20, rx: 1.5, ry: 0, arc: 10 },
  { at: 5, x: 0, y: 40, z: -270, rx: 4, ry: -2, arc: 16 },
  { at: 6, x: 100, y: 34, z: -150, rx: 1.5, ry: -2, arc: 12 },
  { at: 7, x: 0, y: 22, z: -170, rx: 1, ry: 0, arc: 10 },
  { at: 8, x: 0, y: 20, z: -170, rx: 1, ry: 0 },
];

// ── Object keyframes ─────────────────────────────────────────────────────────

/** [x, y, z, scale, opacity]; null repeats the previous pose at zero opacity. */
type ScenePose = [number, number, number, number?, number?] | null;

function expandScenes(id: string, group: string | undefined, scenes: ScenePose[], float: number): CinemaObject {
  const keys: CinemaKey[] = [];
  let previous: Required<CinemaPose> = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1 };
  scenes.forEach((scene, index) => {
    if (!scene) {
      keys.push({ at: index, x: previous.x, y: previous.y, z: previous.z, s: previous.s, o: 0 });
      return;
    }
    const [x, y, z, s = 1, o = 1] = scene;
    keys.push({ at: index, x, y, z, s, o });
    previous = { ...previous, x, y, z, s, o };
  });
  const lastScene = scenes[scenes.length - 1];
  const lastKey = keys[keys.length - 1]!;
  if (lastScene) keys.push({ ...lastKey, at: scenes.length });
  return { id, keys, float, bands: groupBands(id, group) };
}

function groupBands(id: string, group: string | undefined): BandMark[] | undefined {
  if (group === "card") return [{ at: 0, name: "node" }, { at: 1.85, name: "card" }, { at: 2.85, name: "match" }, { at: 4.3, name: "stack" }, { at: 5.3, name: "gone" }];
  if (group === "template") return [{ at: 0, name: "tpl" }, { at: 5.6, name: "doc" }];
  if (group === "chip") return [{ at: 0, name: "loose" }, { at: 1.55, name: "clustered" }, { at: 2.0, name: "tagged" }];
  return undefined;
}

const chipScenes = (index: number, scenes: ScenePose[]) => expandScenes(CHIPS[index]!.id, "chip", scenes, 2);

/** Chips: scattered → clustered → card tags → match tags → stack → gone. */
const CHIP_SCENES: ScenePose[][] = [
  [[-260, -190, 120], [-305, -185, 140, 0.75], [-470, -150, 110, 0.65], [-500, -196, 60, 0.36, 0], [-180, -56, -150, 0.3, 0], null, null, null],
  [[-250, 110, 170], [-115, -185, 150, 0.75], [-330, -150, 115, 0.65], [-430, -196, 64, 0.36, 0], [-158, -47, -156, 0.3, 0], null, null, null],
  [[270, -210, 90], [-210, -35, 130, 0.75], [-470, -75, 105, 0.65], [-360, -196, 58, 0.36, 0], [-136, -38, -162, 0.3, 0], null, null, null],
  [[-100, 210, 150], [90, -125, 100, 0.75], [-330, -75, 95, 0.65], [-390, -84, 62, 0.36, 0], [-114, -29, -168, 0.3, 0], null, null, null],
  [[290, 100, 70], [250, -230, 110, 0.75], [-470, 0, 100, 0.65], [-470, -84, 66, 0.36, 0], [-92, -20, -174, 0.3, 0], null, null, null],
  [[-310, -20, 60], [-380, 30, 90, 0.75], [-330, 0, 100, 0.65], [-470, 28, 60, 0.36, 0], [-70, -11, -180, 0.3, 0], null, null, null],
  [[-310, 250, 100], [-230, 30, 80, 0.75], [-470, 75, 95, 0.65], [-390, 28, 58, 0.36, 0], [-48, -2, -186, 0.3, 0], null, null, null],
  [[230, -50, 140], [270, 190, 120, 0.75], [-330, 75, 110, 0.65], [-470, 140, 64, 0.36, 0], [-26, 7, -192, 0.3, 0], null, null, null],
  [[240, 260, 130], [145, 254, 110, 0.75], [-470, 150, 100, 0.65], [-390, 140, 60, 0.36, 0], [-4, 16, -198, 0.3, 0], null, null, null],
  [[20, 280, 90], [0, 330, 100, 0.75], [-330, 150, 90, 0.65], [-430, 252, 60, 0.36, 0], [18, 25, -204, 0.3, 0], null, null, null],
];

export const CHIP_OBJECTS: CinemaObject[] = CHIP_SCENES.map((scenes, index) => chipScenes(index, scenes));

// ── Intelligence mesh (scene 02) ─────────────────────────────────────────────

/** Violet-family neuron tones, echoing the reference network palette. */
export const MESH_TONES = ["#b9a1df", "#c5a386", "#c998b6", "#91bfb2", "#a99bd7", "#94b7d2"];
/** Design space of the mesh plane, scaled up by the CSS plane size. */
export const MESH_VIEW = { w: 600, h: 450 };

const meshRound = (value: number) => Number(value.toFixed(2));

/** Deterministic neuron field: deterministic across server and client render. */
export const MESH_NEURONS = Array.from({ length: 84 }, (_, index) => {
  const angle = index * 2.3999632297;
  const radius = Math.sqrt((index + 8) / 92);
  return {
    x: meshRound(300 + Math.cos(angle) * radius * 268),
    y: meshRound(225 + Math.sin(angle) * radius * 198),
    depth: meshRound((Math.sin(index * 1.73) + 1) / 2),
    tone: index % MESH_TONES.length,
  };
});

/** Local-neighbour edges only: each neuron links to its three nearest fellows. */
export const MESH_EDGES: string[] = (() => {
  const edges: string[] = [];
  MESH_NEURONS.forEach((a, i) => {
    const neighbours = MESH_NEURONS
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((n) => n.j !== i && n.d < 128)
      .sort((n, m) => n.d - m.d)
      .slice(0, 3);
    for (const n of neighbours) {
      if (n.j <= i) continue;
      const b = MESH_NEURONS[n.j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const mx = meshRound((a.x + b.x) / 2 - dy * 0.1);
      const my = meshRound((a.y + b.y) / 2 + dx * 0.1);
      edges.push(`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`);
    }
  });
  return edges;
})();

/** The mesh fabric itself: fades in with the network and dissolves into evidence. */
export const MESH: CinemaObject = {
  id: "mesh",
  keys: [
    { at: 0.3, x: 0, y: 6, z: 30, s: 0.9, o: 0 },
    { at: 0.92, x: 0, y: 6, z: 30, s: 1, o: 1 },
    { at: 1.5, x: 0, y: 6, z: 30, s: 1.03, o: 1 },
    { at: 1.9, x: 0, y: 6, z: 30, s: 1.05, o: 0 },
    { at: 8, x: 0, y: 6, z: 30, s: 1.05, o: 0 },
  ],
};

/** Cards are born as network nodes, become evidence cards, then match rows, then a stack.
 *  These world paths supply the early node anchors. The screen-space neural
 *  graph and alignment views own the later presentation and its handoff positions. */
type CardPath = { node: [number, number, number]; grid: [number, number, number]; colY: number | null; ghost: [number, number, number, number]; tail: number };
const CARD_PATHS: Record<string, CardPath> = {
  "card-summary": { node: [0, -10, 120], grid: [-90, -190, 60], colY: null, ghost: [-380, 0, 20, 0], tail: 3.98 },
  "card-skills": { node: [-250, -130, 100], grid: [300, -190, 80], colY: -190, ghost: [-380, 0, 20, 0], tail: 3.98 },
  "card-experience": { node: [-300, 80, 60], grid: [-90, 5, 70], colY: 70, ghost: [-380, 0, 20, 0], tail: 3.98 },
  "card-projects": { node: [150, -180, 70], grid: [-90, 200, 66], colY: -60, ghost: [-380, 0, 20, 0], tail: 3.98 },
  "card-achievements": { node: [200, 160, 90], grid: [300, 5, 72], colY: 200, ghost: [-380, 0, 20, 0], tail: 3.98 },
  "card-education": { node: [0, 270, 70], grid: [300, 200, 64], colY: 330, ghost: [-380, 0, 20, 0], tail: 3.98 },
};

const cardKeys = (path: CardPath): CinemaKey[] => {
  const [nodeX, nodeY, nodeZ] = path.node;
  const [gridX, gridY, gridZ] = path.grid;
  const [ghostX, ghostY, ghostZ, ghostO] = path.ghost;
  const column = path.colY;
  return [
    { at: 0, x: 0, y: 40, z: 80, s: 1, o: 0 },
    { at: 1, x: nodeX, y: nodeY, z: nodeZ, s: column === null ? 0.72 : 1, o: column === null ? 0 : 1 },
    ...(column === null
      ? [{ at: 1.7, x: -30, y: -140, z: 100, s: 0.9, o: 0 } as CinemaKey]
      : []),
    { at: 2, x: gridX, y: gridY, z: gridZ, s: 1, o: 1 },
    { at: column === null ? 2.9 : 3, x: -430, y: column ?? -175, z: 40, s: 0.74, o: column === null ? 0 : 1, arc: 20 },
    { at: 3.26, x: -430, y: column ?? -175, z: 40, s: 0.74, o: column === null ? 0 : 1 },
    { at: 3.72, x: ghostX, y: ghostY, z: ghostZ, s: 0.65, o: column === null ? 0 : 0.8, arc: 20 },
    { at: path.tail, x: ghostX, y: ghostY, z: ghostZ, s: 0.5, o: ghostO, arc: 30 },
    { at: 5.3, x: ghostX, y: ghostY, z: ghostZ, s: 0.5, o: 0 },
    { at: 8, x: ghostX, y: ghostY, z: ghostZ, s: 0.5, o: 0 },
  ];
};

export const CARD_OBJECTS: CinemaObject[] = CARDS.map((card) => ({
  id: card.id,
  float: 1.5,
  bands: groupBands(card.id, "card"),
  keys: cardKeys(CARD_PATHS[card.id]!),
}));

/** Node circles only carry a label while they are still nodes. */
export const CORE: CinemaObject = {
  id: "core",
  float: 4,
  keys: [
    { at: 0, x: 0, y: 40, z: 80 },
    { at: 1, x: 0, y: 10, z: 90, s: 1.12 },
    { at: 1.5, x: -20, y: -34, z: 90, s: 1.05 },
    { at: 1.95, x: -90, y: -190, z: 80, s: 0.8, o: 0, arc: 30 },
    { at: 3.2, x: -360, y: -180, z: -200, s: 0.7, o: 0 },
    { at: 4.5, x: -360, y: -180, z: -240, s: 0.7, o: 0 },
    { at: 5.6, x: 140, y: 10, z: -40, s: 0.85, o: 0 },
    { at: 6.6, x: 0, y: 18, z: 20, s: 1.15, o: 0 },
    { at: 8, x: 0, y: 18, z: 20, s: 1.15, o: 0 },
  ],
};

export const ORB: CinemaObject = {
  id: "orb",
  keys: [
    { at: 0, x: 0, y: -10, z: 60, s: 0.5, o: 0 },
    { at: 3.6, x: 0, y: -10, z: 120, s: 0.6, o: 0 },
    { at: 3.92, x: 0, y: -6, z: 180, s: 1, o: 1 },
    { at: 4.6, x: 0, y: -10, z: 200, s: 1, o: 0.95 },
    { at: 4.98, x: 330, y: -196, z: 250, s: 0.42, o: 0.4, arc: 40 },
    { at: 5.5, x: 428, y: -168, z: 150, s: 0.34, o: 0.25 },
    { at: 6.6, x: 428, y: -168, z: 150, s: 0.34, o: 0.25 },
    { at: 7.35, x: 0, y: -336, z: 220, s: 0.46, o: 0.9, arc: 30 },
    { at: 8, x: 0, y: -342, z: 220, s: 0.46, o: 0.9 },
  ],
};

type PanelSpec = { id: string; keys: CinemaKey[]; interactive?: { from: number; to: number } };

const PANELS: PanelSpec[] = [
  {
    id: "panel-analysis",
    keys: [
      { at: 0.4, x: 500, y: 170, z: 60, s: 0.96, o: 0, ry: -2 },
      { at: 0.64, x: 500, y: 170, z: 60, s: 0.96, o: 0, ry: -2 },
      { at: 0.98, x: 500, y: 170, z: 60, s: 1, o: 1, ry: -2 },
      { at: 1.55, x: 500, y: 170, z: 60, s: 1, o: 1, ry: -2 },
      { at: 1.92, x: 300, y: 20, z: 0, s: 1, o: 0, ry: -8, arc: 30 },
      { at: 3, x: 260, y: 40, z: -260, s: 0.9, o: 0, ry: -8 },
      { at: 8, x: 260, y: 40, z: -260, s: 0.9, o: 0, ry: -8 },
    ],
  },
  {
    id: "panel-job",
    keys: [
      { at: 0, x: 330, y: 10, z: 60, s: 0.96, o: 0 },
      { at: 2.5, x: 330, y: 10, z: 60, s: 0.96, o: 0 },
      { at: 2.92, x: 330, y: 10, z: 60, s: 1, o: 1 },
      { at: 3.26, x: 330, y: 10, z: 60, s: 1, o: 1 },
      { at: 3.66, x: 0, y: -120, z: -100, s: 0.65, o: 0.35, arc: 16 },
      { at: 3.95, x: 0, y: -350, z: -460, s: 0.46, o: 0 },
      { at: 8, x: 0, y: -350, z: -460, s: 0.44, o: 0 },
    ],
  },
  {
    id: "panel-original",
    keys: [
      { at: 3.56, x: -380, y: 0, z: 20, s: 0.65, o: 0, ry: 2 },
      { at: 3.96, x: -380, y: 0, z: 40, s: 1, o: 1, ry: 2 },
      { at: 4.32, x: -380, y: 0, z: 40, s: 1, o: 1, ry: 2 },
      { at: 4.68, x: -80, y: 10, z: 80, s: 0.7, o: 0.8, ry: 0, arc: 18 },
      { at: 4.94, x: 90, y: 10, z: 160, s: 0.38, o: 0, ry: 0 },
      { at: 8, x: -430, y: 10, z: -120, s: 0.9, o: 0, ry: 8 },
    ],
  },
  {
    id: "panel-suggestion",
    keys: [
      { at: 3.55, x: 390, y: 0, z: 60, s: 0.98, o: 0, ry: -4 },
      { at: 3.92, x: 380, y: 0, z: 80, s: 1, o: 1, ry: -4 },
      { at: 4.34, x: 380, y: 0, z: 80, s: 1, o: 1, ry: -2 },
      { at: 4.66, x: 140, y: 10, z: 140, s: 0.8, o: 1, ry: 0, arc: 18 },
      { at: 4.96, x: 90, y: 10, z: 180, s: 0.55, o: 0, ry: 0 },
      { at: 8, x: 430, y: 10, z: -120, s: 0.9, o: 0, ry: -8 },
    ],
    interactive: { from: 3.7, to: 5.4 },
  },
  {
    id: "panel-assembly",
    keys: [
      { at: 5.4, x: 440, y: 30, z: 80, s: 0.96, o: 0, ry: -6 },
      { at: 5.68, x: 440, y: 30, z: 80, s: 0.96, o: 0, ry: -6 },
      { at: 5.96, x: 428, y: 30, z: 80, s: 1, o: 1, ry: -6 },
      { at: 6.6, x: 428, y: 30, z: 80, s: 1, o: 1, ry: -6 },
      { at: 7.32, x: 470, y: 60, z: -140, s: 0.9, o: 0, ry: -8 },
      { at: 8, x: 470, y: 60, z: -140, s: 0.9, o: 0, ry: -8 },
    ],
  },
  {
    id: "panel-final",
    interactive: { from: 6.7, to: 9 },
    keys: [
      { at: 6.62, x: 452, y: 30, z: 60, s: 0.98, o: 0, ry: -5 },
      { at: 6.94, x: 446, y: 30, z: 80, s: 1, o: 1, ry: -5 },
      { at: 8, x: 446, y: 32, z: 84, s: 1, o: 1, ry: -5 },
    ],
  },
  {
    id: "intro-final",
    interactive: { from: 6.7, to: 9 },
    keys: [
      { at: 6.66, x: -462, y: 20, z: 20, s: 1, o: 0, ry: 6 },
      { at: 6.98, x: -456, y: 20, z: 40, s: 1, o: 1, ry: 5 },
      { at: 8, x: -456, y: 22, z: 44, s: 1, o: 1, ry: 5 },
    ],
  },
];

/** Template slot poses. Slot 0 is the selected sheet and becomes the document. */
const TEMPLATE_SLOT_KEYS: CinemaKey[][] = [
  [
    { at: 0, x: 0, y: 10, z: -840, s: 1, o: 0 },
    { at: 4.36, x: 380, y: 0, z: 80, s: 0.7, o: 0 },
    { at: 4.68, x: 140, y: 10, z: 180, s: 0.9, o: 0.55 },
    { at: 5.0, x: 90, y: 10, z: 200, s: 1.04, o: 1, arcZ: 30 },
    { at: 5.6, x: 140, y: 10, z: 60, s: 1.06, ry: -4 },
    { at: 6.05, x: 0, y: 20, z: 130, s: 1.22, ry: 0, arc: 24 },
    { at: 6.9, x: 0, y: 20, z: 130, s: 1.22, ry: 0 },
    { at: 8, x: 0, y: 24, z: 140, s: 1.22, ry: 0 },
  ],
  [
    { at: 0, x: 470, y: 40, z: -840, s: 0.8, o: 0 },
    { at: 4.65, x: 470, y: 40, z: -40, s: 0.8, o: 0, ry: -16 },
    { at: 5.08, x: 470, y: 40, z: -40, s: 0.8, o: 0.92, ry: -16 },
    { at: 5.6, x: 830, y: 130, z: -520, s: 0.6, o: 0.12, ry: -12 },
    { at: 6.5, x: 800, y: 170, z: -560, s: 0.5, o: 0.08, ry: -10 },
    { at: 8, x: 800, y: 170, z: -560, s: 0.5, o: 0.08, ry: -10 },
  ],
  [
    { at: 0, x: -470, y: 40, z: -840, s: 0.8, o: 0 },
    { at: 4.65, x: -470, y: 40, z: -40, s: 0.8, o: 0, ry: 16 },
    { at: 5.08, x: -470, y: 40, z: -40, s: 0.8, o: 0.92, ry: 16 },
    { at: 5.6, x: -830, y: 120, z: -520, s: 0.6, o: 0.12, ry: 12 },
    { at: 6.5, x: -790, y: 160, z: -560, s: 0.5, o: 0.08, ry: 10 },
    { at: 8, x: -790, y: 160, z: -560, s: 0.5, o: 0.08, ry: 10 },
  ],
];

export const TEMPLATE_OBJECTS: CinemaObject[] = TEMPLATES.map((template, index) => ({
  id: `tpl-${template.id}`,
  float: index === 0 ? 3 : 0,
  bands: groupBands(`tpl-${template.id}`, "template"),
  interactive: { from: 4.6, to: 5.7 },
  keys: TEMPLATE_SLOT_KEYS[index]!,
}));

/** Slot arrangement: 0 centre, 1 right, 2 left (relative to selection). */
export function templateSlot(index: number, selectedIndex: number) {
  return (index - selectedIndex + TEMPLATES.length) % TEMPLATES.length;
}
export { TEMPLATE_SLOT_KEYS };

/** Content blocks that dock into the document during assembly. */
export const DOCK_HOLD = 5.5;
export const DOCK_STEP = 0.14;
export const DOCK_TRAVEL = 0.36;
export const BLOCK_OBJECTS: CinemaObject[] = DOCK_LABELS.map((_, index) => {
  const hold = DOCK_HOLD + index * DOCK_STEP;
  const land = hold + DOCK_TRAVEL;
  const stackY = -170 + index * 72;
  const dockY = -136 + index * 76;
  return {
    id: `block-${index}`,
    keys: [
      { at: 0, x: -462, y: stackY, z: 24, s: 0.92, o: 0 },
      { at: 5.24, x: -462, y: stackY, z: 24, s: 0.92, o: 0 },
      { at: 5.46, x: -462, y: stackY, z: 24, s: 0.92, o: 1 },
      { at: hold, x: -470, y: stackY, z: 24, s: 0.92, o: 1 },
      { at: land, x: 0, y: dockY + 20, z: 150, s: 0.8, o: 1, arc: 26 },
      { at: land + 0.1, x: 0, y: dockY + 20, z: 140, s: 0.8, o: 0 },
      { at: 6.9, x: 40, y: dockY - 10, z: 150, s: 0.42, o: 0 },
      { at: 8, x: 40, y: dockY - 10, z: 150, s: 0.42, o: 0 },
    ],
  };
});

export const OBJECTS: CinemaObject[] = [CORE, MESH, ORB, ...CHIP_OBJECTS, ...CARD_OBJECTS, ...TEMPLATE_OBJECTS, ...BLOCK_OBJECTS, ...PANELS.map((panel) => ({ id: panel.id, keys: panel.keys, interactive: panel.interactive }))];

export const OBJECT_BY_ID: ReadonlyMap<string, CinemaObject> = new Map(OBJECTS.map((object) => [object.id, object]));

/** Portrait phones keep the same objects and timeline, with their own readable composition. */
export const COMPACT_CAMERA_KEYS: CinemaKey[] = [200, 70, 40, 50, 100, 60, 60, 0, 0]
  .map((y, at) => ({ at, x: 0, y, z: 0, rx: 0, ry: 0 }));

const compactKeys = (points: [number, number, number, number?][]): CinemaKey[] =>
  points.map(([at, x, y, s = 1]) => ({ at, x, y, z: 0, s }));

const COMPACT_LAYOUTS: Record<string, CinemaKey[]> = {
  core: compactKeys([[0, 0, 55, .8], [1, 0, 0, .65], [1.95, -116, -110, .4]]),
  mesh: compactKeys([[0, 0, 0, .85]]),
  orb: compactKeys([[0, 200, -25, .4]]),
  'panel-analysis': compactKeys([[0, 0, 250, .9]]),
  'panel-job': compactKeys([[0, 0, 30]]),
  'panel-original': compactKeys([[0, 0, -130, .85], [4.32, 0, -130, .85], [4.94, 0, 40, .55]]),
  'panel-suggestion': compactKeys([[0, 0, 160, .95], [4.34, 0, 160, .95], [4.96, 0, 40, .65]]),
  'panel-final': compactKeys([[0, 0, 245, .85]]),
  'intro-final': compactKeys([[0, 0, -300]]),
  ...Object.fromEntries(CARDS.map((card, index) => {
    const nodes = [[0, -20], [-145, -125], [-145, 100], [145, -125], [145, 100], [0, 175]];
    const [nx, ny] = nodes[index]!;
    const gx = index % 2 ? 116 : -116;
    const gy = -110 + Math.floor(index / 2) * 150;
    return [card.id, compactKeys([[0, nx!, ny!, .6], [1, nx!, ny!, .6], [2, gx, gy], [2.8, 0, 30, .65]])];
  })),
};

const COMPACT_TEMPLATE_KEYS = compactKeys([[4.36, 0, 160, .65], [4.68, 0, 80, .85], [5, 0, 40], [6, 0, 10], [6.7, 0, -90, .55], [8, 0, -90, .55]]);

/** Reframe before projecting: shrinking a wide desktop world would make phone text illegible. */
export function sampleCompactPose(id: string, p: number, pose: Required<CinemaPose>, selected = true): Required<CinemaPose> {
  if (id === 'panel-assembly') return { ...pose, o: 0 };
  let layout = COMPACT_LAYOUTS[id];
  if (id.startsWith('tpl-')) {
    if (!selected) return { ...pose, o: 0 };
    layout = COMPACT_TEMPLATE_KEYS;
  }
  const compact = layout ? samplePose(layout, p) : null;
  const result = {
    ...pose,
    x: compact?.x ?? pose.x,
    y: compact?.y ?? pose.y,
    z: Math.max(-80, Math.min(60, pose.z * .3)),
    rx: 0, ry: 0, rz: 0,
    s: compact?.s ?? pose.s,
  };
  if (id.startsWith('card-')) result.o *= 1 - smoothstep(clamp01((p - 2.35) / .45));
  if (id.startsWith('chip-')) {
    const index = CHIPS.findIndex((chip) => chip.id === id);
    const positions = [[-135, -80], [0, 180], [140, -60]];
    const [x, y] = positions[index % 3]!;
    result.x = x!;
    result.y = y!;
    result.s = .9;
    result.o *= 1 - smoothstep(clamp01((p - 1.25) / .65));
  }
  if (id.startsWith('block-')) {
    result.x = pose.x * .38;
    result.s = pose.s * .72;
  }
  if (id === 'orb') result.o *= 1 - smoothstep(clamp01((p - 4.65) / .3));
  return result;
}

// ── Connection lines ─────────────────────────────────────────────────────────

const lineOpacity = (values: [number, number][]): ValueKey[] => values.map(([at, o]) => ({ at, o }));

export const LINES: CinemaLine[] = [
  ...CHIPS.map((chip, index) => ({
    id: `l-core-${chip.id}`,
    from: "core",
    to: chip.id,
    tone: "wire" as LineTone,
    keys: lineOpacity([[0, 0.42], [0.9, 0.3], [1.5, 0.08], [1.8, 0]]),
    pulse: index % 3 === 0 ? 1 : 0,
  })),
  ...CARD_OBJECTS.filter((card) => card.id !== "card-summary").map((card) => ({
    id: `l-core-${card.id}`,
    from: "core",
    to: card.id,
    tone: "wire" as LineTone,
    keys: lineOpacity([[0.6, 0], [0.98, 0.72], [1.6, 0.5], [2.1, 0.16], [2.6, 0]]),
    pulse: 1,
  })),
  ...CHIPS.map((chip) => ({
    id: `l-${chip.id}-parent`,
    from: chip.id,
    to: chip.parent,
    tone: "wire" as LineTone,
    keys: lineOpacity([[0.55, 0], [0.95, 0.5], [1.75, 0.45], [2.0, 0.14], [2.6, 0.12], [3.2, 0.08], [4.2, 0]]),
    pulse: 1,
  })),
  ...BLOCK_OBJECTS.map((_, index) => ({
    id: `l-block-${index}`,
    from: `block-${index}`,
    to: "selected",
    tone: "wire" as LineTone,
    keys: lineOpacity([[DOCK_HOLD + index * DOCK_STEP, 0], [DOCK_HOLD + index * DOCK_STEP + 0.1, 0.8], [DOCK_HOLD + index * DOCK_STEP + DOCK_TRAVEL + 0.1, 0]]),
    toOffset: { x: 0, y: -136 + index * 76 },
  })),
  ...JOB_ROWS.map((row, index) => ({
    id: `l-doc-action-${index}`,
    from: "selected",
    to: "panel-final",
    tone: row.tone as LineTone,
    keys: lineOpacity([[6.7, 0], [6.98, 0.5], [8, 0.5]]),
    fromOffset: { x: 120, y: -150 + index * 62 },
    toOffset: { x: -180, y: -132 + index * 62 },
  })),
];

export const LINE_OBJECTS: CinemaLine[] = LINES;

/** Docked section count during scene 07 assembly. */
export function dockedCount(p: number) {
  return Math.max(0, Math.min(DOCK_LABELS.length, Math.floor((p - (DOCK_HOLD + DOCK_TRAVEL) + 1e-9) / DOCK_STEP) + 1));
}
