"use client";

import { useRef, useCallback, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface AuthCardProps {
  children: React.ReactNode;
  /** Extra classes on the outer wrapper */
  className?: string;
}

/**
 * Shared card wrapper used by all auth pages.
 * Provides:
 *  - Entry animation (fade + slide)
 *  - Pointer-following light without shifting interactive controls
 *  - Brand mark at top
 */
export function AuthCard({ children, className }: AuthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: PointerEvent) => {
    const card = cardRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    });
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.addEventListener("pointermove", handleMouseMove);
    return () => { el.removeEventListener("pointermove", handleMouseMove); cancelAnimationFrame(frameRef.current); };
  }, [handleMouseMove]);

  return (
    <div
      ref={cardRef}
      className={`auth-surface animate-auth-card-enter ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="auth-form-panel relative rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur-md min-[360px]:p-6 sm:p-9"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--card) 92%, #7c3aed 8%) 0%, var(--card) 100%)",
        }}
      >
        {/* Subtle top-edge glow line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

/** Reusable brand mark — ProFile AI logo + name */
export function AuthBrandMark() {
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        ProFile <span className="text-gradient">AI</span>
      </span>
    </div>
  );
}
