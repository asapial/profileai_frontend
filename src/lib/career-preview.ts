import { clamp01, smoothstep } from "./career-cinema";
import { assemblyState, assemblyView, projectAssemblyPaper, type AssemblyCamera } from "./career-assembly";
import { GALLERY_FRAME, RESUME_A4, galleryState, projectGalleryPoint, type GalleryRect } from "./career-gallery";

export { RESUME_A4 } from "./career-gallery";
export const PREVIEW_PODIUM = { radius: 2.38, height: .48 } as const;
export const PREVIEW_YAW = -.065;
export const PREVIEW_RISE = PREVIEW_PODIUM.height - (GALLERY_FRAME.centerY - RESUME_A4.worldHeight / 2);

/** The completed assembly becomes the same paper on a raised display dais. */
export function previewState(p: number) {
  const arrive = assemblyState(p).depart;
  const depart = smoothstep(clamp01((p - 7.15) / .85));
  return { arrive, depart, presence: arrive * (1 - depart),
    copy: smoothstep(clamp01((arrive - .38) / .62)) * (1 - smoothstep(clamp01(depart / .8))) };
}

/** One mirror and one selected paper continue through all three scenes. */
export function previewRoomState(p: number) {
  const gallery = galleryState(p), preview = previewState(p);
  return { presence: gallery.arrive * (1 - preview.depart),
    opacity: Math.min(1, gallery.arrive * 2) * (1 - preview.depart),
    floor: smoothstep(clamp01((gallery.arrive - .25) / .75)) * (1 - preview.depart) };
}

export function projectPreviewPaper(camera: AssemblyCamera, amount = 1): GalleryRect {
  const yaw = PREVIEW_YAW * amount, centerY = GALLERY_FRAME.centerY + PREVIEW_RISE * amount;
  const points = [-1, 1].flatMap((side) => [-1, 1].map((vertical) => {
    const x = side * RESUME_A4.worldWidth / 2, z = .044;
    return projectGalleryPoint(x * Math.cos(yaw) + z * Math.sin(yaw), centerY + vertical * RESUME_A4.worldHeight / 2, -x * Math.sin(yaw) + z * Math.cos(yaw), camera);
  }));
  const x = Math.min(...points.map((point) => point.x)), y = Math.min(...points.map((point) => point.y));
  return { x, y, width: Math.max(...points.map((point) => point.x)) - x, height: Math.max(...points.map((point) => point.y)) - y };
}

export function projectPreviewPodium(camera: AssemblyCamera, amount = 1): GalleryRect {
  const points = Array.from({ length: 48 }, (_, index) => index * Math.PI / 24).flatMap((angle) => [0, PREVIEW_PODIUM.height * amount].map((y) => projectGalleryPoint(Math.cos(angle) * PREVIEW_PODIUM.radius, y, Math.sin(angle) * PREVIEW_PODIUM.radius, camera)));
  const x = Math.min(...points.map((point) => point.x)), y = Math.min(...points.map((point) => point.y));
  return { x, y, width: Math.max(...points.map((point) => point.x)) - x, height: Math.max(...points.map((point) => point.y)) - y };
}

export function previewLayout(width: number, height: number) {
  const portrait = width < 600, short = !portrait && height <= 660, wide = width >= 1100 && !short;
  const compact = portrait && height < 760;
  const gutter = portrait ? 20 : short ? 24 : width < 1100 ? 28 : Math.min(88, width * .05);
  const top = portrait ? compact ? width <= 359 ? 208 : 188 : 212 : short ? 164 : Math.max(230, height * .245);
  const exportHeight = portrait ? width <= 359 ? 234 : 218 : short ? 200 : 410;
  const maxPaperHeight = portrait ? height - top - exportHeight - 76 : short ? height - top - 66 : (height - top - 76) / 1.2;
  const maxPaperWidth = portrait ? width - 80 : short ? width * .22 : wide ? width * .32 : Math.max(150,(width - gutter * 3 - 260) / 1.25);
  const paperHeight = Math.max(76, Math.min(height * (portrait ? .39 : .61), maxPaperHeight, maxPaperWidth * RESUME_A4.height / RESUME_A4.width));
  const eyeY = 2;
  const natural = projectPreviewPaper({ width, height, zoom: 1, shiftX: 0, shiftY: 0, eyeY });
  const zoom = paperHeight / natural.height;
  const projected = projectPreviewPaper({ width, height, zoom, shiftX: 0, shiftY: 0, eyeY });
  const projectedPodium = projectPreviewPodium({ width, height, zoom, shiftX: 0, shiftY: 0, eyeY });
  const center = portrait ? width / 2 : short ? width * .49 : wide ? width * .51 : width - gutter - projectedPodium.width / 2;
  const camera: AssemblyCamera = { width, height, zoom, eyeY, shiftX: center - projected.x - projected.width / 2, shiftY: top - projected.y };
  const paper = projectPreviewPaper(camera), podium = projectPreviewPodium(camera);
  const panelWidth = portrait ? width - gutter * 2 : short ? Math.min(260, width * .31) : wide ? Math.min(360, width * .245) : Math.min(350,Math.max(250, paper.x - gutter * 2));
  const actions: GalleryRect = { x: portrait || !wide && !short ? gutter : width - gutter - panelWidth,
    y: portrait ? Math.max(podium.y + podium.height + 12, height - exportHeight - 20) : short ? top - 3 : Math.max(top + 32, top + (paper.height - exportHeight) / 2), width: panelWidth, height: exportHeight };
  const proof: GalleryRect = { x: gutter, y: short ? top + 5 : Math.max(top + 60, top + (paper.height - 332) / 2), width: wide ? Math.min(350, width * .25) : Math.min(216, width * .24), height: short ? 172 : 332 };
  const enlarge: GalleryRect = portrait || short ? { x: Math.min(width - 64, podium.x + podium.width + 8), y: paper.y + paper.height - 38, width: 44, height: 44 }
    : { x: center - 85, y: podium.y + podium.height + 12, width: 170, height: 44 };
  return { width, height, portrait, compact, short, wide, gutter, top, camera, paper, podium, actions, proof, enlarge };
}

export function previewView(width: number, height: number, p: number) {
  const source = assemblyView(width, height, p), target = previewLayout(width, height).camera, state = previewState(p);
  const camera: AssemblyCamera = { width, height, zoom: (source.zoom + (target.zoom - source.zoom) * state.arrive) * (1 - state.depart * .08),
    eyeY: 3.6 + ((target.eyeY ?? 3.6) - 3.6) * state.arrive,
    shiftX: source.shiftX + (target.shiftX - source.shiftX) * state.arrive,
    shiftY: source.shiftY + (target.shiftY - source.shiftY) * state.arrive - state.depart * 20 };
  const shell = projectAssemblyPaper(camera), paper = projectPreviewPaper(camera, state.arrive);
  const frame = { x: shell.x + (paper.x - shell.x) * state.arrive, y: shell.y + (paper.y - shell.y) * state.arrive,
    width: shell.width + (paper.width - shell.width) * state.arrive, height: shell.height + (paper.height - shell.height) * state.arrive };
  return { ...camera, frame, floor: projectGalleryPoint(0, 0, 0, camera), podium: projectPreviewPodium(camera, state.arrive) };
}
