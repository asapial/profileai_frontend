import { clamp01, smoothstep } from "./career-cinema";

export type GalleryPoint = { x: number; y: number };
export type GalleryRect = GalleryPoint & { width: number; height: number };
export type GalleryHandoff = { document: GalleryRect };
/** Physical paper dimensions stay consistent across the shared 3D room. */
export const RESUME_A4 = { width: 210, height: 297, worldWidth: 3.15, worldHeight: 3.15 * 297 / 210 } as const;
export const GALLERY_FRAME = { width: 3.29, height: 4.59, centerY: 4.53 / 2 + .035 };
export const GALLERY_SCALES = [1, .78, .57, .4];
export const GALLERY_POSITIONS = [0, 3.12, 5.05, 6.4];
export const GALLERY_DEPTHS = [0, -.35, -.9, -1.6];

export function galleryState(p: number) {
  const arrive = smoothstep(clamp01((p - 4.35) / .63));
  const depart = smoothstep(clamp01((p - 5.42) / .54));
  // Reveal the world paper after the gallery has almost reached its pose.
  // An early crossfade would expose two different positions of the same page.
  const handoff = smoothstep(clamp01((depart - .95) / .05));
  return { arrive, depart, handoff, presence: arrive * (1 - depart),
    copy: smoothstep(clamp01((arrive - .72) / .28)) * (1 - smoothstep(clamp01(depart / .45))),
    floor: smoothstep(clamp01((arrive - .25) / .75)) * (1 - depart) };
}

function projectBase(x: number, y: number, z: number, height: number, zoom = 1, eyeY = 3.6) {
  const eyeZ = 14, dy = 1.5, length = Math.hypot(dy, eyeZ);
  const depth = -dy / length * (y - eyeY) - eyeZ / length * (z - eyeZ);
  const vertical = eyeZ / length * (y - eyeY) - dy / length * (z - eyeZ);
  const scale = height / (2 * Math.tan(34 * Math.PI / 360) * depth) * zoom;
  return { x: x * scale, y: -vertical * scale };
}

export function galleryLayout(width: number, height: number) {
  const portrait = width <= 599, short = !portrait && height <= 540, compact = portrait && height < 760;
  const footerTop = height - (short ? 86 : portrait ? compact ? 164 : 184 : width < 1100 ? 168 : 128);
  const top = short ? 160 : portrait ? compact ? width <= 359 ? 224 : 206 : 226 : Math.max(230, height * .245);
  const naturalTop = projectBase(0, GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, .045, height);
  const naturalBottom = projectBase(0, GALLERY_FRAME.centerY - GALLERY_FRAME.height / 2, .045, height);
  const naturalHeight = naturalBottom.y - naturalTop.y;
  const maxWidthHeight = (width - (portrait ? 40 : 72)) * GALLERY_FRAME.height / GALLERY_FRAME.width;
  const paperHeight = Math.min(height * .53, footerTop - top - (short ? 12 : 24), maxWidthHeight);
  const zoom = paperHeight / naturalHeight;
  const shiftedTop = projectBase(0, GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, .045, height, zoom);
  const shiftY = top - (height / 2 + shiftedTop.y);
  const base = { width, height, portrait, compact, short, top, footerTop, zoom, shiftY, visibleRadius: portrait ? 1 : width < 1100 || short ? 2 : 3 };
  const a = projectGalleryPoint(-GALLERY_FRAME.width / 2, GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, .045, base);
  const b = projectGalleryPoint(GALLERY_FRAME.width / 2, GALLERY_FRAME.centerY - GALLERY_FRAME.height / 2, .045, base);
  const right = projectGalleryPoint(GALLERY_FRAME.width / 2, GALLERY_FRAME.centerY + GALLERY_FRAME.height / 2, .045, base);
  const frame = { x: a.x, y: a.y, width: right.x - a.x, height: b.y - a.y };
  const floor = projectGalleryPoint(0, 0, 0, base);
  return { ...base, frame, floor };
}

export function projectGalleryPoint(x: number, y: number, z: number, layout: { width: number; height: number; zoom: number; shiftY: number; shiftX?: number; eyeY?: number }) {
  const point = projectBase(x, y, z, layout.height, layout.zoom, layout.eyeY);
  return { x: layout.width / 2 + point.x + (layout.shiftX ?? 0), y: layout.height / 2 + point.y + layout.shiftY };
}

export const galleryCenter = (rect: GalleryRect): GalleryPoint => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
