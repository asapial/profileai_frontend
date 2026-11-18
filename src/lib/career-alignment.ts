import { CARDS, JOB_ROWS, clamp01, smoothstep } from "./career-cinema";
import type { NeuralPoint } from "./career-neural";

export const ALIGNMENT_CARDS = ["card-skills", "card-projects", "card-experience", "card-achievements", "card-education"]
  .map((id) => CARDS.find((card) => card.id === id)!);

/** Only supported relationships get a connector. Missing evidence has no route. */
export const ALIGNMENT_ROUTES = [
  { card: "card-skills", row: 0, tone: "matched", source: "Customer Dashboard · React components" },
  { card: "card-experience", row: 1, tone: "matched", source: "Customer Dashboard · Accessible interfaces" },
  { card: "card-projects", row: 2, tone: "matched", source: "Component library · Shared project work" },
  { card: "card-experience", row: 4, tone: "partial", source: "Project note · Mentored two junior developers" },
] as const;

export function alignmentState(p: number) {
  const arrive = smoothstep(clamp01((p - 2.4) / .56));
  const depart = smoothstep(clamp01((p - 3.28) / .68));
  return {
    arrive, depart,
    presence: arrive * (1 - depart),
    panel: smoothstep(clamp01((arrive - .65) / .35)),
    annotations: smoothstep(clamp01((arrive - .8) / .2)) * (1 - smoothstep(clamp01(depart / .35))),
    connections: smoothstep(clamp01((arrive - .65) / .35)) * (1 - smoothstep(clamp01(depart / .5))),
  };
}

export function alignmentLayout(width: number, height: number, selectedRow: number | null = 0) {
  const portrait = width <= 519;
  const short = height <= 540;
  const compactPhone = portrait && height < 760;
  const gutter = Math.min(76, Math.max(20, width * .05));
  const top = portrait ? compactPhone ? 190 : Math.max(210, height * .26) : short ? 148 : Math.max(236, height * .27);
  const gap = short ? 8 : 14;
  const sourceHeight = compactPhone ? 56 : 72;
  const panelTop = portrait ? top + sourceHeight + 24 : top;
  const bottom = height - (portrait ? compactPhone ? 76 : 90 : short ? 18 : 138);
  const panelX = portrait ? gutter : width * .53;
  const panelWidth = portrait ? width - gutter * 2 : width - panelX - gutter;
  const panelHeight = bottom - panelTop;
  const padding = compactPhone || short ? 12 : portrait || width < 1100 ? 16 : 22;
  const header = compactPhone || short ? 44 : 54;
  const footer = compactPhone || short ? 28 : 42;
  const detail = selectedRow === null || compactPhone || short ? 0 : 36;
  const rowHeight = (panelHeight - padding * 2 - header - footer - detail - 2) / JOB_ROWS.length;
  let offset = padding + header + 1;
  const rows = JOB_ROWS.map((_, index) => {
    const h = rowHeight + (index === selectedRow ? detail : 0);
    const row = { x: panelX + padding + 1, y: panelTop + offset + h / 2, height: h };
    offset += h;
    return row;
  });
  const cardWidth = portrait ? width - gutter * 2 : width * .29;
  const cardHeight = portrait ? sourceHeight : (bottom - top - gap * 4) / 5;
  const cards = ALIGNMENT_CARDS.map((card, index) => ({
    id: card.id, x: portrait ? gutter : gutter + cardWidth,
    y: portrait ? top + sourceHeight / 2 : top + cardHeight / 2 + index * (cardHeight + gap),
  }));
  return { portrait, short, compactPhone, gutter, top, cardWidth, cardHeight, cards, rows,
    panel: { x: panelX, y: panelTop, width: panelWidth, height: panelHeight },
    padding, header, footer, detail, rowHeight };
}

export function alignmentCurve(from: NeuralPoint, to: NeuralPoint, portrait: boolean) {
  if (portrait) return `M${from.x} ${from.y}C${from.x - 16} ${from.y + 28},${to.x - 16} ${to.y - 28},${to.x} ${to.y}`;
  const bend = Math.max(30, (to.x - from.x) * .46);
  return `M${from.x} ${from.y}C${from.x + bend} ${from.y},${to.x - bend} ${to.y},${to.x} ${to.y}`;
}

export function alignmentCardPoint(p: number, target: NeuralPoint, incoming: NeuralPoint | undefined, outgoing: NeuralPoint | undefined) {
  const { depart } = alignmentState(p);
  const point = incoming ?? target;
  const end = outgoing ?? target;
  return { x: point.x + (end.x - point.x) * depart, y: point.y + (end.y - point.y) * depart };
}
