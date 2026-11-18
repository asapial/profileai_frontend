"use client";

import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown, ArrowUpRight, BarChart3, BriefcaseBusiness, Check,
  Code2, Download, FileText, FolderKanban, GraduationCap, Link2, Play, Send,
  ShieldCheck, Sparkles, Trophy, UserRound, X, type LucideIcon,
} from "lucide-react";
import {
  CAMERA_KEYS, COMPACT_CAMERA_KEYS, CARDS, CHAPTERS, CHAPTER_WINDOW, CHIPS, JOB_ROWS, LINES, MESH_EDGES,
  MESH_NEURONS, MESH_TONES, MESH_VIEW, MOTION, OBJECTS, RUNWAY, SCENE_CAPTIONS, SCENE_COUNT,
  SCENE_SPAN, TEMPLATES, TEMPLATE_SLOT_KEYS, clamp01, dockedCount, progressForUnit, samplePose,
  sampleValue, sampleEvidence, sampleCompactPose, smoothstep, templateSlot, unitForProgress, windowOpacity, type CinemaLine,
  type CinemaPose, type IconName,
} from "@/lib/career-cinema";
import { LOCALE_STORAGE_KEY, STORY_COPY, STORY_LOCALES, type StoryCopy, type StoryLocale } from "@/lib/story-i18n";
import { storyIdentityFrom, type StoryIdentity } from "@/lib/story-identity";
import { getCurrentUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { downloadResume } from "@/lib/resume-pdf";
import { useStoryStore } from "@/store/useStoryStore";
import { NEURAL_INPUTS, NEURAL_NODES, NEURAL_OUTPUTS, neuralFocus, neuralLayout, sampleNeuralPoints, type NeuralPoint } from "@/lib/career-neural";
import { alignmentLayout, alignmentState } from "@/lib/career-alignment";
import { tailoringCenter, tailoringLayout, tailoringState, type TailoringDecision } from "@/lib/career-tailoring";
import { galleryCenter, galleryLayout, galleryState } from "@/lib/career-gallery";
import { assemblyState } from "@/lib/career-assembly";
import { previewState } from "@/lib/career-preview";
import { HOME_TEMPLATES, homeTemplate, homeTemplateAsset, homeTemplateSvg, type HomeTemplate } from "@/lib/home-templates";
import { CareerAlignment, type AlignmentHandle } from "./CareerAlignment";
import { CareerTailoring, type TailoringHandle } from "./CareerTailoring";
import { CareerTemplateGallery, type TemplateGalleryHandle } from "./CareerTemplateGallery";
import { CareerAssembly, type AssemblyHandle } from "./CareerAssembly";
import { CareerResumePreview, type ResumePreviewHandle } from "./CareerResumePreview";
import { NeuralEvidenceGraph, type NeuralGraphHandle } from "./NeuralEvidenceGraph";
import { CinemaEnvironment, type CinemaEnvironmentHandle } from "./CinemaEnvironment";
import styles from "./CareerCinema.module.css";

/** The film renders wherever motion is allowed, phones included: the world
 * scales down per step (see worldFit) instead of swapping to a fallback. */
const FILM_QUERY = "(prefers-reduced-motion: no-preference)";
/**
 * Stepped world fit, mirrored by the --world-fit-w / --world-fit-h steps in the
 * CSS. Smaller screens scale the composition down, ultrawide windows scale it
 * back up, and short windows cap the scale so nothing gets cropped.
 */
const worldFit = (width: number, height: number) => {
  const widthFit =
    width >= 2400 ? 1.18
      : width >= 1920 ? 1.1
        : width <= 359 ? 0.66
          : width <= 519 ? 0.78
            : width <= 719 ? 0.5
            : width <= 899 ? 0.58
              : width <= 999 ? 0.75
                : width <= 1100 ? 0.82
                  : width <= 1279 ? 0.88
                    : width <= 1439 ? 0.94
                      : 1;
  const heightCap =
    height <= 430 ? 0.55
      : height <= 520 ? 0.62
        : height <= 780 ? 0.92
          : Number.POSITIVE_INFINITY;
  return Math.min(widthFit, heightCap);
};
const TEMPLATE_IDS = TEMPLATES.map((template) => `tpl-${template.id}`);
const LINE_LOOKUP = new Map<string, CinemaLine>(LINES.map((line) => [line.id, line]));
const CHIP_BY_ID = new Map(CHIPS.map((chip) => [chip.id, chip]));
const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const CHIP_INDEX = new Map(CHIPS.map((chip, index) => [chip.id, index]));

const NARRATIVE_LAYOUTS = [
  { side: "left", density: "full" },
  { side: "right", density: "full" },
  { side: "left", density: "compact" },
  { side: "left", density: "minimal" },
  { side: "left", density: "compact" },
  { side: "left", density: "minimal" },
  { side: "left", density: "compact" },
  { side: "left", density: "minimal" },
] as const;

const ICONS: Record<IconName, LucideIcon> = {
  code: Code2, file: FileText, briefcase: BriefcaseBusiness, folder: FolderKanban,
  trophy: Trophy, graduation: GraduationCap, sparkles: Sparkles, users: UserRound,
  chart: BarChart3, link: Link2, user: UserRound, download: Download, send: Send, shield: ShieldCheck,
};

/** Deterministic phase per object, so float and line pulses never sync up. */
const PHASE: Record<string, number> = Object.fromEntries(
  OBJECTS.map((object, index) => [object.id, (index * 2.399963) % (Math.PI * 2)]),
);

const transformFor = (pose: Required<CinemaPose>) =>
  `translate(-50%, -50%) translate3d(${pose.x.toFixed(2)}px, ${pose.y.toFixed(2)}px, ${pose.z.toFixed(2)}px) rotateX(${pose.rx.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg) rotateZ(${pose.rz.toFixed(2)}deg) scale(${pose.s.toFixed(4)})`;

/** Server-rendered pose at scene unit 0. Stable object identity keeps React from rewriting styles. */
const POSE0: Record<string, CSSProperties> = Object.fromEntries(
  OBJECTS.map((object) => {
    const pose = samplePose(object.keys, 0);
    return [object.id, { transform: transformFor(pose), opacity: pose.o } satisfies CSSProperties];
  }),
);

const CAMERA0: CSSProperties = (() => {
  const pose = samplePose(CAMERA_KEYS, 0);
  return { transform: `scale(var(--world-fit, 1)) translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg)` };
})();

const lerpPose = (a: Required<CinemaPose>, b: Required<CinemaPose>, t: number): Required<CinemaPose> => ({
  x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t,
  rx: a.rx + (b.rx - a.rx) * t, ry: a.ry + (b.ry - a.ry) * t, rz: a.rz + (b.rz - a.rz) * t,
  s: a.s + (b.s - a.s) * t, o: a.o + (b.o - a.o) * t,
});

function Icon({ name, size }: { name: IconName; size: number }) {
  const Component = ICONS[name];
  return <Component size={size} />;
}

function ResumeSheet({ template, identity, decision }: { template: HomeTemplate; identity: StoryIdentity; decision: TailoringDecision }) {
  const source = useMemo(() => identity.personal || decision === "accepted" ? homeTemplateSvg(template, identity, decision) : homeTemplateAsset(template), [template, identity, decision]);
  return (
    <div className={`${styles.sheet} ${styles.catalogSheet}`} data-ui data-catalog-template={template.slug}>
      <header className={styles.srOnly}>
        <span>{identity.name.toUpperCase()}</span>
        <p>Frontend Engineer</p>
        <small>{template.name} · {identity.email}</small>
      </header>
      {/* The selected catalog layout stays identical through the gallery and assembly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.catalogPaper} src={source} width={794} height={1123} alt="" decoding="async" />
    </div>
  );
}

function Progress({ label }: { label: string }) {
  return <div className={styles.progress}><div><i /></div><span>{label}</span></div>;
}

/** Deterministic particle spread, so server and client markup agree. */
const PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = index * 2.3999632297;
  return {
    x: Number((Math.cos(angle) * 47 + 50).toFixed(2)),
    y: Number((Math.sin(angle * 1.7) * 44 + 50).toFixed(2)),
    size: Number((1.4 + ((index * 7) % 5) * 0.5).toFixed(1)),
    delay: Number((-((index * 1.9) % 26)).toFixed(1)),
    duration: 18 + ((index * 3) % 11),
  };
});

/** Language pill shared by the cinema chrome and the reading layout. */
function LocaleSwitch({ locale, copy, onSelect }: { locale: StoryLocale; copy: StoryCopy; onSelect: (locale: StoryLocale) => void }) {
  return (
    <span className={styles.localeSwitch} role="group" aria-label={copy.meta.language}>
      {STORY_LOCALES.map((entry) => (
        <button key={entry.id} type="button" aria-pressed={locale === entry.id} onClick={() => onSelect(entry.id)}>
          {entry.label}
        </button>
      ))}
    </span>
  );
}

function StoryChapters({ locale, copy, onSelect }: { locale: StoryLocale; copy: StoryCopy; onSelect: (locale: StoryLocale) => void }) {
  return (
    <div className={styles.story}>
      <div className={styles.localeRow}>
        <LocaleSwitch locale={locale} copy={copy} onSelect={onSelect} />
      </div>
      {copy.chapters.map((chapter, index) => (
        <section key={chapter.title} className={styles.storyChapter} id={`chapter-${index + 1}`} aria-labelledby={`chapter-title-${index}`}>
          <div className={styles.storyChapter__head}>
            <div>
              {index === 0
                ? <h1 id={`chapter-title-${index}`}>{chapter.title}</h1>
                : <h2 id={`chapter-title-${index}`}>{chapter.title}</h2>}
              <p>{chapter.description}</p>
            </div>
          </div>
          <ul>
            {(copy.storyPoints[index] ?? []).map((point) => (
              <li key={point}><Check size={15} />{point}</li>
            ))}
          </ul>
          {index === copy.chapters.length - 1 ? (
            <Link href="/register" className={styles.storyChapter__cta} onClick={() => track({ name: "career_story_cta_click", properties: { placement: "reading" } })}>{copy.reading.cta} <ArrowUpRight size={16} /></Link>
          ) : null}
        </section>
      ))}
    </div>
  );
}

/**
 * Safety net around the cinematic world: if any render error slips through,
 * the section quietly becomes the reading layout instead of a broken page.
 */
class CinemaBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn("[cinema] render failed; showing the reading layout.", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function CareerCinema() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const neuralGraph = useRef<NeuralGraphHandle>(null);
  const alignment = useRef<AlignmentHandle>(null);
  const tailoring = useRef<TailoringHandle>(null);
  const assembly = useRef<AssemblyHandle>(null);
  const resumePreview = useRef<ResumePreviewHandle>(null);
  const templateGallery = useRef<TemplateGalleryHandle>(null);
  const roomBackdrop = useRef<CinemaEnvironmentHandle>(null);
  const objectNodes = useRef(new Map<string, HTMLElement>());
  const lineNodes = useRef(new Map<string, { bar: HTMLElement | null; dot: HTMLElement | null }>());
  const chapterNodes = useRef(new Map<number, HTMLElement>());
  const captionNodes = useRef(new Map<number, HTMLElement>());
  const heroNode = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  const activeTemplate = useStoryStore((state) => state.activeTemplate);
  const activeCatalogTemplate = useStoryStore((state) => state.activeCatalogTemplate);
  const setActiveCatalogTemplate = useStoryStore((state) => state.setActiveCatalogTemplate);
  const activeStage = useStoryStore((state) => state.activeStage);
  const locale = useStoryStore((state) => state.locale);
  const setLocale = useStoryStore((state) => state.setLocale);
  const copy = STORY_COPY[locale];
  /** Latest copy for the animation loop (which mounts once). */
  const copyRef = useRef(copy);
  useEffect(() => { copyRef.current = copy; }, [copy]);
  // Same query key as the navbar: react-query dedupes, so this costs no
  // extra request. Guests simply keep the illustrative identity.
  const { data: user } = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser, staleTime: 60_000, retry: false });
  const identity = useMemo(() => storyIdentityFrom(user), [user]);
  const selectedIndex = Math.max(0, TEMPLATES.findIndex((template) => template.id === activeTemplate));
  const [suggestion, setSuggestion] = useState<"pending" | "accepted" | "rejected">("pending");
  /** Set when the animation loop keeps failing, so the section can fall back. */
  const [degraded, setDegraded] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");
  const [playing, setPlaying] = useState(false);
  /** Dev-only scrub override, in scene units; null means "follow the scroll". */
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const midCtaNode = useRef<HTMLAnchorElement>(null);
  const demoNode = useRef<HTMLButtonElement>(null);
  const scrub = useRef<number | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  /** Clear the share-status timer when the section unmounts. */
  useEffect(() => () => { if (shareTimer.current) clearTimeout(shareTimer.current); }, []);

  /** Deep link (?lang=bn) wins once; otherwise a stored explicit choice is restored. */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("lang");
    if (param === "en" || param === "bn") { setLocale(param); return; }
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "en" || stored === "bn") setLocale(stored);
    } catch { /* private mode */ }
  }, [setLocale]);

  /** Auto-demo: a calm auto-scroll through the whole story; any input cancels. */
  useEffect(() => {
    if (!playing) return;
    const film = root.current?.querySelector<HTMLElement>(`.${styles.film}`);
    if (!film) { setPlaying(false); return; }
    const rect = film.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const endY = rect.top + window.scrollY + travel;
    const pxPerMs = travel / 42000;
    let y = window.scrollY;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(64, now - previous);
      previous = now;
      y = Math.min(endY, y + delta * pxPerMs);
      // Explicit instant: the page sets `scroll-behavior: smooth` globally,
      // which would re-aim a new animation every frame and crawl.
      window.scrollTo({ top: y, behavior: "instant" });
      if (y >= endY) {
        setPlaying(false);
        track({ name: "career_story_demo", properties: { action: "finish" } });
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const stop = (event: Event) => {
      // The play control is the one input that must not cancel its own tour.
      if (demoNode.current && event.target instanceof Node && demoNode.current.contains(event.target)) return;
      cancelAnimationFrame(frame);
      setPlaying(false);
      track({ name: "career_story_demo", properties: { action: "cancel" } });
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    for (const name of events) window.addEventListener(name, stop, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      for (const name of events) window.removeEventListener(name, stop);
    };
  }, [playing]);

  const templateState = useRef({
    from: TEMPLATE_IDS.map((_, index) => templateSlot(index, 0)),
    to: TEMPLATE_IDS.map((_, index) => templateSlot(index, 0)),
    t: 1,
  });

  useEffect(() => {
    const unregister = useStoryStore.subscribe((state, previous) => {
      if (state.activeTemplate === previous.activeTemplate) return;
      const index = Math.max(0, TEMPLATES.findIndex((template) => template.id === state.activeTemplate));
      Object.assign(templateState.current, {
        from: [...templateState.current.to],
        to: TEMPLATE_IDS.map((_, slot) => templateSlot(slot, index)),
        t: 0,
      });
    });
    return unregister;
  }, []);

  useEffect(() => {
    const film = root.current?.querySelector<HTMLElement>(`.${styles.film}`);
    const stageElement = stage.current;
    const worldElement = world.current;
    if (!film || !stageElement || !worldElement) return;

    // Dev-only scrubber: ?scrub reveals the toolbar (styled via [data-scrub]).
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("scrub")) {
      stageElement.dataset.scrub = "1";
    }

    // Small screens and touch devices start on the cheaper tier; the frame-time
    // measure below promotes them back to full fidelity when the hardware keeps up.
    if (window.innerWidth < 900 || navigator.maxTouchPoints > 1) {
      stageElement.dataset.quality = "lite";
    }

    const filmQuery = window.matchMedia(FILM_QUERY);
    // Document-space film rect, cached: a per-frame getBoundingClientRect
    // would force layout every frame. ResizeObserver keeps top/height honest
    // when fonts, images or viewport changes reflow the page.
    let filmTop = 0;
    let filmHeight = 0;
    const measureFilm = () => {
      const rect = film.getBoundingClientRect();
      filmTop = rect.top + window.scrollY;
      filmHeight = rect.height;
    };
    measureFilm();
    const filmResize = new ResizeObserver(measureFilm);
    filmResize.observe(film);
    const tpl = templateState.current;
    const live = new Map<string, string>();
    let frame = 0;
    let previousTime = 0;
    let drive: number | null = null;
    let lastScene = -1;
    let errorCount = 0;
    let qualityEma = 16;
    let qualityFrames = 0;
    let lastNeuralFocus = -1;
    let lastAlignmentFocus = -1;

    /** Deep links: opening #scene-04 restores the story at chapter 04. */
    const hashScene = () => {
      const match = window.location.hash.match(/^#scene-(\d{1,2})$/);
      if (!match) return -1;
      const index = Number(match[1]) - 1;
      return index >= 0 && index < SCENE_COUNT ? index : -1;
    };

    const selectedId = () => TEMPLATE_IDS[Math.max(0, TEMPLATES.findIndex((template) => template.id === useStoryStore.getState().activeTemplate))]!;

    const templatePose = (id: string, p: number): Required<CinemaPose> => {
      const index = Math.max(0, TEMPLATE_IDS.indexOf(id));
      if (tpl.t >= 1) return samplePose(TEMPLATE_SLOT_KEYS[tpl.to[index] ?? 0]!, p);
      const from = samplePose(TEMPLATE_SLOT_KEYS[tpl.from[index] ?? 0]!, p);
      const to = samplePose(TEMPLATE_SLOT_KEYS[tpl.to[index] ?? 0]!, p);
      return lerpPose(from, to, smoothstep(clamp01(tpl.t)));
    };

    const update = (time: number) => {
      frame = 0;
      const state = useStoryStore.getState();
      const rawElapsed = previousTime ? time - previousTime : 16;
      const elapsed = Math.min(64, rawElapsed);
      previousTime = time;
      const viewport = window.innerHeight;
      const travel = Math.max(1, filmHeight - viewport);
      const rectTop = filmTop - window.scrollY;
      const target = unitForProgress(clamp01(-rectTop / travel));
      const calm = !state.motionEnabled;
      const damping = state.motionEnabled && !calm ? 1 - Math.exp(-elapsed / MOTION.driveTau) : 1;
      if (drive === null) drive = target;
      else drive += (target - drive) * damping;
      if (tpl.t < 1) tpl.t = Math.min(1, tpl.t + (1 - Math.exp(-elapsed / MOTION.templateTau)));

      // Decorative layers demote themselves when the frame budget is missed,
      // so low-power machines keep the story but lose the expensive blur.
      // Tab-throttled frames (>120ms) are ignored so a background tab never
      // demotes the visuals.
      if (rawElapsed >= 8 && rawElapsed <= 120) {
        qualityEma += (rawElapsed - qualityEma) * 0.06;
        qualityFrames += 1;
        if (qualityFrames >= 90) {
          qualityFrames = 0;
          const tier = qualityEma > 26 ? "lite" : qualityEma < 20 ? "full" : null;
          if (tier && stageElement.dataset.quality !== tier) {
            stageElement.dataset.quality = tier;
            track({ name: "career_story_quality", properties: { tier } });
          }
        }
      }

      const p = scrub.current ?? drive;
      roomBackdrop.current?.update(p);
      const neural = neuralFocus(p);
      const aligned = alignmentState(p);
      const tailored = tailoringState(p);
      const gallery = galleryState(p);
      const assembled = assemblyState(p);
      const preview = previewState(p);
      const panelFocus = Math.max(aligned.presence, tailored.presence, gallery.presence, assembled.presence, preview.presence);
      if (Math.abs(panelFocus - lastAlignmentFocus) > .0001) {
        stageElement.style.setProperty("--alignment-focus", panelFocus.toFixed(4));
        lastAlignmentFocus = panelFocus;
      }
      const originalEvidence = 1 - smoothstep(clamp01(neural / .5));
      const quietEvidence = Math.max(neural, windowOpacity(p, 1.82, 8.15, .28));
      if (Math.abs(quietEvidence - lastNeuralFocus) > .0001) {
        stageElement.style.setProperty("--neural-focus", quietEvidence.toFixed(4));
        lastNeuralFocus = quietEvidence;
      }
      // Scroll-linked exit: over the final scene unit the film hands off to the
      // reading zone — the world scales back and the chrome fades with it.
      // Scene 8 rests on p = 7, so the resting poses stay untouched.
      const exitE = clamp01(p - (SCENE_SPAN - 1));
      // Chrome retires a touch faster than the world so nothing sits on the
      // handoff; it is written inline, so it must reach zero on its own.
      const chromeFade = 1 - clamp01((p - (SCENE_SPAN - 1)) / 0.4);
      const inFilm = filmQuery.matches;
      const sceneIndex = Math.max(0, Math.min(CHAPTERS.length - 1, Math.round(p)));

      // Pointer parallax eases toward the pointer, so the camera never snaps.
      const pointerBlend = 1 - Math.exp(-elapsed / MOTION.pointerTau);
      pointer.current.cx += (pointer.current.x - pointer.current.cx) * pointerBlend;
      pointer.current.cy += (pointer.current.y - pointer.current.cy) * pointerBlend;

      if (inFilm) {
        const compact = window.innerWidth <= 519;
        const pose = samplePose(compact ? COMPACT_CAMERA_KEYS : CAMERA_KEYS, p);
        const breatheY = calm ? 0 : Math.sin(time * 0.00028) * 2;
        const breatheX = calm ? 0 : Math.sin(time * 0.00021) * 1.5;
        const rx = calm ? pose.rx : pose.rx - pointer.current.cy * 0.8;
        const ry = calm ? pose.ry : pose.ry + pointer.current.cx * 1.2;
        const driftX = calm ? 0 : pointer.current.cx * 8;
        const driftY = calm ? 0 : pointer.current.cy * 5;
        worldElement.style.transform =
          `scale(${(worldFit(window.innerWidth, window.innerHeight) * (1 - 0.12 * exitE)).toFixed(4)})` +
          ` translate3d(${(pose.x + breatheX + driftX).toFixed(2)}px, ${(pose.y + breatheY + driftY - exitE * 26).toFixed(2)}px, ${pose.z.toFixed(2)}px)` +
          ` rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;

        const poses = new Map<string, Required<CinemaPose>>();
        const evidence = sampleEvidence(p);
        const dockCount = dockedCount(p);
        const docked = String(dockCount);
        const selected = selectedId();

        for (const object of OBJECTS) {
          const isTemplate = object.id.startsWith("tpl-");
          const authoredPose = isTemplate ? templatePose(object.id, p) : samplePose(object.keys, p);
          const objectPose = compact ? sampleCompactPose(object.id, p, authoredPose, object.id === selected) : authoredPose;
          if (object.float && !calm) objectPose.y += Math.sin(time * 0.00055 + (PHASE[object.id] ?? 0)) * object.float;
          poses.set(object.id, objectPose);
          const node = objectNodes.current.get(object.id);
          if (!node) continue;
          const graphEvidence = CHIP_BY_ID.has(object.id) || CARD_BY_ID.has(object.id) || ["mesh", "core", "panel-analysis", "panel-job"].includes(object.id);
          const replacedAlignment = p >= 2.2 && p <= 4.05 && (CARD_BY_ID.has(object.id) || CHIP_BY_ID.has(object.id) || object.id === "panel-job");
          const nativeTailoring = object.id === "panel-original" || object.id === "panel-suggestion";
          const orbHandoff = object.id === "orb" ? 0 : 1;
          const nativeAssembly = object.id === "panel-assembly" || object.id.startsWith("block-");
          const galleryHandoff = isTemplate || object.id === "intro-final" || object.id === "panel-final" ? 0 : 1;
          const renderedOpacity = replacedAlignment || nativeTailoring || nativeAssembly ? 0 : objectPose.o * (graphEvidence ? originalEvidence : 1) * orbHandoff * galleryHandoff;
          const visible = renderedOpacity > 0.005;
          if (node.style.visibility !== (visible ? "visible" : "hidden")) node.style.visibility = visible ? "visible" : "hidden";
          if (!visible) continue;
          node.style.transform = transformFor(objectPose);
          node.style.opacity = renderedOpacity.toFixed(4);
          if (CARD_BY_ID.has(object.id)) {
            node.style.setProperty("--card-form", evidence.form.toFixed(4));
            node.style.setProperty("--card-match", evidence.match.toFixed(4));
          }
          if (object.bands) {
            let band = object.bands[0]!.name;
            for (const mark of object.bands) if (p >= mark.at) band = mark.name;
            if (node.dataset.band !== band) node.dataset.band = band;
          }
          if (isTemplate) {
            const isSelected = object.id === selected;
            if (node.dataset.selected !== (isSelected ? "1" : "0")) node.dataset.selected = isSelected ? "1" : "0";
            const nextDocked = node.dataset.band === "doc" ? docked : "0";
            if (node.dataset.docked !== nextDocked) node.dataset.docked = nextDocked;
          }
          if (object.id.startsWith("panel-")) {
            const state2 = objectPose.o > 0.6 ? "1" : "0";
            if (live.get(object.id) !== state2) { node.dataset.live = state2; live.set(object.id, state2); }
          }
          if (object.interactive) {
            const inert = !(p >= object.interactive.from && p <= object.interactive.to);
            if (node.inert !== inert) node.inert = inert;
          }
        }

        if (neural > .001 || aligned.presence > .001 || tailored.presence > .001 || gallery.presence > .001 || assembled.presence > .001 || preview.presence > .001) {
          // Project the existing world anchors once. The same chips, mesh points
          // and outputs then travel into the flat, readable neural composition.
          const matrix = new DOMMatrix(worldElement.style.transform);
          const project = (pose: Required<CinemaPose>) => {
            const point = new DOMPoint(pose.x, pose.y, pose.z).matrixTransform(matrix);
            const perspective = 1700 / (1700 - point.z);
            return {
              x: window.innerWidth / 2 + point.x * perspective,
              y: viewport * .46 + (point.y + viewport * .04) * perspective,
            };
          };
          const mesh = poses.get("mesh")!;
          const matchLayout = alignmentLayout(window.innerWidth, viewport);
          const matchPoint = (id: string) => matchLayout.cards.find((card) => card.id === id) ?? matchLayout.cards[0]!;
          const incoming = new Map<string, NeuralPoint>();
          const departure = smoothstep(clamp01((p - 2) / .4));
          const anchors = NEURAL_NODES.map((node, index) => {
            if (node.layer === 0) return project(poses.get(NEURAL_INPUTS[node.row]!.id)!);
            if (node.layer === 4) return p > 2 ? matchPoint(NEURAL_OUTPUTS[node.row]!) : project(poses.get(NEURAL_OUTPUTS[node.row]!)!);
            const neuron = MESH_NEURONS[(index * 3) % MESH_NEURONS.length]!;
            const origin = project({
              ...mesh,
              x: mesh.x + (neuron.x - MESH_VIEW.w / 2) * 1240 / MESH_VIEW.w * mesh.s,
              y: mesh.y + (neuron.y - MESH_VIEW.h / 2) * 930 / MESH_VIEW.h * mesh.s,
            });
            const destination = p > 2 ? matchPoint(NEURAL_OUTPUTS[node.row % NEURAL_OUTPUTS.length]!) : project(poses.get(NEURAL_OUTPUTS[node.row % NEURAL_OUTPUTS.length]!)!);
            return { x: origin.x + (destination.x - origin.x) * departure, y: origin.y + (destination.y - origin.y) * departure };
          });
          neuralGraph.current?.update(p, window.innerWidth, viewport, anchors, calm);
          if (neural > .001) {
            const points = sampleNeuralPoints(p, neuralLayout(window.innerWidth, viewport).points, anchors);
            NEURAL_NODES.forEach((node, index) => { if (node.layer === 4) incoming.set(NEURAL_OUTPUTS[node.row]!, points[index]!); });
          }
          const tailoringView = tailoringLayout(window.innerWidth, viewport);
          alignment.current?.update(p, window.innerWidth, viewport, incoming, { evidence: tailoringView.ports.evidence, job: tailoringCenter(tailoringView.suggestion) }, calm);
          const galleryView = galleryLayout(window.innerWidth, viewport);
          tailoring.current?.update(p, window.innerWidth, viewport, { core: galleryView.floor, document: galleryCenter(galleryView.frame), documentRect: galleryView.frame });
          templateGallery.current?.update(p, window.innerWidth, viewport, calm);
          assembly.current?.update(p, window.innerWidth, viewport, templateGallery.current?.getRegions());
          resumePreview.current?.update(p, window.innerWidth, viewport);
        } else {
          neuralGraph.current?.update(p, window.innerWidth, viewport, [], calm);
          alignment.current?.update(p, window.innerWidth, viewport, new Map(), undefined, calm);
          tailoring.current?.update(p, window.innerWidth, viewport, undefined);
          templateGallery.current?.update(p, window.innerWidth, viewport, calm);
          assembly.current?.update(p, window.innerWidth, viewport);
          resumePreview.current?.update(p, window.innerWidth, viewport);
        }

        lineNodes.current.forEach((entry, id) => {
          const line = LINE_LOOKUP.get(id);
          const bar = entry.bar;
          if (!line || !bar) return;
          const value = sampleValue(line.keys, p);
          if (value.o <= 0.02) {
            if (bar.style.visibility !== "hidden") { bar.style.visibility = "hidden"; if (entry.dot) entry.dot.style.visibility = "hidden"; }
            return;
          }
          const fromPose = poses.get(line.from === "selected" ? selected : line.from);
          const toPose = poses.get(line.to === "selected" ? selected : line.to);
          if (!fromPose || !toPose) return;
          const opacity = value.o * Math.min(fromPose.o, toPose.o) * originalEvidence * (1 - aligned.presence) * (1 - tailored.presence) * (1 - gallery.arrive) * (1 - assembled.presence) * (1 - preview.presence);
          if (opacity <= .02) {
            bar.style.visibility = "hidden";
            if (entry.dot) entry.dot.style.visibility = "hidden";
            return;
          }
          const portraitBridge = compact && line.from === "orb";
          const portraitEndY = line.to === "panel-original" ? 80 : -180;
          const x1 = fromPose.x + (portraitBridge ? 0 : line.fromOffset?.x ?? 0);
          const y1 = fromPose.y + (portraitBridge ? 0 : line.fromOffset?.y ?? 0);
          const x2 = toPose.x + (portraitBridge ? 170 : line.toOffset?.x ?? 0);
          const y2 = toPose.y + (portraitBridge ? portraitEndY : line.toOffset?.y ?? 0);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.max(1, Math.hypot(dx, dy));
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const z = (fromPose.z + toPose.z) / 2 - 16;
          bar.style.visibility = "visible";
          bar.style.opacity = opacity.toFixed(3);
          bar.style.transform = `translate3d(${x1.toFixed(2)}px, ${y1.toFixed(2)}px, ${z.toFixed(2)}px) rotate(${angle.toFixed(2)}deg) scaleX(${length.toFixed(2)})`;
          if (entry.dot && line.pulse) {
            if (calm) {
              entry.dot.style.visibility = "hidden";
              return;
            }
            const cycle = (time * 0.00028 + (PHASE[id] ?? 0) * 0.159) % 1;
            const eased = smoothstep(clamp01(cycle));
            entry.dot.style.visibility = "visible";
            entry.dot.style.opacity = (Math.sin(Math.PI * cycle) * Math.min(1, opacity * 1.4)).toFixed(3);
            entry.dot.style.transform = `translate3d(${(x1 + dx * eased).toFixed(2)}px, ${(y1 + dy * eased).toFixed(2)}px, ${(z + 12).toFixed(2)}px)`;
          }
        });
      }

      chapterNodes.current.forEach((node, index) => {
        const value = index === 7 ? preview.copy : windowOpacity(p, index - CHAPTER_WINDOW.pad, index + CHAPTER_WINDOW.pad, CHAPTER_WINDOW.fade) * chromeFade;
        node.style.opacity = value.toFixed(3);
        node.style.visibility = value > 0.02 ? "visible" : "hidden";
        const inert = value < 0.4;
        if (node.inert !== inert) node.inert = inert;
        // Handoff drift: the outgoing header lifts while the next rises in, so
        // the overlapping cross-fade reads as a swap, not a double exposure.
        const drift = Math.max(-1, Math.min(1, p - index)) * 12;
        node.style.transform = `translate3d(0, ${(-drift).toFixed(2)}px, 0)`;
      });
      captionNodes.current.forEach((node, index) => {
        const caption = SCENE_CAPTIONS[index];
        if (!caption) return;
        const value = caption.at === 3 || caption.at === 4 || caption.at === 5 || caption.at >= 6.2 ? 0 : windowOpacity(p, caption.at - 0.3, caption.at + 0.3, 0.18) * chromeFade * (1 - neural);
        node.style.opacity = value.toFixed(3);
        node.style.visibility = value > 0.02 ? "visible" : "hidden";
      });
      if (midCtaNode.current) {
        // Keep scene one focused on its hero action. The persistent shortcut
        // joins after the first transition, then leaves with the cinema chrome.
        const value = smoothstep(clamp01((p - 0.72) / 0.28)) * chromeFade * (viewport <= 540 ? 1 - Math.max(neural, panelFocus) : 1) * (window.innerWidth < 1100 ? 1 - preview.arrive : 1);
        midCtaNode.current.style.opacity = value.toFixed(3);
        midCtaNode.current.style.visibility = value > 0.02 ? "visible" : "hidden";
        const inert = value < 0.4;
        if (midCtaNode.current.inert !== inert) midCtaNode.current.inert = inert;
      }

      if (sceneIndex !== lastScene) {
        lastScene = sceneIndex;
        stageElement.dataset.scene = String(sceneIndex);
        track({ name: "career_story_scene_view", properties: { scene: sceneIndex + 1, title: copyRef.current.chapters[sceneIndex]?.title ?? "" } });
        if (state.activeStage !== sceneIndex) state.setActiveStage(sceneIndex);
      }
      // The stage flags the run-out tail once the world starts letting go; CSS
      // fades the persistent chrome (rail, meta, skip link, ambience) with it.
      if (inFilm) {
        const exiting = exitE > 0.02;
        if ((stageElement.dataset.exit === "1") !== exiting) stageElement.dataset.exit = exiting ? "1" : "0";
      } else if (stageElement.dataset.exit === "1") {
        stageElement.dataset.exit = "0";
      }
      const progress = clamp01(-rectTop / travel);
      if (Math.abs(state.scrollProgress - progress) > 0.002) state.setScrollProgress(progress);

      // The camera keeps its slow ambient drift while the film is on screen.
      const near = rectTop + filmHeight > -viewport && rectTop < viewport * 2;
      if (near) schedule();
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(safeUpdate); };

    const safeUpdate = (time: number) => {
      try {
        update(time);
      } catch (error) {
        errorCount += 1;
        if (errorCount <= 3) schedule();
        else {
          console.warn("[cinema] animation stopped; showing the reading layout.", error);
          setDegraded(true);
        }
      }
    };

    const move = (event: PointerEvent) => {
      // Touch drags are scrolling, not pointing: parallax stays desktop-only.
      if (event.pointerType === "touch") return;
      pointer.current.x = Number((event.clientX / window.innerWidth - 0.5).toFixed(3)) * -1;
      pointer.current.y = Number((event.clientY / window.innerHeight - 0.5).toFixed(3));
    };

    const initial = hashScene();
    if (initial >= 0) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      if (initial > 0 && filmQuery.matches) {
        const rect = film.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        window.scrollTo(0, rect.top + window.scrollY + progressForUnit(initial) * travel);
      }
    }

    schedule();
    filmQuery.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      filmResize.disconnect();
      filmQuery.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  const registerObject = (id: string, node: HTMLElement | null) => {
    if (node) objectNodes.current.set(id, node);
    else objectNodes.current.delete(id);
  };

  const registerLine = (id: string, node: HTMLElement | null, kind: "bar" | "dot") => {
    if (!node) return;
    const entry = lineNodes.current.get(id) ?? { bar: null, dot: null };
    if (kind === "bar") entry.bar = node;
    else entry.dot = node;
    lineNodes.current.set(id, entry);
  };

  /** Scroll to the resting pose of scene `index` (0-based) along the runway. */
  const jumpTo = (index: number) => {
    const film = root.current?.querySelector<HTMLElement>(`.${styles.film}`);
    if (!film || !window.matchMedia(FILM_QUERY).matches) return;
    const rect = film.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    window.scrollTo({ top: rect.top + window.scrollY + progressForUnit(index) * travel, behavior: "smooth" });
  };

  /** Anchor jumps must travel the runway, not the element. */
  const showScene = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    jumpTo(index);
  };

  const chooseCatalogTemplate = (id: string) => {
    setActiveCatalogTemplate(homeTemplate(id).slug);
    track({ name: "career_story_template_select", properties: { template: id, source: "gallery" } });
  };

  const chooseLocale = (next: StoryLocale) => {
    setLocale(next);
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, next); } catch { /* private mode */ }
    track({ name: "career_story_locale", properties: { locale: next } });
  };

  const decide = (decision: "accepted" | "rejected") => {
    setSuggestion(decision);
    track({ name: "career_story_review_decision", properties: { decision } });
  };

  /** Share the story at scene 08, falling back to the clipboard. */
  const shareResume = async () => {
    const url = `${window.location.origin}${window.location.pathname}#scene-08`;
    const data = {
      title: copy.share.title(identity.name),
      text: copy.share.text,
      url,
    };
    const settle = (state: "copied" | "failed") => {
      setShareState(state);
      if (shareTimer.current) clearTimeout(shareTimer.current);
      shareTimer.current = setTimeout(() => setShareState("idle"), 2600);
    };
    try {
      if (navigator.share) {
        try {
          await navigator.share(data);
          track({ name: "career_story_share", properties: { method: "share" } });
          return;
        } catch (error) {
          // Dismissing the native sheet is not an error worth a fallback.
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(url);
      track({ name: "career_story_share", properties: { method: "clipboard" } });
      settle("copied");
    } catch {
      track({ name: "career_story_share", properties: { method: "failed" } });
      settle("failed");
    }
  };

  const runOutput = (action: "download" | "share" | "register") => {
    if (action === "download") {
      downloadResume(identity.personal ? { name: identity.name, email: identity.email } : undefined);
      track({ name: "career_story_download" });
      return;
    }
    if (action === "share") {
      void shareResume();
      return;
    }
    track({ name: "career_story_cta_click", properties: { placement: "final" } });
    router.push("/register");
  };

  const toggleDemo = () => {
    if (playing) {
      setPlaying(false);
      track({ name: "career_story_demo", properties: { action: "cancel" } });
    } else {
      setPlaying(true);
      track({ name: "career_story_demo", properties: { action: "play" } });
    }
  };

  const selected = homeTemplate(activeCatalogTemplate);

  const contentFor = (id: string): ReactNode => {
    if (id === "core") {
      return (
        <div className={styles.core}>
          <div className={styles.coreRings}><i /><i /><i /></div>
          <div className={styles.coreBody}><UserRound /><strong>{copy.core.you}</strong><small>{copy.core.universe}</small></div>
        </div>
      );
    }
    if (id === "orb") {
      return (
        <div className={styles.orbWrap}>
          <div className={styles.orbRings}><i /><i /><i /></div>
          <div className={styles.orbBody}><Sparkles size={22} /><strong>AI</strong></div>
          <span className={styles.orbLabel}>{copy.orb.label}</span>
        </div>
      );
    }
    if (id === "mesh") {
      return (
        <div className={styles.meshPlane}>
          <svg viewBox={`0 0 ${MESH_VIEW.w} ${MESH_VIEW.h}`} aria-hidden="true" preserveAspectRatio="none">
            <g className={styles.meshEdges}>
              {MESH_EDGES.map((d) => <path key={d} d={d} />)}
            </g>
            {MESH_NEURONS.map((neuron, index) => (
              <circle
                key={index}
                cx={neuron.x}
                cy={neuron.y}
                r={1.5 + neuron.depth * 1.7}
                fill={MESH_TONES[neuron.tone]}
                opacity={0.2 + neuron.depth * 0.5}
              />
            ))}
          </svg>
        </div>
      );
    }
    const chip = CHIP_BY_ID.get(id);
    if (chip) {
      return <div className={styles.chip}><span className={styles.chipIcon}><Icon name={chip.icon} size={16} /></span>{chip.label}</div>;
    }
    const card = CARD_BY_ID.get(id);
    if (card) {
      return (
        <div className={styles.cardStack}>
          <div className={styles.node}><span className={styles.nodeBody}><Icon name={card.icon} size={34} /></span><span className={styles.nodeName}>{card.title}</span></div>
          <div className={styles.cardFace} data-ui>
            <div className={styles.cardHead}>
              <span className={styles.iconTile}><Icon name={card.icon} size={20} /></span>
              <div><h3>{card.title}</h3><p>{card.note}</p></div>
              <span className={`${styles.matchBadge} ${styles[`match${card.match.tone[0]!.toUpperCase()}${card.match.tone.slice(1)}`]}`}>{card.match.label}</span>
            </div>
            <div className={styles.cardSource}><Link2 size={13} /><span>Source verified</span></div>
          </div>
        </div>
      );
    }
    if (id.startsWith("tpl-")) {
      const index = TEMPLATE_IDS.indexOf(id);
      const catalogIndex = HOME_TEMPLATES.findIndex((template) => template.slug === selected.slug);
      const template = HOME_TEMPLATES[(catalogIndex + index - selectedIndex + HOME_TEMPLATES.length) % HOME_TEMPLATES.length]!;
      return (
        <div className={styles.sheetClip}>
          <button
            type="button"
            className={styles.tplButton}
            aria-pressed={selectedIndex === index}
            aria-label={copy.gallery.select(template.name)}
            onClick={() => chooseCatalogTemplate(template.slug)}
          >
            <ResumeSheet template={template} identity={identity} decision={suggestion} />
          </button>
        </div>
      );
    }
    if (id.startsWith("block-")) return null;
    if (id === "panel-analysis") {
      return (
        <div className={`${styles.panel} ${styles.analysis}`} data-ui>
          <h3>{copy.analysis.title}</h3>
          {copy.analysis.checklist.map((label) => <p key={label}><Check size={16} />{label}</p>)}
          <Progress label="100%" />
          <small>{copy.analysis.note}</small>
        </div>
      );
    }
    if (id === "panel-job") {
      return (
        <div className={`${styles.panel} ${styles.jobPanel}`} data-ui>
          <div className={styles.jobHead}><h3>{copy.job.title}</h3><span className={styles.jobChip}>Frontend Engineer</span></div>
          {JOB_ROWS.map((row) => (
            <div key={row.requirement} className={styles.jobRow}>
              <Icon name={row.icon} size={18} />
              <span>{row.requirement}</span>
              <b className={`${styles.jobState} ${styles[`match${row.tone[0]!.toUpperCase()}${row.tone.slice(1)}`]}`}>{copy.matchLabel(row.state)}</b>
            </div>
          ))}
          <small>{copy.job.note}</small>
        </div>
      );
    }
    if (id === "panel-original") {
      return null;
    }
    if (id === "panel-suggestion") {
      return null;
    }
    if (id === "panel-assembly") return null;
    if (id === "panel-final" || id === "intro-final") return null;
    return null;
  };

  if (degraded) {
    // The animation loop kept failing: serve the reading layout instead.
    return (
      <div className={styles.cinema} ref={root} data-degraded="">
        <StoryChapters locale={locale} copy={copy} onSelect={chooseLocale} />
      </div>
    );
  }

  return (
    <CinemaBoundary fallback={<div className={styles.cinema} data-degraded=""><StoryChapters locale={locale} copy={copy} onSelect={chooseLocale} /></div>}>
    <div className={styles.cinema} ref={root} lang={locale}>
      <div className={styles.film} style={{ "--runway": RUNWAY } as CSSProperties}>
        <div className={styles.stage} ref={stage} data-scene="0" data-review={suggestion}>
          <CinemaEnvironment ref={roomBackdrop}/>
          <div className={styles.floor} aria-hidden="true" />
          <div className={styles.ambience} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.bokeh} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className={styles.particles} aria-hidden="true">
            {PARTICLES.map((particle, index) => (
              <i key={index} style={{ "--particle-x": `${particle.x}%`, "--particle-y": `${particle.y}%`, "--particle-size": `${particle.size}px`, "--particle-delay": `${particle.delay}s`, "--particle-duration": `${particle.duration}s` } as CSSProperties} />
            ))}
          </div>

          <div className={styles.world} ref={world} style={CAMERA0}>
            <div className={styles.lines} aria-hidden="true">
              {LINES.map((line) => (
                <span key={`dot-${line.id}`} className={`${styles.linePulse} ${line.tone !== "wire" ? styles[`pulse${line.tone[0]!.toUpperCase()}${line.tone.slice(1)}`] : ""}`} ref={(node) => registerLine(line.id, node, "dot")} />
              ))}
              {LINES.map((line) => (
                <span key={line.id} className={`${styles.line} ${line.tone !== "wire" ? styles[`lineTone-${line.tone}`] : ""}`} ref={(node) => registerLine(line.id, node, "bar")} />
              ))}
            </div>

            {OBJECTS.map((object) => {
              const tone = CARD_BY_ID.get(object.id)?.tone;
              return (
                <div
                  key={object.id}
                  className={styles.obj}
                  ref={(node) => registerObject(object.id, node)}
                  style={POSE0[object.id]}
                  data-object={object.id}
                  data-tone={tone}
                  data-chip={CHIP_INDEX.get(object.id)}
                  inert={object.interactive ? !(0 >= object.interactive.from && 0 <= object.interactive.to) : undefined}
                >
                  {contentFor(object.id)}
                </div>
              );
            })}
          </div>

          <NeuralEvidenceGraph ref={neuralGraph} locale={locale} />
          <CareerAlignment ref={alignment} copy={copy} />
          <CareerTailoring ref={tailoring} copy={copy} decision={suggestion} onDecide={decide} />
          <CareerTemplateGallery ref={templateGallery} copy={copy} selected={activeCatalogTemplate} onChoose={chooseCatalogTemplate} identity={identity} decision={suggestion} />
          <CareerAssembly ref={assembly} copy={copy} selected={activeCatalogTemplate} />
          <CareerResumePreview ref={resumePreview} copy={copy} selected={activeCatalogTemplate} identity={identity} decision={suggestion} shareState={shareState} onOutput={runOutput} onChangeTemplate={() => jumpTo(5)} />
          <div className={styles.vignette} aria-hidden="true" />

          <div className={styles.overlay}>
            {copy.narratives.map((narrative, index) => {
              const layout = NARRATIVE_LAYOUTS[index] ?? NARRATIVE_LAYOUTS[0];
              const sideClass = layout.side === "right" ? styles.chapterRight : styles.chapterLeft;
              const densityClass = layout.density === "full"
                ? styles.chapterFull
                : layout.density === "compact"
                  ? styles.chapterCompact
                  : layout.density === "minimal"
                    ? styles.chapterMinimal
                    : styles.chapterNone;

              return (
                <div
                  key={index}
                  className={`${styles.chapter} ${sideClass} ${densityClass} ${index === 2 ? styles.chapterNeural : index >= 3 ? styles.chapterAlignment : ""} ${index === 4 ? styles.chapterTailoring : index >= 5 ? styles.chapterGallery : ""}`}
                  data-chapter={index}
                  ref={(node) => { if (node) chapterNodes.current.set(index, node); else chapterNodes.current.delete(index); }}
                  style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}
                  inert={index !== 0}
                >
                  <div className={styles.chapterCopy}>
                    {index === 0
                      ? <h1>{narrative.title}</h1>
                      : <h2>{narrative.title}</h2>}
                    {narrative.body ? <p>{narrative.body}</p> : null}
                    {narrative.cue ? <small className={styles.chapterCue}><ShieldCheck size={13} /> {narrative.cue}</small> : null}
                    {index === 0 ? (
                      <div className={`${styles.hero} ${styles.heroInNarrative}`} ref={heroNode}>
                        <div className={styles.heroActions}>
                          <Link href="/register" className={styles.heroPrimary} onClick={() => track({ name: "career_story_cta_click", properties: { placement: "hero" } })}>{copy.hero.primary} <ArrowUpRight size={17} /></Link>
                          <a href="#chapter-2" className={styles.heroSecondary} onClick={(event) => showScene(event, 1)}>{copy.hero.secondary} <ArrowDown size={16} /></a>
                          <button
                            type="button"
                            ref={demoNode}
                            className={styles.heroDemo}
                            aria-pressed={playing}
                            onClick={toggleDemo}
                          >
                            {playing ? <X size={15} /> : <Play size={15} />}
                            {playing ? copy.hero.stop : copy.hero.play}
                          </button>
                        </div>
                        <small className={styles.heroNote}><ShieldCheck size={14} /> {identity.personal ? copy.hero.notePersonal(identity.firstName) : copy.hero.note}</small>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {copy.captions.map((caption, index) => (
              <div
                key={caption}
                className={styles.caption}
                ref={(node) => { if (node) captionNodes.current.set(index, node); else captionNodes.current.delete(index); }}
                style={{ opacity: 0, visibility: "hidden" }}
              >
                {caption}
              </div>
            ))}

            <Link
              href="/register"
              ref={midCtaNode}
              className={styles.midCta}
              style={{ opacity: 0 }}
              inert
              onClick={() => track({ name: "career_story_cta_click", properties: { placement: "midstory" } })}
            >
              <Sparkles size={14} /> {copy.hero.primary} <ArrowUpRight size={14} />
            </Link>

            <div className={styles.scrubber}>
              <strong>{scrubValue === null ? "live" : `p ${scrubValue.toFixed(2)}`}</strong>
              <input
                type="range"
                min={0}
                max={SCENE_SPAN}
                step={0.02}
                value={scrubValue ?? 0}
                aria-label="Story position in scene units"
                onChange={(event) => {
                  const next = Number(event.target.value);
                  scrub.current = next;
                  setScrubValue(next);
                }}
              />
              <div className={styles.scrubberScenes}>
                {CHAPTERS.map((chapter, index) => (
                  <button key={chapter.title} type="button" onClick={() => { scrub.current = index; setScrubValue(index); }}>{index + 1}</button>
                ))}
                <button type="button" onClick={() => { scrub.current = null; setScrubValue(null); }}>Live</button>
              </div>
            </div>

            <p className={styles.srOnly} aria-live="polite">{copy.chapters[activeStage]?.title}</p>
          </div>
        </div>
      </div>

      <StoryChapters locale={locale} copy={copy} onSelect={chooseLocale} />
    </div>
    </CinemaBoundary>
  );
}
