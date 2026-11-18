"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { GALLERY_DEPTHS, GALLERY_POSITIONS, GALLERY_SCALES, galleryCenter, galleryLayout, galleryState, projectGalleryPoint, type GalleryRect } from "@/lib/career-gallery";
import { HOME_TEMPLATES, homeTemplate, homeTemplateAsset, homeTemplateSvg } from "@/lib/home-templates";
import { tailoringLayout, type TailoringDecision } from "@/lib/career-tailoring";
import { DEFAULT_ASSEMBLY_REGIONS, assemblyState } from "@/lib/career-assembly";
import { PREVIEW_YAW, previewRoomState, previewState, previewView } from "@/lib/career-preview";
import { measureHomeTemplate } from "@/lib/home-template-regions";
import type { StoryIdentity } from "@/lib/story-identity";
import type { StoryCopy } from "@/lib/story-i18n";
import type { GallerySceneFrame, TemplateGalleryScene } from "./createTemplateGalleryScene";
import styles from "./CareerTemplateGallery.module.css";

export type TemplateGalleryHandle = { getRegions: () => typeof DEFAULT_ASSEMBLY_REGIONS; update: (p: number, width: number, height: number, calm: boolean) => void };
type Props = { selected: string; onChoose: (id: string) => void; identity: StoryIdentity; decision: TailoringDecision; copy: StoryCopy };

function blendRect(from: GalleryRect, to: GalleryRect, amount: number): GalleryRect {
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount, width: from.width + (to.width - from.width) * amount, height: from.height + (to.height - from.height) * amount };
}

async function loadPaper(source: string, fallback: string) {
  const image = new Image(); image.decoding = "async"; image.src = source;
  try { await image.decode(); } catch { image.src = fallback; await image.decode(); }
  if (!source.startsWith("data:")) return image;
  const canvas = document.createElement("canvas"); canvas.width = 794; canvas.height = 1123;
  const context = canvas.getContext("2d");
  if (!context) return image;
  context.drawImage(image, 0, 0); return canvas;
}

export const CareerTemplateGallery = forwardRef<TemplateGalleryHandle, Props>(function CareerTemplateGallery({ selected, onChoose, identity, decision, copy }, ref) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const fallbackCards = useRef(new Map<string, HTMLButtonElement>());
  const fallbackPodium = useRef<HTMLDivElement>(null);
  const scene = useRef<TemplateGalleryScene | null>(null);
  const regions = useRef(DEFAULT_ASSEMBLY_REGIONS);
  const lastFrame = useRef<GallerySceneFrame | null>(null);
  const choose = useRef(onChoose);
  const [requested, setRequested] = useState(false), [ready, setReady] = useState(false), [contextVersion, setContextVersion] = useState(0);
  const requesting = useRef(false);
  const previous = useRef({ p: -1, width: 0, height: 0, selected: "", regions: DEFAULT_ASSEMBLY_REGIONS });
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const { resolvedTheme } = useTheme();
  const template = homeTemplate(selected), bn = copy.locale === "bn";
  const selectedIndex = HOME_TEMPLATES.findIndex((item) => item.slug === template.slug);
  const sources = useMemo(() => HOME_TEMPLATES.map((item) => identity.personal || decision === "accepted" ? homeTemplateSvg(item, identity, decision) : homeTemplateAsset(item)), [identity, decision]);
  useEffect(() => { choose.current = onChoose; }, [onChoose]);
  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    regions.current = DEFAULT_ASSEMBLY_REGIONS;
    void measureHomeTemplate(template, identity, decision, controller.signal).then((value) => { if (!controller.signal.aborted) { regions.current = value; if (root.current) root.current.dataset.sectionRegions = JSON.stringify(value); } });
    return () => controller.abort();
  }, [requested, template, identity, decision]);
  useEffect(() => { scene.current?.setTheme(resolvedTheme === "dark"); }, [resolvedTheme]);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const lost = (event: Event) => { event.preventDefault(); setReady(false); };
    const restored = () => { setReady(false); setContextVersion((value) => value + 1); };
    node.addEventListener("webglcontextlost", lost);
    node.addEventListener("webglcontextrestored", restored);
    return () => { node.removeEventListener("webglcontextlost", lost); node.removeEventListener("webglcontextrestored", restored); };
  }, []);
  useEffect(() => {
    if (!requested) return;
    let alive = true;
    const initialize = async () => {
      try {
        const [module, images] = await Promise.all([import("./createTemplateGalleryScene"), Promise.all(sources.map((source, index) => loadPaper(source, homeTemplateAsset(HOME_TEMPLATES[index]!))))]);
        if (!alive || !canvas.current) return;
        const created = module.createTemplateGalleryScene(canvas.current, images, (id) => choose.current(id));
        if (!created) return;
        scene.current = created;
        created.setTheme(document.documentElement.classList.contains("dark"));
        if (lastFrame.current) created.update(lastFrame.current);
        setReady(true);
      } catch { /* The HTML gallery keeps its floor and reflections available. */ }
    };
    void initialize();
    return () => { alive = false; scene.current?.dispose(); scene.current = null; };
  }, [requested, sources, contextVersion]);

  useImperativeHandle(ref, () => ({
    getRegions: () => regions.current,
    update(p, width, height, calm) {
      const element = root.current;
      if (!element) return;
      const state = galleryState(p), assembled = assemblyState(p), preview = previewState(p), room = previewRoomState(p);
      element.dataset.unit = p.toFixed(4);
      element.style.opacity = room.opacity.toFixed(4);
      element.style.visibility = room.presence > .001 ? "visible" : "hidden";
      element.dataset.mode = p > 6.48 ? "preview" : p >= 5.42 ? "assembly" : "gallery";
      element.inert = state.presence < .98;
      element.setAttribute("aria-hidden", state.presence < .98 ? "true" : "false");
      if (!requesting.current && p > 3.9 && p < 8) { requesting.current = true; setRequested(true); }
      const incoming = tailoringLayout(width, height).suggestion;
      const frame = { p, width, height, selected: template.slug, incoming, calm, regions: regions.current };
      lastFrame.current = frame;
      scene.current?.update(frame);
      if (room.presence <= .001) return;
      const last = previous.current;
      if (Math.abs(last.p - p) < .0001 && last.width === width && last.height === height && last.selected === template.slug && last.regions === regions.current) return;
      previous.current = { p, width, height, selected: template.slug, regions: regions.current };
      const layout = galleryLayout(width, height), view = previewView(width, height, p);
      element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : width < 1100 ? "tablet" : "wide";
      element.dataset.compact = layout.compact ? "1" : "0";
      element.style.setProperty("--gallery-copy", state.copy.toFixed(4));
      element.style.setProperty("--gallery-floor", room.floor.toFixed(4));
      element.style.setProperty("--gallery-floor-y", `${view.floor.y.toFixed(2)}px`);
      element.style.setProperty("--gallery-footer-y", `${layout.footerTop}px`);
      if (fallbackPodium.current) {
        const podium = view.podium;
        fallbackPodium.current.style.width = podium.width.toFixed(2) + "px"; fallbackPodium.current.style.height = podium.height.toFixed(2) + "px";
        fallbackPodium.current.style.transform = `translate3d(${podium.x.toFixed(2)}px,${podium.y.toFixed(2)}px,0)`;
        fallbackPodium.current.style.opacity = preview.arrive.toFixed(4);
      }
      HOME_TEMPLATES.forEach((item, index) => {
        const card = fallbackCards.current.get(item.slug); if (!card) return;
        let offset = index - selectedIndex; if (offset > 3) offset -= 7; if (offset < -3) offset += 7;
        const distance = Math.abs(offset), scale = GALLERY_SCALES[distance]!, sign = Math.sign(offset);
        card.style.display = distance <= layout.visibleRadius && (distance === 0 || assembled.arrive < .999) ? "block" : "none";
        card.style.opacity = (distance === 0 ? 1 : 1 - assembled.arrive).toFixed(4);
        let rect: GalleryRect;
        if (distance === 0) rect = blendRect(incoming, view.frame, state.arrive);
        else {
          const center = projectGalleryPoint(sign * (GALLERY_POSITIONS[distance]! + assembled.arrive * 1.6), 4.53 * scale / 2 + .035, GALLERY_DEPTHS[distance]!, view);
          const top = projectGalleryPoint(sign * (GALLERY_POSITIONS[distance]! + assembled.arrive * 1.6), 4.53 * scale + .035, GALLERY_DEPTHS[distance]!, view);
          const h = (center.y - top.y) * 2 * (1 - assembled.arrive * .22);
          rect = { x: center.x - h * .354, y: top.y, width: h * .708, height: h };
          const start = galleryCenter(incoming);
          rect = blendRect({ x: start.x - 20, y: start.y - 30, width: 40, height: 60 }, rect, state.arrive);

        }
        card.style.width = `${rect.width}px`; card.style.height = `${rect.height}px`;
        card.style.transform = `translate3d(${rect.x.toFixed(2)}px,${rect.y.toFixed(2)}px,0) rotateY(${distance === 0 ? PREVIEW_YAW * preview.arrive * 180 / Math.PI : -sign * distance * 7}deg)`;
        card.style.setProperty("--reflection-gap", Math.max(5, 2 * (view.floor.y - rect.y - rect.height)).toFixed(2) + "px");
        card.style.zIndex = String(10 - distance);
        if (distance === 0) card.querySelectorAll<HTMLElement>("[data-assembly-cover]").forEach((cover, part) => {
          const region = regions.current[part] ?? DEFAULT_ASSEMBLY_REGIONS[part]!;
          cover.style.left = region.x*100 + "%"; cover.style.top = region.y*100 + "%";
          cover.style.width = region.width*100 + "%"; cover.style.height = region.height*100 + "%";
          cover.style.opacity = (.18 * (1 - assembled.sections[part]!) * assembled.arrive * (1 - assembled.depart)).toFixed(4);
        });
      });
    },
  }), [template.slug, selectedIndex]);

  const step = (delta: number) => onChoose(HOME_TEMPLATES[(selectedIndex + delta + HOME_TEMPLATES.length) % HOME_TEMPLATES.length]!.slug);
  return (
    <div ref={root} className={styles.gallery} role="group" aria-roledescription={bn ? "টেমপ্লেট ক্যারোসেল" : "template carousel"} aria-label={copy.gallery.pick} data-template-gallery data-selected-template={template.slug} data-renderer={ready ? "webgl" : "css"} style={{ opacity: 0, visibility: "hidden" }} inert aria-hidden="true"
      onKeyDown={(event) => { if (event.target instanceof HTMLSelectElement) return; if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); step(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <div className={styles.visual} onTouchCancel={() => { gesture.current = null; }} onTouchStart={(event) => { const point = event.touches[0]; if (point) gesture.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={(event) => { const point = event.changedTouches[0], start = gesture.current; gesture.current = null; if (point && start && Math.abs(point.clientX - start.x) > 45 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y) * 1.3) step(point.clientX < start.x ? 1 : -1); }}>
        <div className={styles.fallback} data-hidden={ready ? "1" : "0"} aria-hidden="true">
          <div className={styles.fallbackFloor} />
          <div ref={fallbackPodium} className={styles.fallbackPodium} data-fallback-podium />
          {HOME_TEMPLATES.map((item, index) => <button key={item.slug} type="button" className={styles.fallbackCard} tabIndex={-1} aria-pressed={template.slug === item.slug} onClick={() => onChoose(item.slug)} ref={(node) => { if (node) fallbackCards.current.set(item.slug, node); else fallbackCards.current.delete(item.slug); }} data-ui>
            {/* Native catalog previews are intentionally small pictures, with full-size document pixels. */}
            <div className={styles.paperFace}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sources[index]} width={794} height={1123} alt="" decoding="async" loading="lazy" />
              {item.slug === template.slug ? Array.from({length:5},(_,part)=><span key={part} className={styles.sectionCover} data-assembly-cover={part} />) : null}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.reflection} src={sources[index]} width={794} height={1123} alt="" decoding="async" loading="lazy" />
          </button>)}
        </div>
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" data-gallery-canvas />
      </div>
      <div className={styles.galleryFooter} data-ui>
        <div className={styles.galleryMeta} aria-live="polite"><strong>{template.name}</strong><span className={styles.selected}><Check size={14} aria-hidden="true" />{bn ? "নির্বাচিত" : "Selected"}</span></div>
        <p className={styles.description}>{bn ? "আপনার অভিজ্ঞতা, এই টেমপ্লেটে সাজানো।" : template.description}</p>
        <div className={styles.controls}>
          <button className={styles.arrow} type="button" aria-label={copy.gallery.previous} onClick={() => step(-1)}><ChevronLeft size={20} /></button>
          <div className={styles.choices} role="group" aria-label={copy.gallery.pick}>
            {HOME_TEMPLATES.map((item) => <button key={item.slug} type="button" aria-pressed={item.slug === template.slug} aria-label={copy.gallery.select(item.name)} data-gallery-choice={item.slug} onClick={() => onChoose(item.slug)}>{item.slug === template.slug ? <Check size={14} aria-hidden="true" /> : null}{item.name}</button>)}
          </div>
          <select className={styles.mobileChoice} value={template.slug} aria-label={copy.gallery.pick} onChange={(event) => onChoose(event.target.value)}>{HOME_TEMPLATES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <button className={styles.arrow} type="button" aria-label={copy.gallery.next} onClick={() => step(1)}><ChevronRight size={20} /></button>
        </div>
      </div>
    </div>
  );
});
