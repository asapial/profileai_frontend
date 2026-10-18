"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowUpRight, BarChart3, BriefcaseBusiness, Check,
  ChevronLeft, ChevronRight, Code2, Download, FileText, FolderKanban,
  GraduationCap, Link2, MousePointer2, Send, ShieldCheck, Sparkles, Trophy, UserRound,
} from "lucide-react";
import { useStoryStore, type TemplateKey } from "@/store/useStoryStore";
import styles from "./CareerSceneDeck.module.css";
import { CareerNetwork } from "./CareerNetwork";
import { StoryConnections } from "./StoryConnections";

/** One scene is centred per this fraction of a viewport of scrolling. */
const SCENE_STEP = 0.82;
const SCENE_COUNT = 8;
/** Sticky runway: every scene gets its own slice, plus the viewport the stage leaves on. */
const RUNWAY = SCENE_COUNT * SCENE_STEP + 1;
const FILM_QUERY = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";

const chapters = [
  "Career Universe",
  "AI Intelligence Network",
  "Structured Evidence",
  "Job Alignment",
  "AI Content Tailoring",
  "Choose Your Resume Style",
  "Live Resume Assembly",
  "Your Professional Resume is Ready",
] as const;
const signals = [
  ["React", Code2, 30, 15], ["Python", Code2, 67, 12],
  ["Problem solving", Sparkles, 15, 35], ["LCP improved 31%", BarChart3, 82, 33],
  ["TypeScript", Code2, 30, 42], ["Open source", FolderKanban, 72, 54],
  ["Team leadership", UserRound, 18, 66], ["Hackathon winner", Trophy, 87, 75],
  ["Design systems", Sparkles, 35, 82], ["BSc in Computer Science", GraduationCap, 64, 86],
] as const;
const categories = [
  ["Professional Summary", "Grounded in your experience", FileText], ["Skills", "12 technical & soft skills", BarChart3],
  ["Work Experience", "3 source-linked entries", BriefcaseBusiness], ["Achievements", "3 measured outcomes", Trophy],
  ["Projects", "5 projects with evidence", FolderKanban], ["Education", "Your academic background", GraduationCap],
] as const;
const universeConnections = signals.map((_, index) => ({ from: "career-core", to: `signal-${index}` }));
const evidenceConnections = [0, 2, 4].flatMap((index) => [
  { from: "source-point", to: `evidence-${index}` },
  { from: `evidence-${index}`, to: `evidence-${index + 1}` },
]);
const handoffs = ["Connect the signals", "Organize the evidence", "Find the role fit", "Shape the story", "Choose your identity", "Weave it together", "Ready for your next move"];
const templates: { id: TemplateKey; name: string; description: string }[] = [
  { id: "technical", name: "Technical", description: "Clear structure. Confident detail." },
  { id: "editorial", name: "Editorial", description: "Timeless typography. Quiet presence." },
  { id: "minimal", name: "Minimal", description: "Focused content. Room to breathe." },
  { id: "grid", name: "Studio", description: "Distinct hierarchy. Modern rhythm." },
];
const alignmentRows = [
  ["React development", "React / Next.js", "Strong match", "Matched", Code2, "matched"],
  ["UI/UX implementation", "Build user interfaces", "Strong match", "Matched", FileText, "matched"],
  ["Team collaboration", "Work in a team", "Strong match", "Matched", UserRound, "matched"],
  ["System design", "System design knowledge", "No evidence", "Not matched", FolderKanban, "missing"],
  ["Mentoring", "Mentor junior developers", "Related work", "Partial", GraduationCap, "partial"],
] as const;
const assemblyRows = ["Personal information", "Professional summary", "Work experience", "Projects", "Education", "Skills"];
const matchConnections = alignmentRows.map((row, index) => ({ from: `evidence-row-${index}`, to: `job-row-${index}`, tone: row[5] }));
const assemblyConnections = assemblyRows.map((_, index) => ({ from: `input-${index}`, to: `paper-${index}` }));

/** Deterministic spread, so server and client markup agree. */
const particles = Array.from({ length: 26 }, (_, index) => {
  const angle = index * 2.3999632297;
  return {
    x: Number((Math.cos(angle) * 46 + 50).toFixed(2)),
    y: Number((Math.sin(angle * 1.7) * 42 + 50).toFixed(2)),
    size: Number((1.6 + ((index * 7) % 5) * 0.5).toFixed(1)),
    delay: Number((-((index * 1.7) % 24)).toFixed(1)),
    duration: 16 + ((index * 3) % 9),
  };
});

function ResumeSheet({ variant = "editorial", assembling = false }: { variant?: TemplateKey; assembling?: boolean }) {
  return (
    <div className={`${styles.resume} ${styles[variant]} ${assembling ? styles.assembling : ""}`}>
      <header data-wire={assembling ? "paper-0" : undefined}><span>ALEX MORGAN</span><p>Frontend Engineer</p><small>alex@example.com · Austin, TX · Portfolio</small></header>
      <section data-wire={assembling ? "paper-1" : undefined}><h4>Professional summary</h4><p>Frontend engineer building accessible products and thoughtful design systems with React and TypeScript.</p></section>
      <section data-wire={assembling ? "paper-2" : undefined}><h4>Work experience</h4><b>Frontend Engineer <em>2022 — Present</em></b><p>Built reusable components for a customer dashboard.</p><ul><li>Improved load performance by 31%.</li><li>Partnered with design and product teams.</li></ul></section>
      <section data-wire={assembling ? "paper-3" : undefined}><h4>Selected projects</h4><b>Customer Dashboard</b><p>A shared component library with accessible interfaces.</p><div className={styles.paperLines}><i /><i /></div></section>
      <section data-wire={assembling ? "paper-4" : undefined}><h4>Education</h4><b>BSc in Computer Science</b><div className={styles.paperLines}><i /></div></section>
      <section data-wire={assembling ? "paper-5" : undefined}><h4>Skills</h4><div className={styles.paperSkills}><span>React</span><span>TypeScript</span><span>UI systems</span><span>Git</span></div></section>
    </div>
  );
}

function Progress({ label = "100%" }: { label?: string }) {
  return <div className={styles.progress}><div><i /></div><span>{label}</span></div>;
}

/**
 * One frame of the film. The visible heading is intentionally gone; the scene keeps an
 * off-screen heading so the section is still named for assistive technology and crawlers.
 * No props are used here, the driver threads everything through CSS custom properties.
 */
function Scene({ index, children }: { index: number; children: ReactNode }) {
  return (
    <section
      id={`career-stage-${index + 1}`}
      data-career-stage={index}
      aria-labelledby={`career-title-${index}`}
      className={styles.scene}
      style={{ visibility: index ? "hidden" : "visible" }}
    >
      <h2 id={`career-title-${index}`} className={styles.srOnly}>{chapters[index]}</h2>
      <div
        className={styles.sceneBox}
        style={{
          "--scene-x": `${index * 100}%`,
          "--scene-z": `${index ? -300 : 0}px`,
          "--scene-rot": `${index * 14}deg`,
          "--scene-scale": index ? ".94" : "1",
          "--scene-veil": index ? ".5" : "0",
        } as CSSProperties}
      >
        <span className={styles.sceneVeil} aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}

export function CareerSceneDeck() {
  const root = useRef<HTMLDivElement>(null);
  const activeTemplate = useStoryStore((state) => state.activeTemplate);
  const setActiveTemplate = useStoryStore((state) => state.setActiveTemplate);
  const [suggestion, setSuggestion] = useState<"pending" | "accepted" | "rejected">("pending");
  const selected = templates.findIndex((template) => template.id === activeTemplate);

  useEffect(() => {
    const film = root.current?.querySelector<HTMLElement>(`.${styles.film}`);
    if (!film) return;
    const stage = film.querySelector<HTMLElement>(`.${styles.stage}`);
    const scenes = Array.from(film.querySelectorAll<HTMLElement>("[data-career-stage]"));
    const boxes = scenes.map((scene) => scene.querySelector<HTMLElement>(`.${styles.sceneBox}`));
    if (!scenes.length || !stage) return;

    const filmQuery = window.matchMedia(FILM_QUERY);
    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
    const smoothstep = (value: number) => value * value * (3 - 2 * value);
    const reveal = Array(SCENE_COUNT).fill(1) as number[];
    const active = Array(SCENE_COUNT).fill(false) as boolean[];
    let frame = 0;
    let previousTime = 0;
    let drive: number | null = null;
    let activeScene = -1;

    const update = (time: number) => {
      frame = 0;
      const state = useStoryStore.getState();
      // The layout is a media-query decision; the pause button only removes the smoothing.
      const inFilm = filmQuery.matches;
      const rect = film.getBoundingClientRect();
      const viewport = window.innerHeight;
      const travel = Math.max(1, rect.height - viewport);
      const target = clamp01(-rect.top / travel) * SCENE_COUNT;
      // One heavily damped value drives every scene, so discrete wheel steps settle as travel.
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 16;
      previousTime = time;
      const damping = inFilm && state.motionEnabled ? 1 - Math.exp(-elapsed / 135) : 1;
      if (drive === null) drive = target;
      else drive += (target - drive) * damping;
      const centred = drive;
      let unsettled = inFilm && Math.abs(target - centred) > 0.0008;

      // In the film the centred index comes from the wheel-driven value; in the reading
      // layout every scene reports its own position instead.
      const rects = inFilm ? null : scenes.map((scene) => scene.getBoundingClientRect());
      let sceneIndex = Math.round(Math.min(SCENE_COUNT, Math.max(0, centred)));
      if (rects) {
        let nearest = Infinity;
        sceneIndex = 0;
        rects.forEach((section, index) => {
          const distance = Math.abs(section.top + section.height / 2 - viewport / 2);
          if (distance < nearest) { nearest = distance; sceneIndex = index; }
        });
      }

      scenes.forEach((scene, index) => {
        const distance = index - centred;
        const gap = Math.abs(distance);
        const isActive = index === sceneIndex;
        if (isActive !== active[index]) {
          active[index] = isActive;
          scene.classList.toggle(styles.isActive, isActive);
        }
        const box = boxes[index];
        if (box) {
          if (inFilm) {
            box.style.setProperty("--scene-x", `${(distance * 100).toFixed(2)}%`);
            box.style.setProperty("--scene-z", `${(-Math.min(1.1, gap) * 320).toFixed(1)}px`);
            box.style.setProperty("--scene-rot", `${(distance * 14).toFixed(2)}deg`);
            box.style.setProperty("--scene-scale", (1 - Math.min(1, gap) * .07).toFixed(4));
            box.style.setProperty("--scene-veil", clamp01(gap * .8 - .3).toFixed(3));
            box.style.setProperty("--scene-reveal", clamp01(1.2 - gap).toFixed(3));
            box.style.setProperty("--scene-opacity", "1");
            box.style.setProperty("--scene-shift", "0px");
          } else if (rects) {
            const section = rects[index];
            const incoming = smoothstep(clamp01((viewport - section.top) / (viewport * .7)));
            const blend = 1 - Math.exp(-elapsed / 120);
            reveal[index] += (incoming - reveal[index]) * blend;
            if (Math.abs(incoming - reveal[index]) > .001) unsettled = true;
            box.style.setProperty("--scene-reveal", reveal[index].toFixed(4));
            box.style.setProperty("--scene-opacity", (.35 + reveal[index] * .65).toFixed(4));
            box.style.setProperty("--scene-shift", `${((1 - reveal[index]) * 36).toFixed(2)}px`);
          }
        }
        const hidden = inFilm && gap > 1.4;
        scene.style.visibility = hidden ? "hidden" : "visible";
        if (scene.inert !== hidden) scene.inert = hidden;
      });

      if (sceneIndex !== activeScene) {
        activeScene = sceneIndex;
        stage.dataset.active = String(sceneIndex);
        if (state.activeStage !== sceneIndex) state.setActiveStage(sceneIndex);
      }
      const progress = clamp01(-rect.top / travel);
      if (inFilm && Math.abs(state.scrollProgress - progress) > .002) state.setScrollProgress(progress);
      if (unsettled) frame = requestAnimationFrame(update);
      else previousTime = 0;
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const move = (event: PointerEvent) => {
      if (!filmQuery.matches || !useStoryStore.getState().motionEnabled) return;
      const x = Number((event.clientX / window.innerWidth - .5).toFixed(3));
      const y = Number((event.clientY / window.innerHeight - .5).toFixed(3));
      stage.style.setProperty("--pointer-x", String(x));
      stage.style.setProperty("--pointer-y", String(y));
    };
    schedule();
    filmQuery.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      filmQuery.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  /** In film mode an anchor jump has to travel the runway, not the scene element. */
  const showScene = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    const film = root.current?.querySelector<HTMLElement>(`.${styles.film}`);
    if (!film || !window.matchMedia(FILM_QUERY).matches) return;
    const rect = film.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    event.preventDefault();
    window.scrollTo({ top: rect.top + window.scrollY + (index / SCENE_COUNT) * travel, behavior: "smooth" });
  };

  return (
    <div ref={root} className={styles.deck}>
      <div className={styles.film} style={{ "--runway": RUNWAY } as CSSProperties}>
        <div className={styles.stage} data-active="0">
          <div className={styles.floor} aria-hidden="true" />
          <div className={styles.ambience} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.particles} aria-hidden="true">
            {particles.map((particle, index) => (
              <i
                key={index}
                style={{
                  "--particle-x": `${particle.x}%`,
                  "--particle-y": `${particle.y}%`,
                  "--particle-size": `${particle.size}px`,
                  "--particle-delay": `${particle.delay}s`,
                  "--particle-duration": `${particle.duration}s`,
                } as CSSProperties}
              />
            ))}
          </div>
          <div className={styles.beam} aria-hidden="true"><i /><i /></div>

          <div className={styles.camera}>
            <Scene index={0}>
              <div className={`${styles.art} ${styles.universe}`}>
                <StoryConnections connections={universeConnections} radial />
                <div className={styles.orbit}><i /><i /><i /></div>
                <div className={styles.core} data-wire="career-core"><UserRound /><strong>You</strong><small>Your career universe</small></div>
                {signals.map(([label, Icon, x, y], index) => <div key={label} data-wire={`signal-${index}`} className={styles.signal} style={{ left: `${x}%`, top: `${y}%`, "--delay": `${index * -.7}s` } as CSSProperties}><span><Icon size={19} /></span>{label}</div>)}
                {[0, 1, 2, 3, 4].map((index) => <i key={index} className={styles.satellite} style={{ left: `${23 + index * 14}%`, top: `${24 + (index % 3) * 24}%`, "--delay": `${index * -1.1}s` } as CSSProperties} />)}
              </div>
              <div className={styles.heroActions}><Link href="/register" className={styles.primary}>Build my career story <ArrowUpRight size={17} /></Link><a href="#career-stage-2" onClick={(event) => showScene(event, 1)}>See how it connects <ArrowDown size={16} /></a><small><ShieldCheck size={14} /> Illustrative profile · Your evidence. Your control.</small></div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[0]}</span></div>

            <Scene index={1}>
              <div className={`${styles.art} ${styles.networkLayout}`}>
                <CareerNetwork />
                <div className={`${styles.panel} ${styles.analysis}`}><h3>Connecting your career data</h3>{["Identifying key skills", "Mapping related projects", "Finding achievements", "Connecting source evidence", "Building your career network"].map((label, index) => <p key={label} style={{ "--order": index } as CSSProperties}><Check size={16} />{label}</p>)}<Progress /><small>Every connection starts with your work.</small></div>
              </div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[1]}</span></div>

            <Scene index={2}>
              <div className={`${styles.art} ${styles.evidenceLayout}`}>
                <StoryConnections connections={evidenceConnections} />
                <div className={styles.sourceCluster}><small>YOUR CAREER SIGNALS</small>{["React", "Project notes", "31% faster", "Team leadership", "Portfolio", "Education"].map((label) => <span key={label}><Link2 size={13} />{label}</span>)}<div className={styles.sourcePoint} data-wire="source-point" /></div>
                <div className={styles.evidenceGrid}>{categories.map(([title, note, Icon], index) => <div data-wire={`evidence-${index}`} className={`${styles.panel} ${styles.evidenceCard}`} key={title}><span className={styles.iconTile}><Icon /></span><div><h3>{title}</h3><p>{note}</p></div></div>)}</div>
              </div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[2]}</span></div>

            <Scene index={3}>
              <div className={`${styles.art} ${styles.alignment}`}>
                <StoryConnections connections={matchConnections} />
                <div className={`${styles.panel} ${styles.matchPanel}`}><h3>Your Career Evidence</h3>{alignmentRows.map(([evidence, , state, , Icon, tone], index) => <div data-wire={`evidence-row-${index}`} className={styles.matchRow} key={evidence}><Icon size={19} /><span>{evidence}</span><b className={styles[tone]}>{state}</b></div>)}</div>
                <div className={`${styles.panel} ${styles.matchPanel}`}><h3>Job Description <small>Frontend Engineer</small></h3>{alignmentRows.map(([, job, , state, , tone], index) => <div data-wire={`job-row-${index}`} className={styles.matchRow} key={job}><i className={`${styles.matchDot} ${styles[tone]}`} /><span>{job}</span><b className={styles[tone]}>{state}</b></div>)}</div>
              </div>
              <p className={styles.sceneNote}>Match labels illustrate how evidence supports a role. Missing skills remain visible.</p>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[3]}</span></div>

            <Scene index={4}>
              <div className={`${styles.art} ${styles.tailoring}`}><div className={`${styles.panel} ${styles.original}`}><small>01 / YOUR WORDS</small><h3>Original Content</h3><blockquote>Worked on frontend development tasks and fixed bugs.</blockquote><p><Link2 size={14} /> Project evidence: load performance improved 31%.</p></div><div className={styles.aiBridge}><svg viewBox="0 0 180 180" aria-hidden="true">{[40, 65, 90, 115, 140].map((y) => <path key={y} d={`M0 ${y} C55 ${y} 45 90 90 90 S125 ${y} 180 ${y}`} />)}</svg><div className={styles.aiOrb}><Sparkles /><strong>AI</strong></div><small>Grounded in your evidence</small></div><div className={`${styles.panel} ${styles.suggestion}`}><small>02 / CLEARER IMPACT</small><h3>Tailored Suggestion</h3><blockquote>Developed reusable React components for a customer dashboard, improving load performance by 31%.</blockquote><div className={styles.reviewActions}><button type="button" aria-pressed={suggestion === "rejected"} onClick={() => setSuggestion("rejected")}>{suggestion === "rejected" ? "Original kept" : "Reject"}</button><button type="button" aria-pressed={suggestion === "accepted"} onClick={() => setSuggestion("accepted")}>{suggestion === "accepted" ? "Accepted ✓" : "Accept suggestion"}</button></div><p aria-live="polite">{suggestion === "pending" ? "Try the review. This is an illustrative example." : suggestion === "accepted" ? "Suggestion selected for this preview." : "Original wording selected for this preview."}</p></div></div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[4]}</span></div>

            <Scene index={5}>
              <div className={`${styles.art} ${styles.gallery}`}><div className={styles.galleryFloor} />{templates.map((template, index) => <button type="button" key={template.id} aria-label={`Select ${template.name} resume template`} aria-pressed={activeTemplate === template.id} className={`${styles.template} ${activeTemplate === template.id ? styles.selected : ""}`} style={{ "--slot": index } as CSSProperties} onClick={() => setActiveTemplate(template.id)}><ResumeSheet variant={template.id} /><span className={styles.templateName}>{template.name}{activeTemplate === template.id && <Check size={14} />}</span>{activeTemplate === template.id && <MousePointer2 className={styles.cursor} aria-hidden="true" />}</button>)}</div>
              <div className={styles.galleryControls}><button type="button" aria-label="Previous template" onClick={() => setActiveTemplate(templates[(selected + 3) % 4].id)}><ChevronLeft size={19} /></button><div aria-live="polite"><strong>{templates[selected].name}</strong><span>{templates[selected].description}</span></div><button type="button" aria-label="Next template" onClick={() => setActiveTemplate(templates[(selected + 1) % 4].id)}><ChevronRight size={19} /></button></div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[5]}</span></div>

            <Scene index={6}>
              <div className={`${styles.art} ${styles.assembly}`}>
                <StoryConnections connections={assemblyConnections} />
                <div className={styles.assemblyInputs}>{assemblyRows.map((label, index) => <div data-wire={`input-${index}`} className={styles.panel} key={label}><FileText size={20} /><span>{label}</span><Check size={14} /></div>)}</div>
                <div className={styles.assemblyPaper}><ResumeSheet variant={activeTemplate} assembling /></div>
                <div className={`${styles.panel} ${styles.assemblyStatus}`}><h3>Assembling your resume</h3>{["Formatting content", "Optimizing layout", "Applying your style", "Finalizing document"].map((label) => <p key={label}><Check size={16} />{label}</p>)}<Progress label="Preview" /><small>{templates[selected].name} template selected</small></div>
              </div>
            </Scene>

            <div className={styles.handoff} aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none">{[-1, 0, 1].map((offset) => <g key={offset}><path d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /><path className={styles.handoffPulse} pathLength="100" d={`M${300 + offset * 160} 0 C${300 + offset * 160} 45 300 30 300 100`} /></g>)}</svg><span>{handoffs[6]}</span></div>

            <Scene index={7}>
              <div className={`${styles.art} ${styles.final}`}><div className={styles.finalIntro}><span className={styles.readySeal}><Check size={16} /> Ready for your review</span><h3>Your experience.<br />Beautifully presented.</h3><p>One source of truth, from your first career signal to the next application.</p><Link href="/register" className={styles.primary}>Create my resume <ArrowUpRight size={17} /></Link></div><div className={styles.pedestal}><div className={styles.finalPaper}><ResumeSheet variant={activeTemplate} /></div><i className={styles.plinth} /><svg className={styles.finalThreads} viewBox="0 0 400 450" aria-hidden="true">{[0, 1, 2].map((index) => <path key={index} d={`M 155 420 C ${-130 + index * 20} 300 200 260 200 55 C 200 220 ${500 - index * 20} 340 250 420`} />)}</svg></div><div className={`${styles.panel} ${styles.outputPanel}`}><h3>Everything for your next move</h3>{[[Download, "PDF export"], [Link2, "Shareable resume"], [Send, "Create application"], [BarChart3, "Track applications"]].map(([Icon, label]) => { const OutputIcon = Icon as typeof Download; return <div key={label as string}><OutputIcon size={19} /><span>{label as string}</span><Check size={14} /></div>; })}<p>Illustrative resume · Start free to create yours.</p></div></div>
            </Scene>
          </div>
        </div>
      </div>
    </div>
  );
}
