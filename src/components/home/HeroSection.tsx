"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ArrowDown, Check, Fingerprint } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValueEvent, useMotionValue, useSpring } from "framer-motion";
import type { ManagedHomepageSection } from "@/lib/homepage";
import { MorphingCareerScene } from "./MorphingCareerScene";
const desktopQuery = "(min-width: 1024px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)";
const subscribeViewport = (notify: () => void) => {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const desktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const serverSnapshot = () => false;
// Spatial easing: reversible and deterministic, with no time-based catch-up.
function choreograph(value: number) {
  for (const [start, end] of [[.16, .4], [.56, .82]]) {
    if (value > start && value < end) {
      const t = (value - start) / (end - start);
      return start + t * t * (3 - 2 * t) * (end - start);
    }
  }
  return value;
}
export function HeroSection({ content }: { content?: ManagedHomepageSection }) {
  const animated = useSyncExternalStore(subscribeViewport, desktopSnapshot, serverSnapshot);
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  const journey = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: journey, offset: ["start start", "end end"] });
  // Smooth discrete wheel input once, before every geometry/opacity consumer.
  // A heavily damped shared spring avoids independent layers catching up apart.
  const targetProgress = useMotionValue(0);
  const progress = useSpring(targetProgress, { stiffness: 300, damping: 35, mass: .55, restDelta: .0001, restSpeed: .001 });
  useEffect(() => {
    // One explicit driver keeps SVG attributes and CSS opacity/3D transforms on
    // the same timeline. Mixing native scroll timelines with SVG caused drift.
    const initial = animated ? choreograph(scrollYProgress.get()) : 0;
    targetProgress.set(initial);
    progress.jump(initial);
    if (!animated) return;
    return scrollYProgress.on("change", value => targetProgress.set(choreograph(value)));
  }, [animated, progress, targetProgress, scrollYProgress]);
  const x = useTransform(progress, [0, .16, .4, .56, .82, 1], ["0%", "0%", "-100%", "-100%", "0%", "0%"]);
  const travelScale = useTransform(progress, [0, .16, .28, .4, .56, .69, .82, 1], [1, 1, .9, 1, 1, .9, 1, 1]);
  const introOpacity = useTransform(progress, [0, .16, .23], [1, 1, 0]);
  const alignOpacity = useTransform(progress, [.35, .4, .56, .63], [0, 1, 1, 0]);
  const applyOpacity = useTransform(progress, [.77, .82, 1], [0, 1, 1]);
  useMotionValueEvent(progress, "change", value => {
    const next = value < .28 ? 0 : value < .69 ? 1 : 2;
    if (next !== chapterRef.current) { chapterRef.current = next; setChapter(next); }
  });
  const current = animated ? chapter : 0;
  return <section ref={journey} className="studio-hero orbit-hero orbit-journey journey-responsive" data-enhanced={animated || undefined} aria-label="From your experience to your next application">
    <div className="journey-sticky">
    <div className="orbit-grid" aria-hidden="true" />
    <div className="studio-container studio-hero-grid">
      <motion.div className="studio-hero-copy journey-intro" style={animated ? { opacity: introOpacity } : { opacity: 1 }} inert={animated && chapter !== 0}>
        <p className="orbit-kicker"><span className="orbit-status" /> THE JOB SEARCH, REIMAGINED</p>
        <h1>{content?.title || <>Your next move.<br /><em>Beautifully</em><br />prepared.</>}</h1>
        <p className="studio-lede">{content?.description || "Find the role. Tell your story. Make your move. A connected career workspace that turns your real experience into applications worth sending."}</p>
        <div className="studio-hero-actions"><Link className="orbit-primary" href={content?.primaryCta?.href || "/register"}>{content?.primaryCta?.label || "Build my career workspace"}<ArrowUpRight size={18} /></Link><a className="orbit-secondary" href="#match">See it in action <ArrowDown size={15} /></a></div>
        <div className="orbit-assurances"><span><Check size={14} /> Free to start</span><span><Fingerprint size={14} /> Your evidence. Your control.</span></div>
      </motion.div>
      <motion.div className="journey-copy journey-align" style={animated ? { opacity: alignOpacity } : { opacity: 1 }} inert={animated && chapter !== 1}>
        <p className="orbit-kicker">02 / FIND YOUR CONNECTION</p>
        <h2>Your experience.<br /><em>In the right light.</em></h2>
        <p className="studio-lede">Your resume unfolds into evidence you can review. Connect the role’s requirements to work you have actually done.</p>
        <div className="journey-detail"><Check size={17} /><span>Real evidence. Clear gaps. A more thoughtful next step.</span></div>
        <Link className="orbit-secondary" href="/dashboard/career">Explore job alignment <ArrowUpRight size={16} /></Link>
      </motion.div>
      <motion.div className="journey-copy journey-apply" style={animated ? { opacity: applyOpacity } : { opacity: 1 }} inert={animated && chapter !== 2}>
        <p className="orbit-kicker">03 / MAKE YOUR MOVE</p>
        <h2>From a match.<br /><em>To your next move.</em></h2>
        <p className="studio-lede">Your evidence becomes a plan. Track applications, prepare for the conversation, and keep every next action in one clear workspace.</p>
        <Link className="orbit-primary" href="/dashboard/applications">Open my workspace <ArrowUpRight size={18} /></Link>
        <p className="career-demo-note">You review every draft. Nothing is sent automatically.</p>
      </motion.div>
      <motion.div style={animated ? { x, scale: travelScale } : { x: 0, scale: 1 }} className="orbit-stage morph-stage">
        <MorphingCareerScene progress={progress} />
        <div className="morph-caption"><span>LIVE PRODUCT ILLUSTRATION</span><span>{["Resume", "Job alignment", "Application tracker"][current]}</span></div>
      </motion.div>
    </div>
    <div className="journey-progress" aria-hidden="true">{["Resume", "Job alignment", "Application tracker"].map((label, i) => <span className={current === i ? "active" : ""} key={label}><b>0{i+1}</b>{label}</span>)}</div>
    </div>
    <div className="studio-container orbit-capabilities"><span>ONE WORKSPACE.<br /><b>EVERY NEXT STEP.</b></span>{["Discover", "Align", "Tailor", "Apply", "Track"].map((word, i) => <div key={word}><span>0{i + 1}</span>{word}</div>)}</div>
  </section>;
}
