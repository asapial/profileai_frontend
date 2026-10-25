"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  ScanLine,
  BriefcaseBusiness,
  ShieldCheck,
} from "lucide-react";
import { AuthMascot, AuthMascotMini } from "./AuthMascot";
import { AuthMascotProvider, useAuthMascot } from "./AuthMascotContext";

type Story = {
  stamp: string;
  title: string;
  accent: string;
  description: string;
  points: { title: string; copy: string }[];
  speech: { idle: string; peek: string; cover: string };
  foot: string;
};

const stories: Record<string, Story> = {
  "/register": {
    stamp: "AI-powered career studio",
    title: "Your next chapter.",
    accent: "Beautifully yours.",
    description:
      "Turn your experience, ideas, and ambition into a story that opens doors. ProfileAI helps you build what comes next.",
    points: [
      { title: "AI-powered writing", copy: "Turn real experience into clearer, more impactful content." },
      { title: "Thoughtful templates", copy: "Build a resume with a professional, readable layout." },
      { title: "Built for what's next", copy: "Prepare, tailor, and organize your next opportunity." },
    ],
    speech: {
      idle: "Fresh sheet, sharp pencil. Let's build your story.",
      peek: "New password? I'll pretend not to look.",
      cover: "Hands over eyes. Your password stays yours.",
    },
    foot: "Your experience is the starting point. You decide what comes next.",
  },
  "/forgot-password": {
    stamp: "Account recovery",
    title: "A fresh start.",
    accent: "Same possibilities.",
    description:
      "A moment to reconnect, then back to building what comes next. We'll guide you through every step.",
    points: [
      { title: "Check your inbox", copy: "We send a one-time code to the email on file." },
      { title: "Confirm it's you", copy: "The code expires quickly, so your account stays safe." },
      { title: "Pick a new password", copy: "Then return to your drafts exactly where you left them." },
    ],
    speech: {
      idle: "Lost the key? We'll cut a new one.",
      peek: "I'll look away while you type.",
      cover: "Eyes shut. Nothing here leaves the room.",
    },
    foot: "One step back, then straight into your next chapter.",
  },
  "/forget-password": {
    stamp: "Account recovery",
    title: "A fresh start.",
    accent: "Same possibilities.",
    description:
      "A moment to reconnect, then back to building what comes next. We'll guide you through every step.",
    points: [
      { title: "Check your inbox", copy: "We send a one-time code to the email on file." },
      { title: "Confirm it's you", copy: "The code expires quickly, so your account stays safe." },
      { title: "Pick a new password", copy: "Then return to your drafts exactly where you left them." },
    ],
    speech: {
      idle: "Lost the key? We'll cut a new one.",
      peek: "I'll look away while you type.",
      cover: "Eyes shut. Nothing here leaves the room.",
    },
    foot: "One step back, then straight into your next chapter.",
  },
  "/reset-password": {
    stamp: "A fresh layer of protection",
    title: "New password.",
    accent: "New peace of mind.",
    description:
      "Keep your work close and your account protected. Your next opportunity is still waiting.",
    points: [
      { title: "Eight characters minimum", copy: "Mix letters, numbers, and a symbol." },
      { title: "Nothing reused", copy: "A password you haven't used elsewhere." },
      { title: "Locked after saving", copy: "We never show or store it in the clear." },
    ],
    speech: {
      idle: "Make it strong. I'll guard the drawer.",
      peek: "I'm squinting, but only at the meter.",
      cover: "Both hands up. Promise.",
    },
    foot: "A quiet desk, a clean slate, and a safer account.",
  },
  "/verify-email": {
    stamp: "One small step to get started",
    title: "Make it official.",
    accent: "Make it yours.",
    description:
      "Verify your email to unlock your personal career workspace. Your story starts here.",
    points: [
      { title: "Open the message", copy: "The code lands in your inbox in seconds." },
      { title: "Enter six digits", copy: "No links to chase, no forms to refill." },
      { title: "Start building", copy: "Your studio opens the moment you confirm." },
    ],
    speech: {
      idle: "The code is in your inbox. I'll wait.",
      peek: "Just checking the digits, not the password.",
      cover: "Eyes covered. Type freely.",
    },
    foot: "Your story starts here.",
  },
};

const defaultStory: Story = {
  stamp: "Your personal career studio",
  title: "Good to see you.",
  accent: "Great things ahead.",
  description:
    "Your experience is worth more than a document. Shape your story, discover your strengths, and make your next move.",
  points: [
    { title: "Your drafts are waiting", copy: "Pick up the sentence you left unfinished." },
    { title: "Sharper every pass", copy: "Tune wording, score it, and tailor it to the role." },
    { title: "One workspace", copy: "Create, tailor, and track without losing the thread." },
  ],
  speech: {
    idle: "Welcome back. I kept your drafts warm.",
    peek: "Just checking it's really you.",
    cover: "Eyes shut. Your password stays yours.",
  },
  foot: "Your experience is the starting point. You decide what comes next.",
};

const twoFactorStory: Story = {
  stamp: "Account security",
  title: "One quick check.",
  accent: "Then you're in.",
  description: "Confirm it's you to continue to your career workspace.",
  points: [
    { title: "Six digits", copy: "Sent to the email address on your account." },
    { title: "Time-limited", copy: "Codes expire quickly, by design." },
    { title: "Back to work", copy: "Your workspace is exactly as you left it." },
  ],
  speech: {
    idle: "Six digits and you're through.",
    peek: "I'm watching the door, not the code.",
    cover: "Eyes covered. Type freely.",
  },
  foot: "A small pause, then straight back to your work.",
};

function StudioSpeech({ story }: { story: Story }) {
  const { mood } = useAuthMascot();
  return (
    <div className="ax-speech" aria-hidden="true">
      <span key={mood}>
        <b>{mood === "cover" ? "Not looking" : mood === "peek" ? "Squinting" : "Standing by"}</b>
        {story.speech[mood]}
      </span>
    </div>
  );
}

function StudioScene({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/login";
  const story = pathname.startsWith("/login/2fa")
    ? twoFactorStory
    : stories[pathname] ?? defaultStory;
  const { mood } = useAuthMascot();

  return (
    <div
      className="ax-shell"
      data-auth-route={pathname.startsWith("/register") ? "register" : pathname.startsWith("/login") ? "login" : "support"}
    >
      <aside className="ax-story">
        <div className="ax-story-bg" aria-hidden />

        <div className="ax-story-top">
          <Link href="/" className="ax-back">
            <ArrowLeft size={15} /> Back to ProfileAI
          </Link>
          <span className="ax-stamp">
            <i /> {story.stamp}
          </span>
        </div>

        <div className="ax-story-body">
          <h2 className="ax-story-title">
            {story.title}
            <em>{story.accent}</em>
          </h2>
          <p className="ax-story-description">{story.description}</p>
          <ul className="ax-story-points">
            {story.points.map((point) => (
              <li key={point.title}>
                <Check size={15} aria-hidden />
                <span>
                  <strong>{point.title}</strong>
                  {point.copy}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ax-story-desk">
          <div className="ax-doc" aria-hidden="true">
            <div className="ax-doc-top">
              <span>Career file</span>
              <i />
            </div>
            <p className="ax-doc-title">
              {pathname.startsWith("/register") ? "From experience." : "Experience."}
              <em>
                {pathname.startsWith("/register") ? "To opportunity." : "With intention."}
              </em>
            </p>
            <div className="ax-doc-lines">
              <span />
              <span />
              <span />
            </div>
            <div className="ax-doc-chips">
              <span>Create</span>
              <span>Tailor</span>
              <span>Track</span>
            </div>
          </div>
          <div className="ax-minis" aria-hidden="true">
            <AuthMascotMini mood={mood} blinkDelay={1.4} />
            <AuthMascotMini mood={mood} blinkDelay={3.1} />
          </div>
          <div className="ax-companion-wrap">
            <StudioSpeech story={story} />
            <AuthMascot mood={mood} className="ax-companion" blinkDelay={0.6} />
          </div>
        </div>

        <p className="ax-story-foot">{story.foot}</p>
      </aside>

      <div className="ax-form-side">
        <AuthMascot mood={mood} className="ax-mobile-companion" blinkDelay={0.9} />
        {children}
      </div>
    </div>
  );
}

export function AuthScene({ children }: { children: React.ReactNode }) {
  return (
    <AuthMascotProvider>
      <StudioScene>{children}</StudioScene>
    </AuthMascotProvider>
  );
}

/** Shared wordmark used at the top of every auth form. */
export function AuthStudioBrand({ note }: { note?: string }) {
  return (
    <div className="ax-brand-row">
      <Link href="/" className="ax-brand">
        <Image src="/brand/profileai-mark.svg" alt="" width={30} height={30} priority />
        ProfileAI
      </Link>
      <span className="ax-brand-note">{note ?? "Career studio"}</span>
    </div>
  );
}

/** Small piece of chrome shared by the auth forms. */
export function AuthAssurance({ label = "Your workspace. Your control." }: { label?: string }) {
  return (
    <p className="ax-assurance">
      <ShieldCheck size={13} aria-hidden /> {label}
    </p>
  );
}

/** Optional footer for the auth pages. */
export function AuthStudioFooter() {
  return (
    <div className="ax-footer">
      <span>© {new Date().getFullYear()} ProfileAI</span>
      <nav aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </div>
  );
}

export const authStudioIcons = {
  FileText,
  ScanLine,
  BriefcaseBusiness,
  ArrowUpRight,
};
