"use client";

import { Component, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown, ArrowUpRight, BarChart3, BriefcaseBusiness, Check, ChevronLeft, ChevronRight,
  Code2, Download, FileText, FolderKanban, GraduationCap, Link2, MousePointer2, Pause, Play, Send,
  ShieldCheck, Sparkles, Trophy, UserRound, X, type LucideIcon,
} from "lucide-react";
import {
  CAMERA_KEYS, CARDS, CHAPTERS, CHAPTER_WINDOW, CHIPS, DOCK_LABELS, JOB_ROWS, LINES, MESH_EDGES,
  MESH_NEURONS, MESH_TONES, MESH_VIEW, MOTION, OBJECTS, RUNWAY, SCENE_CAPTIONS, SCENE_COUNT,
  SCENE_SPAN, TEMPLATES, TEMPLATE_SLOT_KEYS, clamp01, dockedCount, progressForUnit, samplePose,
  sampleValue, smoothstep, templateSlot, unitForProgress, windowOpacity, type CinemaLine,
  type CinemaPose, type IconName, type TemplateKey,
} from "@/lib/career-cinema";
import { LOCALE_STORAGE_KEY, STORY_COPY, STORY_LOCALES, type StoryCopy, type StoryLocale, type StoryOutputAction } from "@/lib/story-i18n";
import { storyIdentityFrom, type StoryIdentity } from "@/lib/story-identity";
import { getCurrentUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { downloadResume } from "@/lib/resume-pdf";
import { useStoryStore } from "@/store/useStoryStore";
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
        : width <= 479 ? 0.42
          : width <= 719 ? 0.6
            : width <= 899 ? 0.68
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
  { side: "left", density: "none" },
] as const;

const ICONS: Record<IconName, LucideIcon> = {
  code: Code2, file: FileText, briefcase: BriefcaseBusiness, folder: FolderKanban,
  trophy: Trophy, graduation: GraduationCap, sparkles: Sparkles, users: UserRound,
  chart: BarChart3, link: Link2, user: UserRound, download: Download, send: Send, shield: ShieldCheck,
};

const OUTPUT_ROWS: { icon: IconName; row: StoryOutputAction; action: "download" | "share" | "register" }[] = [
  { icon: "download", row: "download", action: "download" },
  { icon: "link", row: "share", action: "share" },
  { icon: "send", row: "register", action: "register" },
  { icon: "chart", row: "track", action: "register" },
];

/**
 * Scene-05 tailored sentence, split so the phrases that come from the user's
 * evidence can be highlighted as word-level diff against the original.
 */
const SUGGESTION_TEXT: { text: string; fresh?: boolean }[] = [
  { text: "Developed " },
  { text: "reusable React components", fresh: true },
  { text: " for a customer dashboard, " },
  { text: "improving load performance by 31%", fresh: true },
  { text: "." },
];

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

function ResumeSheet({ variant, href, identity, copy }: { variant: TemplateKey; href?: { id: string; name: string }; identity: StoryIdentity; copy: StoryCopy }) {
  return (
    <div className={`${styles.sheet} ${styles[`sheet--${variant}`]}`}>
      <header>
        <span>{identity.name.toUpperCase()}</span>
        <p>Frontend Engineer</p>
        <small>{identity.personal ? `${identity.email} · Your details · Portfolio` : `${identity.email} · Austin, TX · Portfolio`}</small>
      </header>
      <section className={styles.dock}>
        <h4>Professional summary</h4>
        <p>Frontend engineer building accessible products and thoughtful design systems with React and TypeScript.</p>
      </section>
      <section className={styles.dock}>
        <h4>Work experience</h4>
        <b>Frontend Engineer <em>2022 — Present</em></b>
        <ul><li>Improved load performance by 31%.</li><li>Partnered with design and product teams.</li></ul>
      </section>
      <section className={styles.dock}>
        <h4>Selected projects</h4>
        <b>Customer Dashboard</b>
        <p>A shared component library with accessible interfaces.</p>
        <div className={styles.sheetLines}><i /><i /></div>
      </section>
      <section className={styles.dock}>
        <h4>Skills</h4>
        <div className={styles.sheetSkills}><span>React</span><span>TypeScript</span><span>UI systems</span><span>Git</span></div>
      </section>
      <section className={styles.dock}>
        <h4>Education</h4>
        <b>BSc in Computer Science</b>
        <div className={styles.sheetLines}><i /></div>
      </section>
      {href ? <span className={styles.tplBadge}>{copy.sheet.selected(href.name)}</span> : null}
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
            <span className={styles.storyChapter__num}>{copy.pad2(index + 1)}</span>
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
  const objectNodes = useRef(new Map<string, HTMLElement>());
  const lineNodes = useRef(new Map<string, { bar: HTMLElement | null; dot: HTMLElement | null }>());
  const chapterNodes = useRef(new Map<number, HTMLElement>());
  const captionNodes = useRef(new Map<number, HTMLElement>());
  const heroNode = useRef<HTMLDivElement>(null);
  const galleryNode = useRef<HTMLDivElement>(null);
  const progressTextNode = useRef<HTMLSpanElement>(null);
  const assemblyCountNode = useRef<HTMLParagraphElement>(null);
  const pausedRef = useRef(false);
  const dockedShown = useRef(-1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pointer = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  const activeTemplate = useStoryStore((state) => state.activeTemplate);
  const setActiveTemplate = useStoryStore((state) => state.setActiveTemplate);
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
  /** Visitor-facing motion pause: ambient drift, float and trails stop; scroll stays 1:1. */
  const [paused, setPaused] = useState(false);
  /** Dev-only scrub override, in scene units; null means "follow the scroll". */
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const midCtaNode = useRef<HTMLAnchorElement>(null);
  const demoNode = useRef<HTMLButtonElement>(null);
  const scrub = useRef<number | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  /** Clear the share-status timer when the section unmounts. */
  useEffect(() => () => { if (shareTimer.current) clearTimeout(shareTimer.current); }, []);

  /** Pause swaps the stage into its calm mode; CSS freezes the decorative layers. */
  useEffect(() => {
    pausedRef.current = paused;
    if (stage.current) stage.current.dataset.motion = paused ? "paused" : "run";
  }, [paused]);

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
      templateState.current = {
        from: [...templateState.current.to],
        to: TEMPLATE_IDS.map((_, slot) => templateSlot(slot, index)),
        t: 0,
      };
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
      const calm = pausedRef.current;
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
        const pose = samplePose(CAMERA_KEYS, p);
        const breatheY = calm ? 0 : Math.sin(time * 0.00028) * 7;
        const breatheX = calm ? 0 : Math.sin(time * 0.00021) * 4;
        const rx = calm ? pose.rx : pose.rx - pointer.current.cy * 2.2 + Math.sin(time * 0.00016) * 0.5;
        const ry = calm ? pose.ry : pose.ry + pointer.current.cx * 2.8 + Math.sin(time * 0.00019) * 0.7;
        const driftX = calm ? 0 : pointer.current.cx * 18;
        const driftY = calm ? 0 : pointer.current.cy * 12;
        worldElement.style.transform =
          `scale(${(worldFit(window.innerWidth, window.innerHeight) * (1 - 0.12 * exitE)).toFixed(4)})` +
          ` translate3d(${(pose.x + breatheX + driftX).toFixed(2)}px, ${(pose.y + breatheY + driftY - exitE * 26).toFixed(2)}px, ${pose.z.toFixed(2)}px)` +
          ` rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;

        const poses = new Map<string, Required<CinemaPose>>();
        const dockCount = dockedCount(p);
        const docked = String(dockCount);
        const selected = selectedId();
        // The assembly panel repeats its progress line for the eye and for
        // assistive tech (aria-hidden), synced to the blocks that have landed.
        if (assemblyCountNode.current && dockedShown.current !== dockCount) {
          dockedShown.current = dockCount;
          assemblyCountNode.current.textContent = copyRef.current.assembly.docked(dockCount);
        }

        for (const object of OBJECTS) {
          const isTemplate = object.id.startsWith("tpl-");
          const objectPose = isTemplate ? templatePose(object.id, p) : samplePose(object.keys, p);
          if (object.float && !calm) objectPose.y += Math.sin(time * 0.00055 + (PHASE[object.id] ?? 0)) * object.float;
          poses.set(object.id, objectPose);
          const node = objectNodes.current.get(object.id);
          if (!node) continue;
          const visible = objectPose.o > 0.015;
          if (node.style.visibility !== (visible ? "visible" : "hidden")) node.style.visibility = visible ? "visible" : "hidden";
          if (!visible) continue;
          node.style.transform = transformFor(objectPose);
          node.style.opacity = objectPose.o.toFixed(3);
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
          const x1 = fromPose.x + (line.fromOffset?.x ?? 0);
          const y1 = fromPose.y + (line.fromOffset?.y ?? 0);
          const x2 = toPose.x + (line.toOffset?.x ?? 0);
          const y2 = toPose.y + (line.toOffset?.y ?? 0);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.max(1, Math.hypot(dx, dy));
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const z = (fromPose.z + toPose.z) / 2 - 16;
          bar.style.visibility = "visible";
          bar.style.opacity = value.o.toFixed(3);
          bar.style.transform = `translate3d(${x1.toFixed(2)}px, ${y1.toFixed(2)}px, ${z.toFixed(2)}px) rotate(${angle.toFixed(2)}deg) scaleX(${length.toFixed(2)})`;
          if (entry.dot && line.pulse) {
            if (calm) {
              entry.dot.style.visibility = "hidden";
              return;
            }
            const cycle = (time * 0.00028 + (PHASE[id] ?? 0) * 0.159) % 1;
            const eased = smoothstep(clamp01(cycle));
            entry.dot.style.visibility = "visible";
            entry.dot.style.opacity = (Math.sin(Math.PI * cycle) * Math.min(1, value.o * 1.4)).toFixed(3);
            entry.dot.style.transform = `translate3d(${(x1 + dx * eased).toFixed(2)}px, ${(y1 + dy * eased).toFixed(2)}px, ${(z + 12).toFixed(2)}px)`;
          }
        });
      }

      chapterNodes.current.forEach((node, index) => {
        const value = windowOpacity(p, index - CHAPTER_WINDOW.pad, index + CHAPTER_WINDOW.pad, CHAPTER_WINDOW.fade) * chromeFade;
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
        const value = windowOpacity(p, caption.at - 0.3, caption.at + 0.3, 0.18) * chromeFade;
        node.style.opacity = value.toFixed(3);
        node.style.visibility = value > 0.02 ? "visible" : "hidden";
      });
      if (galleryNode.current) {
        const value = windowOpacity(p, 4.55, 5.65, 0.22) * chromeFade;
        galleryNode.current.style.opacity = value.toFixed(3);
        galleryNode.current.style.visibility = value > 0.02 ? "visible" : "hidden";
        const inert = value < 0.4;
        if (galleryNode.current.inert !== inert) galleryNode.current.inert = inert;
      }
      if (midCtaNode.current) {
        // Keep scene one focused on its hero action. The persistent shortcut
        // joins after the first transition, then leaves with the cinema chrome.
        const value = smoothstep(clamp01((p - 0.72) / 0.28)) * chromeFade;
        midCtaNode.current.style.opacity = value.toFixed(3);
        midCtaNode.current.style.visibility = value > 0.02 ? "visible" : "hidden";
        const inert = value < 0.4;
        if (midCtaNode.current.inert !== inert) midCtaNode.current.inert = inert;
      }

      if (sceneIndex !== lastScene) {
        lastScene = sceneIndex;
        stageElement.dataset.scene = String(sceneIndex);
        if (progressTextNode.current) {
          progressTextNode.current.textContent = `${copyRef.current.pad2(sceneIndex + 1)} / ${copyRef.current.pad2(SCENE_COUNT)}`;
        }
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

  const chooseTemplate = (id: TemplateKey, source: "sheet" | "dots" | "arrows" | "keyboard") => {
    setActiveTemplate(id);
    track({ name: "career_story_template_select", properties: { template: id, source } });
  };

  const stepTemplate = (delta: number, source: "arrows" | "keyboard") =>
    chooseTemplate(TEMPLATES[(selectedIndex + delta + TEMPLATES.length) % TEMPLATES.length]!.id, source);

  const onGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); stepTemplate(-1, "keyboard"); }
    else if (event.key === "ArrowRight") { event.preventDefault(); stepTemplate(1, "keyboard"); }
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

  const togglePause = () => {
    setPaused((current) => {
      track({ name: "career_story_motion", properties: { action: current ? "resume" : "pause" } });
      return !current;
    });
  };

  const onGalleryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  /** Mobile carousel: a horizontal swipe steps to the neighbouring presentation. */
  const onGalleryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return;
    stepTemplate(dx < 0 ? 1 : -1, "arrows");
  };

  const selected = TEMPLATES[selectedIndex]!;
  const reviewStatus = suggestion === "pending"
    ? copy.tailor.statusPending
    : suggestion === "accepted"
      ? copy.tailor.statusAccepted
      : copy.tailor.statusRejected;

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
          <div className={styles.cardFace}>
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
      const template = TEMPLATES[index]!;
      return (
        <div className={styles.sheetClip}>
          <button
            type="button"
            className={styles.tplButton}
            aria-pressed={selectedIndex === index}
            aria-label={copy.gallery.select(template.name)}
            onClick={() => chooseTemplate(template.id, "sheet")}
          >
            <ResumeSheet variant={template.id} href={template} identity={identity} copy={copy} />
            <MousePointer2 size={38} className={styles.tplCursor} aria-hidden="true" />
          </button>
        </div>
      );
    }
    if (id.startsWith("block-")) {
      const index = Number(id.slice("block-".length));
      const block = DOCK_LABELS[index]!;
      return <div className={styles.block}><Icon name={block.icon} size={17} />{block.label}<Check size={14} /></div>;
    }
    if (id === "panel-analysis") {
      return (
        <div className={`${styles.panel} ${styles.analysis}`}>
          <h3>{copy.analysis.title}</h3>
          {copy.analysis.checklist.map((label) => <p key={label}><Check size={16} />{label}</p>)}
          <Progress label="100%" />
          <small>{copy.analysis.note}</small>
        </div>
      );
    }
    if (id === "panel-job") {
      return (
        <div className={`${styles.panel} ${styles.jobPanel}`}>
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
      return (
        <div className={`${styles.panel} ${styles.tailor}`} data-panel="original">
          <small className={styles.kicker}>{copy.tailor.kickerOriginal}</small>
          <h3>{copy.tailor.titleOriginal}</h3>
          <blockquote>Worked on frontend development tasks and fixed bugs.</blockquote>
          <p className={styles.tailorNote}><Link2 size={14} /> {copy.tailor.evidence}</p>
        </div>
      );
    }
    if (id === "panel-suggestion") {
      return (
        <div className={`${styles.panel} ${styles.tailor}`} data-panel="suggestion">
          {suggestion === "accepted" && <span className={styles.acceptChip}><Check size={12} /> {copy.tailor.acceptChip}</span>}
          <small className={styles.kicker}>{copy.tailor.kickerSuggestion}</small>
          <h3>{copy.tailor.titleSuggestion}</h3>
          <blockquote>
            {SUGGESTION_TEXT.map((part, index) => part.fresh
              ? <mark key={index} className={styles.diffNew}>{part.text}</mark>
              : <span key={index}>{part.text}</span>)}
          </blockquote>
          <p className={styles.diffLegend}><Sparkles size={12} /> {copy.tailor.legend}</p>
          <div className={styles.reviewActions}>
            <button type="button" aria-pressed={suggestion === "rejected"} onClick={() => decide("rejected")}>{suggestion === "rejected" ? copy.tailor.rejectKept : copy.tailor.reject}</button>
            <button type="button" aria-pressed={suggestion === "accepted"} onClick={() => decide("accepted")}>{suggestion === "accepted" ? copy.tailor.accepted : copy.tailor.accept}</button>
          </div>
          <p className={styles.reviewStatus} aria-live="polite">{reviewStatus}</p>
        </div>
      );
    }
    if (id === "panel-assembly") {
      return (
        <div className={`${styles.panel} ${styles.assembly}`}>
          <h3>{copy.assembly.title}</h3>
          {copy.assembly.steps.map((label) => <p key={label}><Check size={16} />{label}</p>)}
          <Progress label={copy.assembly.progress} />
          <p className={styles.assemblyCount} aria-hidden="true" ref={assemblyCountNode}>{copy.assembly.docked(0)}</p>
          <small>{copy.assembly.note(selected.name)}</small>
        </div>
      );
    }
    if (id === "panel-final") {
      return (
        <div className={`${styles.panel} ${styles.finalPanel}`}>
          <h3>{copy.finalPanel.title}</h3>
          {OUTPUT_ROWS.map((row) => (
            <button key={row.row} type="button" className={styles.outputRow} onClick={() => runOutput(row.action)}>
              <Icon name={row.icon} size={18} />
              <span>{copy.finalPanel.rows[row.row]}</span>
              <Check size={14} />
            </button>
          ))}
          <p aria-live="polite">
            {shareState === "copied"
              ? copy.finalPanel.statusCopied
              : shareState === "failed"
                ? copy.finalPanel.statusFailed
                : identity.personal
                  ? copy.finalPanel.statusPersonal(identity.firstName)
                  : copy.finalPanel.statusIdle}
          </p>
          <div className={styles.fileRow} aria-hidden="true">
            <i>PDF</i><i>DOC</i><i>in</i>
          </div>
        </div>
      );
    }
    if (id === "intro-final") {
      return (
        <div className={styles.finalIntro}>
          <span className={styles.finalSeal}><Check size={14} /> {copy.final.seal}</span>
          <h3>{copy.final.headingTop}<br />{copy.final.headingBottom}</h3>
          <p>{copy.final.body}</p>
          <Link href="/register" className={styles.finalCta} onClick={() => track({ name: "career_story_cta_click", properties: { placement: "final" } })}>{copy.final.cta} <ArrowUpRight size={16} /></Link>
        </div>
      );
    }
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
          <div className={styles.floor} aria-hidden="true" />
          <div className={styles.ambience} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.bokeh} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className={styles.trails} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.particles} aria-hidden="true">
            {PARTICLES.map((particle, index) => (
              <i key={index} style={{ "--particle-x": `${particle.x}%`, "--particle-y": `${particle.y}%`, "--particle-size": `${particle.size}px`, "--particle-delay": `${particle.delay}s`, "--particle-duration": `${particle.duration}s` } as CSSProperties} />
            ))}
          </div>
          <div className={styles.beam} aria-hidden="true"><i /><i /></div>
          <div className={styles.pedestal} aria-hidden="true"><i /></div>

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
                  data-tone={tone}
                  data-chip={CHIP_INDEX.get(object.id)}
                  inert={object.interactive ? !(0 >= object.interactive.from && 0 <= object.interactive.to) : undefined}
                >
                  {contentFor(object.id)}
                </div>
              );
            })}
          </div>

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
                  className={`${styles.chapter} ${sideClass} ${densityClass}`}
                  ref={(node) => { if (node) chapterNodes.current.set(index, node); else chapterNodes.current.delete(index); }}
                  style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}
                  inert={index !== 0}
                >
                  <span className={styles.chapterBadge}>{copy.pad2(index + 1)}</span>
                  <div className={styles.chapterCopy}>
                    <span className={styles.chapterEyebrow}>{narrative.eyebrow}</span>
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

            <div
              className={styles.galleryBar}
              ref={galleryNode}
              style={{ opacity: 0, visibility: "hidden" }}
              inert
              onKeyDown={onGalleryKeyDown}
              onTouchStart={onGalleryTouchStart}
              onTouchEnd={onGalleryTouchEnd}
            >
              <button type="button" aria-label={copy.gallery.previous} onClick={() => stepTemplate(-1, "arrows")}><ChevronLeft size={18} /></button>
              <div className={styles.galleryMeta} aria-live="polite">
                <strong>{selected.name}</strong>
                <span>{copy.templateDescription(selected.id)}</span>
                <em className={styles.galleryPick}>{copy.gallery.pick}</em>
                <div className={styles.galleryDots}>
                  {TEMPLATES.map((template, index) => (
                    <button
                      key={template.id}
                      type="button"
                      aria-pressed={index === selectedIndex}
                      aria-label={copy.gallery.select(template.name)}
                      onClick={() => chooseTemplate(template.id, "dots")}
                    >
                      <i data-on={index === selectedIndex ? "" : undefined} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" aria-label={copy.gallery.next} onClick={() => stepTemplate(1, "arrows")}><ChevronRight size={18} /></button>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLeft}>
                <span className={styles.progressCount} ref={progressTextNode}>{copy.pad2(1)} / {copy.pad2(SCENE_COUNT)}</span>
                <LocaleSwitch locale={locale} copy={copy} onSelect={chooseLocale} />
              </span>
              <span className={styles.metaRight}>
                <button
                  type="button"
                  className={styles.motionToggle}
                  aria-pressed={paused}
                  onClick={togglePause}
                >
                  {paused ? <Play size={13} /> : <Pause size={13} />}
                  <span className={styles.motionLabel}>{paused ? copy.resumeMotion : copy.pauseMotion}</span>
                </button>
                <a
                  href="#static-zone"
                  className={styles.metaSkip}
                  aria-label={copy.skipStory}
                  onClick={() => track({ name: "career_story_skip", properties: { scene: activeStage + 1 } })}
                >
                  <span className={styles.metaSkipText}>{copy.skipStory}</span> <ArrowDown size={13} />
                </a>
              </span>
            </div>

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
