import { clamp01, smoothstep } from "./career-cinema";
import { GALLERY_FRAME, RESUME_A4, galleryLayout, galleryState, projectGalleryPoint, type GalleryPoint, type GalleryRect } from "./career-gallery";

export const ASSEMBLY_KEYS = ["summary", "experience", "projects", "skills", "education"] as const;
export type AssemblyKey = (typeof ASSEMBLY_KEYS)[number];
export type AssemblyRegion = GalleryRect;
export type AssemblyRegions = readonly AssemblyRegion[];
export type AssemblyCamera = { width: number; height: number; zoom: number; shiftX: number; shiftY: number; eyeY?: number };
export const ASSEMBLY_LANDINGS = [5.78, 5.93, 6.08, 6.23, 6.38] as const;
export const ASSEMBLY_TRAVEL = .15;

/** Bounds are replaced by measurements of the actual selected catalog HTML. */
export const DEFAULT_ASSEMBLY_REGIONS: AssemblyRegions = [
  { x: .055, y: .155, width: .61, height: .065 },
  { x: .055, y: .23, width: .61, height: .105 },
  { x: .055, y: .35, width: .61, height: .105 },
  { x: .705, y: .155, width: .24, height: .085 },
  { x: .705, y: .25, width: .24, height: .08 },
];

export function assemblyState(p: number) {
  const arrive = galleryState(p).depart;
  const depart = smoothstep(clamp01((p - 6.48) / .46));
  const handoff = smoothstep(clamp01((depart - .95) / .05));
  const sections = ASSEMBLY_LANDINGS.map((land) => smoothstep(clamp01((p - land + ASSEMBLY_TRAVEL) / ASSEMBLY_TRAVEL)));
  const count = ASSEMBLY_LANDINGS.filter((land) => p >= land - 1e-8).length;
  return { arrive, depart, handoff, presence: arrive * (1 - depart),
    copy: smoothstep(clamp01((arrive - .55) / .45)) * (1 - smoothstep(clamp01(depart / .65))),
    sections, count, active: Math.min(count, 4), complete: count === 5,
    progress: count / 5 };
}

/** One room owns the paper and mirror through gallery AND assembly. */
export function assemblyRoomState(p: number) {
  const gallery = galleryState(p), assembly = assemblyState(p);
  return { presence: gallery.arrive * (1 - assembly.depart),
    opacity: Math.min(1, gallery.arrive * 2) * (1 - assembly.handoff),
    floor: smoothstep(clamp01((gallery.arrive - .25) / .75)) * (1 - assembly.depart) };
}

export function projectAssemblyPaper(camera: AssemblyCamera): GalleryRect {
  const top = GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, bottom = GALLERY_FRAME.centerY - GALLERY_FRAME.height / 2;
  const a = projectGalleryPoint(-GALLERY_FRAME.width / 2, top, .045, camera);
  const b = projectGalleryPoint(GALLERY_FRAME.width / 2, top, .045, camera);
  const c = projectGalleryPoint(0, bottom, .045, camera);
  return { x: a.x, y: a.y, width: b.x - a.x, height: c.y - a.y };
}

export function assemblyLayout(width: number, height: number) {
  const portrait = width <= 599, short = !portrait && height <= 660, compact = portrait && height < 760, wide = width >= 1000 && !short;
  const gutter = portrait ? 20 : short ? 24 : width < 1000 ? 28 : Math.min(88, width * .05);
  const pickerTop = compact ? width <= 359 ? 218 : 196 : 206;
  const top = portrait ? pickerTop + 60 : short ? height <= 540 ? 158 : 230 : Math.max(230, height * .245);
  const statusHeight = portrait ? width <= 359 ? 148 : 130 : short ? width < 740 ? 196 : 184 : wide ? 370 : 148;
  const bottomReserve = portrait ? 80 : short ? 24 : wide ? 120 : 88;
  const paperHeight = Math.max(90, Math.min(height * (short ? .48 : wide ? .64 : .55), height - top - bottomReserve - (wide || short ? 0 : statusHeight + 14)));
  const base = galleryLayout(width, height);
  const zoom = base.zoom * paperHeight / base.frame.height;
  const paperWidth = base.frame.width * paperHeight / base.frame.height;
  const queueWidth = portrait ? width - 40 : short ? Math.min(174, width * .21) : wide ? Math.min(350, width * .245) : Math.min(210, width * .25);
  const statusWidth = portrait ? width - 40 : short ? Math.min(214, width * .25) : wide ? Math.min(350, width * .225) : paperWidth;
  const paperCenter = portrait ? width / 2 : short ? width * .51 : wide ? width * .53 : width - gutter - paperWidth / 2;
  const natural = projectGalleryPoint(0, GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, .045, { width, height, zoom, shiftY: 0 });
  const camera: AssemblyCamera = { width, height, zoom, shiftX: paperCenter - width / 2, shiftY: top - natural.y };
  const paper = projectAssemblyPaper(camera), floor = projectGalleryPoint(0, 0, 0, camera);
  const gap = short ? 4 : 14;
  const rowHeight = short ? 44 : Math.min(wide ? 68 : 72, Math.max(44, Math.floor((height - top - 50 - gap * 4) / 5)));
  const queueHeight = rowHeight * 5 + gap * 4;
  const queueTop = portrait ? pickerTop : short ? top - 12 : Math.max(top + 24, top + (paper.height - queueHeight) / 2);
  const cards = ASSEMBLY_KEYS.map((key, index) => ({ key, x: gutter, y: queueTop + index * (rowHeight + gap), width: queueWidth, height: rowHeight }));
  const status: GalleryRect = { x: portrait ? gutter : wide || short ? width - gutter - statusWidth : paper.x,
    y: portrait || !wide && !short ? paper.y + paper.height + 14 : Math.max(top + 30, top + (paper.height - statusHeight) / 2),
    width: statusWidth, height: statusHeight };
  return { width, height, portrait, compact, short, wide, gutter, top, pickerTop, camera, paper, floor, cards, status };
}

export function assemblyView(width: number, height: number, p: number) {
  const gallery = galleryLayout(width, height), layout = assemblyLayout(width, height), amount = assemblyState(p).arrive;
  const camera: AssemblyCamera = { width, height,
    zoom: gallery.zoom + (layout.camera.zoom - gallery.zoom) * amount,
    shiftX: layout.camera.shiftX * amount,
    shiftY: gallery.shiftY + (layout.camera.shiftY - gallery.shiftY) * amount };
  return { ...camera, frame: projectAssemblyPaper(camera), floor: projectGalleryPoint(0, 0, 0, camera) };
}

/** Project the front texture, rather than estimating a section from row order. */
export function assemblyRegionRect(region: AssemblyRegion, camera: AssemblyCamera): GalleryRect {
  const x = (u: number) => -RESUME_A4.worldWidth / 2 + u * RESUME_A4.worldWidth;
  const y = (v: number) => GALLERY_FRAME.centerY + RESUME_A4.worldHeight / 2 - v * RESUME_A4.worldHeight;
  const corners = [[region.x, region.y], [region.x + region.width, region.y], [region.x, region.y + region.height], [region.x + region.width, region.y + region.height]]
    .map(([u,v]) => projectGalleryPoint(x(u!), y(v!), .044, camera));
  const left = Math.min(...corners.map((point) => point.x)), top = Math.min(...corners.map((point) => point.y));
  return { x: left, y: top, width: Math.max(...corners.map((point) => point.x)) - left, height: Math.max(...corners.map((point) => point.y)) - top };
}

export function assemblyPort(region: AssemblyRegion, camera: AssemblyCamera): GalleryPoint {
  const y = GALLERY_FRAME.centerY + RESUME_A4.worldHeight / 2 - (region.y + Math.min(region.height * .5, .04)) * RESUME_A4.worldHeight;
  return projectGalleryPoint(-GALLERY_FRAME.width / 2 - .035, y, .045, camera);
}
export function assemblyCurve(from: GalleryPoint, to: GalleryPoint) {
  const bend = Math.max(24, (to.x - from.x) * .46);
  return "M" + from.x + " " + from.y + "C" + (from.x + bend) + " " + from.y + " " + (to.x - bend) + " " + to.y + " " + to.x + " " + to.y;
}
export function assemblyCurvePoint(from: GalleryPoint, to: GalleryPoint, t: number): GalleryPoint {
  const bend = Math.max(24, (to.x - from.x) * .46), a = 1 - t;
  return { x: a*a*a*from.x + 3*a*a*t*(from.x+bend) + 3*a*t*t*(to.x-bend) + t*t*t*to.x,
    y: a*a*a*from.y + 3*a*a*t*from.y + 3*a*t*t*to.y + t*t*t*to.y };
}
