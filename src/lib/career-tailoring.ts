import { clamp01, smoothstep } from "./career-cinema";
import type { NeuralPoint } from "./career-neural";

export type TailoringRect = { x: number; y: number; width: number; height: number };
export type TailoringDecision = "pending" | "accepted" | "rejected";
export const TAILORING_ORIGINAL = "Worked on frontend development tasks and fixed bugs.";

/**
 * Scene-05 tailored sentence, split so the phrases that come from the user's
 * evidence can be highlighted as word-level diff against the original.
 */
export const TAILORING_PARTS: { text: string; fresh?: boolean }[] = [
  { text: "Developed " },
  { text: "reusable React components", fresh: true },
  { text: " for a customer dashboard, " },
  { text: "improving load performance by 31%", fresh: true },
  { text: "." },
];

/** Share the previous scene's departure clock so its surfaces hand off in place. */
export function tailoringState(p: number) {
  const arrive = smoothstep(clamp01((p - 3.28) / .68));
  const depart = smoothstep(clamp01((p - 4.35) / .63));
  return {
    arrive, depart, presence: arrive * (1 - depart),
    surface: smoothstep(clamp01((arrive - .38) / .62)),
    copy: smoothstep(clamp01((arrive - .74) / .26)) * (1 - smoothstep(clamp01(depart / .45))),
    lines: smoothstep(clamp01((arrive - .8) / .2)) * (1 - smoothstep(clamp01(depart / .55))),
  };
}

export function tailoringLayout(width: number, height: number) {
  const portrait = width <= 599;
  const short = !portrait && height <= 540;
  const compact = portrait && height < 760;
  const gutter = Math.min(88, Math.max(20, width * .05));
  const top = portrait ? compact ? width <= 359 ? 206 : 192 : Math.max(208, height * .245) : short ? 154 : Math.max(240, height * .285);
  const bottom = height - (portrait ? compact ? 76 : 88 : short ? 18 : 138);
  const panelHeight = Math.min(short ? 260 : 470, bottom - top);
  let original: TailoringRect;
  let evidence: TailoringRect;
  let suggestion: TailoringRect;
  let core: NeuralPoint;
  let diameter: number;
  if (portrait) {
    const contentWidth = width - gutter * 2;
    const originalHeight = compact ? height < 700 ? 90 : 110 : 100;
    const evidenceHeight = compact ? originalHeight : 104;
    original = { x: gutter, y: top, width: contentWidth, height: originalHeight };
    evidence = { x: gutter, y: compact ? top : top + originalHeight + 12, width: contentWidth, height: evidenceHeight };
    diameter = compact ? 38 : 44;
    const inputBottom = evidence.y + evidence.height;
    core = { x: gutter + diameter / 2 + 8, y: inputBottom + 12 + diameter / 2 };
    const suggestionTop = core.y + diameter / 2 + 12;
    suggestion = { x: gutter, y: suggestionTop, width: contentWidth, height: bottom - suggestionTop };
  } else {
    const leftWidth = width * .3;
    const gap = short ? 10 : 28;
    const originalHeight = (panelHeight - gap) * .49;
    original = { x: gutter, y: top, width: leftWidth, height: originalHeight };
    evidence = { x: gutter, y: top + originalHeight + gap, width: leftWidth, height: panelHeight - originalHeight - gap };
    suggestion = { x: width * .55, y: top, width: width * .45 - gutter, height: panelHeight };
    diameter = short ? 54 : width < 1100 ? 76 : 116;
    core = { x: width * .457, y: top + panelHeight * .48 };
  }
  const ports = {
    original: { x: original.x + original.width, y: original.y + original.height * .56 },
    evidence: { x: evidence.x + evidence.width, y: evidence.y + evidence.height * .5 },
    originalIn: { x: core.x - diameter / 2, y: core.y - diameter * .1 },
    evidenceIn: { x: core.x - diameter / 2, y: core.y + diameter * .1 },
    output: { x: core.x + diameter / 2, y: core.y },
    suggestion: { x: suggestion.x, y: core.y },
  };
  if (portrait) {
    ports.original = { x: original.x + 12, y: original.y + original.height };
    ports.evidence = { x: evidence.x + 12, y: evidence.y + evidence.height };
    ports.originalIn = { x: core.x, y: core.y - diameter / 2 };
    ports.evidenceIn = ports.originalIn;
    ports.output = { x: core.x, y: core.y + diameter / 2 };
    ports.suggestion = { x: suggestion.x + 12, y: suggestion.y };
  }
  return { portrait, compact, short, gutter, top, original, evidence, suggestion, core, diameter, ports };
}

export function tailoringCurve(from: NeuralPoint, to: NeuralPoint, portrait: boolean) {
  if (portrait) {
    const bend = Math.max(8, Math.abs(to.y - from.y) * .45);
    return `M${from.x} ${from.y}C${from.x} ${from.y + bend},${to.x} ${to.y - bend},${to.x} ${to.y}`;
  }
  const bend = Math.max(20, (to.x - from.x) * .52);
  return `M${from.x} ${from.y}C${from.x + bend} ${from.y},${to.x - bend} ${to.y},${to.x} ${to.y}`;
}

export const tailoringCenter = (rect: TailoringRect): NeuralPoint => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
