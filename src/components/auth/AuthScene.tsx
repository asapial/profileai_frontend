"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles, ArrowUpRight, Check, Fingerprint, Layers3 } from "lucide-react";

const stories: Record<string, { eyebrow: string; title: string; accent: string; description: string }> = {
  "/register": { eyebrow: "A LITTLE AMBITION. A NEW BEGINNING.", title: "Your next chapter.", accent: "Beautifully yours.", description: "Bring your experience, ideas, and ambition. Give your professional story a place to grow." },
  "/forgot-password": { eyebrow: "LET’S GET YOU BACK", title: "A fresh start.", accent: "Same possibilities.", description: "A moment to reconnect, then back to building what comes next. We’ll guide you through every step." },
  "/forget-password": { eyebrow: "LET’S GET YOU BACK", title: "A fresh start.", accent: "Same possibilities.", description: "A moment to reconnect, then back to building what comes next. We’ll guide you through every step." },
  "/reset-password": { eyebrow: "A FRESH LAYER OF PROTECTION", title: "New password.", accent: "New peace of mind.", description: "Keep your work close and your account protected. Your next opportunity is still waiting." },
  "/verify-email": { eyebrow: "ONE SMALL STEP TO GET STARTED", title: "Make it official.", accent: "Make it yours.", description: "Verify your email to unlock your personal career workspace. Your story starts here." },
};
const defaultStory = { eyebrow: "YOUR PERSONAL CAREER STUDIO", title: "Good to see you.", accent: "Great things ahead.", description: "Your experience is worth more than a document. Shape your story, discover your strengths, and make your next move." };

export function AuthScene({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scene = useRef<HTMLDivElement>(null);
  const story = pathname.startsWith("/login/2fa") ? { eyebrow: "AN EXTRA LAYER OF CONFIDENCE", title: "Your world.", accent: "Well protected.", description: "A quick security check keeps your work and personal information in the right hands. Yours." } : stories[pathname] ?? defaultStory;
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    let frame = 0;
    const reset = () => { cancelAnimationFrame(frame); element.style.setProperty("--scene-x", "0deg"); element.style.setProperty("--scene-y", "0deg"); };
    const move = (event: PointerEvent) => {
      if (preference.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--scene-x", `${((event.clientX - rect.left) / rect.width - .5) * 12}deg`);
        element.style.setProperty("--scene-y", `${((event.clientY - rect.top) / rect.height - .5) * -8}deg`);
      });
    };
    element.addEventListener("pointermove", move); element.addEventListener("pointerleave", reset); preference.addEventListener("change", reset);
    return () => { cancelAnimationFrame(frame); element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", reset); preference.removeEventListener("change", reset); };
  }, []);
  return <div ref={scene} className="auth-scene mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
    <div className="auth-atmosphere" aria-hidden="true"><div /><div /><span /></div>
    <aside className="auth-story hidden lg:block">
      <span className="auth-eyebrow"><span /> {story.eyebrow}</span>
      <h2 className="auth-story-title">{story.title}<br /><span>{story.accent}</span></h2>
      <p className="auth-story-description">{story.description}</p>
      <div className="auth-orbit" aria-hidden="true">
        <div className="auth-orbit-ring" /><div className="auth-orbit-ring second" />
        <div className="auth-orbit-dot" />
        <div className="auth-depth-stage">
          <div className="auth-back-sheet far" /><div className="auth-back-sheet" />
          <div className="auth-resume-preview">
            <div className="auth-document-top"><span><Layers3 size={12} /> PROFILE / 01</span><span className="auth-document-dots">•••</span></div>
            <div className="flex items-center gap-3"><span className="auth-mini-avatar">AM</span><div><strong className="text-base">Alex Morgan</strong><p className="mt-1 text-xs text-muted-foreground">Product designer & creative thinker</p></div><ArrowUpRight className="ml-auto text-violet-400" size={21} /></div>
            <div className="auth-document-rule" />
            <div className="auth-document-label">A STORY WORTH TELLING</div>
            <div className="auth-preview-line" /><div className="auth-preview-line short" />
            <div className="mt-5 flex gap-2"><span className="auth-preview-pill">Design thinking</span><span className="auth-preview-pill">Leadership</span><span className="auth-preview-pill">Strategy</span></div>
            <div className="auth-document-bottom"><span><Check size={13} /> Your potential, on paper.</span><Sparkles size={15} /></div>
          </div>
          <div className="auth-spark-chip"><Sparkles size={17} /><div><strong>A little AI. A lot of you.</strong><span>Let your experience shine</span></div></div>
          <div className="auth-security-chip"><span className="auth-security-icon"><Fingerprint size={25} /></span><div><strong>Uniquely yours.</strong><span>Protected at every step</span></div><ShieldCheck size={17} /></div>
        </div>
      </div>
      <div className="auth-story-footer"><span>CREATE WITH CONFIDENCE</span><i /><span>GROW AT YOUR PACE</span></div>
    </aside>
    <div className="auth-form-column mx-auto w-full max-w-lg">{children}<p className="auth-form-footnote"><ShieldCheck size={13} /> A private space for your next big move.</p></div>
  </div>;
}
