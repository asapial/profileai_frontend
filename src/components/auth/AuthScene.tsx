"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, FileText, ScanLine, BriefcaseBusiness, ShieldCheck } from "lucide-react";

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
  const story = pathname.startsWith("/login/2fa") ? { eyebrow: "ACCOUNT SECURITY", title: "One quick check.", accent: "Then you're in.", description: "Confirm it’s you to continue to your career workspace." } : stories[pathname] ?? defaultStory;
  return <div className="auth-scene">
    <aside className="auth-story">
      <Link href="/" className="auth-back"><ArrowLeft size={16} /> Back to ProfileAI</Link>
      <div className="auth-story-content">
        <span className="auth-eyebrow">{story.eyebrow}</span>
        <h2 className="auth-story-title">{story.title}<br /><span>{story.accent}</span></h2>
        <p className="auth-story-description">{story.description}</p>
        <div className="auth-workspace-preview" aria-label="Career workspace preview">
          <div className="auth-workspace-heading"><span className="auth-workspace-logo">P</span><strong>A little clarity. A lot of possibility.</strong><ArrowUpRight size={18}/></div>
          <div className="auth-workspace-document"><span className="auth-document-label">YOUR STORY, TAKING SHAPE</span><h3>Experience.<br/>With intention.</h3><div className="auth-document-lines"><i/><i/><i/></div><span className="auth-draft-status"><Check size={14}/> Ready for your next chapter</span></div>
          <div className="auth-tool-strip"><span><FileText size={16}/>Create</span><span><ScanLine size={16}/>Tailor</span><span><BriefcaseBusiness size={16}/>Track</span></div>
        </div>
      </div>
      <p className="auth-story-footer">Your experience is the starting point. You decide what comes next.</p>
    </aside>
    <div className="auth-form-column">
      <Link href="/" className="auth-mobile-back"><ArrowLeft size={16}/> Back to ProfileAI</Link>
      {children}
      <p className="auth-form-footnote"><ShieldCheck size={14}/> Your workspace. Your control.</p>
    </div>
  </div>;
}
