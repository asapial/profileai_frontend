import { clamp01, smoothstep } from "./career-cinema";

export type NeuralPoint = { x: number; y: number };

/** The graph reuses the career evidence already present in the film. */
export const NEURAL_INPUTS = [
  { id: "chip-react", label: "React", output: "card-skills", source: "Project note · Customer Dashboard", detail: "Built reusable React components for a customer dashboard." },
  { id: "chip-typescript", label: "TypeScript", output: "card-skills", source: "Project note · Component library", detail: "Built accessible interfaces with React and TypeScript." },
  { id: "chip-python", label: "Python", output: "card-projects", source: "Project notes · Skills", detail: "Python stays linked to the project evidence you supplied." },
  { id: "chip-design", label: "Project notes", output: "card-summary", source: "Master resume · Professional summary", detail: "Frontend engineer building accessible products and design systems." },
  { id: "chip-leadership", label: "Team leadership", output: "card-achievements", source: "Project note · Mentoring", detail: "Mentored two juniors through their first releases." },
  { id: "chip-metric", label: "LCP improved 31%", output: "card-experience", source: "Lighthouse report · Q3", detail: "LCP improved from 2.9s to 2.0s." },
  { id: "chip-opensource", label: "Open source", output: "card-projects", source: "Project note · Component library", detail: "A shared component library with accessible interfaces." },
  { id: "chip-education", label: "Education", output: "card-education", source: "Education record", detail: "BSc in Computer Science." },
] as const;

export const NEURAL_OUTPUTS = [
  "card-summary", "card-skills", "card-experience", "card-achievements", "card-projects", "card-education",
] as const;
export const NEURAL_LAYERS = [8, 9, 9, 8, 6] as const;
export const NEURAL_DEFAULT_INPUT = 5;

export const NEURAL_NODES = NEURAL_LAYERS.flatMap((count, layer) =>
  Array.from({ length: count }, (_, row) => ({ id: `${layer}-${row}`, layer, row })),
);

/** Adjacent layers only. Edge identity stays stable throughout the morph. */
export const NEURAL_EDGES = NEURAL_NODES.flatMap((node, from) => {
  const next = NEURAL_NODES.flatMap((target, to) => target.layer === node.layer + 1 ? [to] : []);
  return next.map((to) => ({ id: `${node.id}:${NEURAL_NODES[to]!.id}`, from, to }));
});

export function neuralRoute(input: number): number[] {
  const safe = Math.max(0, Math.min(NEURAL_INPUTS.length - 1, Math.round(input)));
  const output = NEURAL_OUTPUTS.indexOf(NEURAL_INPUTS[safe]!.output);
  const rows = [safe, (safe + 2) % 9, (safe + 7) % 9, (safe + 1) % 8, output];
  return rows.map((row, layer) => NEURAL_NODES.findIndex((node) => node.layer === layer && node.row === row));
}

/** Scroll owns both directions; there are no timed scene swaps. */
export function neuralFocus(p: number): number {
  return smoothstep(clamp01((p - 1.12) / .7)) * (1 - smoothstep(clamp01((p - 2.2) / .7)));
}

export function neuralLayout(width: number, height: number) {
  const portrait = width <= 519;
  const short = height <= 540;
  const tablet = width < 1300;
  const gutter = Math.min(76, Math.max(20, width * .05));
  const top = portrait ? Math.max(292, height * .385) : short ? 164 : tablet ? Math.max(340, height * .34) : Math.max(180, height * .22);
  const bottom = portrait ? Math.max(top + 100, height - 270) : short ? height - 34 : height * .82;
  const xs = tablet
    ? [width * .24, width * .36, width * .48, width * .6, width * .72]
    : [width * .39, width * .48, width * .57, width * .66, width * .75];
  const points = NEURAL_NODES.map(({ layer, row }) => {
    const count = NEURAL_LAYERS[layer]!;
    if (portrait) return {
      x: gutter + 8 + row * (width - (gutter + 8) * 2) / (count - 1),
      y: top + layer * (bottom - top) / 4,
    };
    return { x: xs[layer]!, y: top + row * (bottom - top) / (count - 1) };
  });
  return { points, portrait, short, gutter, top, bottom, xs };
}

/** Anchors are the projected positions of the same chips, mesh and output cards. */
export function sampleNeuralPoints(p: number, target: NeuralPoint[], anchors: NeuralPoint[]): NeuralPoint[] {
  const focus = neuralFocus(p);
  return target.map((point, index) => {
    const origin = anchors[index] ?? point;
    return { x: origin.x + (point.x - origin.x) * focus, y: origin.y + (point.y - origin.y) * focus };
  });
}
