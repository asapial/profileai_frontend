"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MascotMood } from "./AuthMascotContext";

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * Pupils follow the pointer. The offset is written as CSS variables so the
 * movement stays on the compositor and never re-renders React.
 */
function useGaze(ref: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const apply = () => {
      frame = 0;
      node.style.setProperty("--ax-look-x", nextX.toFixed(3));
      node.style.setProperty("--ax-look-y", nextY.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42;
      nextX = clamp((event.clientX - centerX) / (rect.width * 0.9));
      nextY = clamp((event.clientY - centerY) / (rect.height * 0.9));
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const reset = () => {
      nextX = 0;
      nextY = 0;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ref]);
}

type MascotProps = {
  mood: MascotMood;
  className?: string;
  /** Delay the idle blink so a group of mascots does not blink in sync. */
  blinkDelay?: number;
};

/** The studio companion. A small drafting robot with a pencil behind one ear. */
export function AuthMascot({ mood, className, blinkDelay = 0 }: MascotProps) {
  const ref = useRef<SVGSVGElement>(null);
  useGaze(ref);

  return (
    <svg
      ref={ref}
      viewBox="0 0 360 330"
      role="presentation"
      aria-hidden="true"
      data-mood={mood}
      className={cn("ax-mascot", className)}
      style={{ "--ax-blink-delay": `${blinkDelay}s` } as React.CSSProperties}
    >
      <ellipse className="ax-mascot-shadow" cx="180" cy="309" rx="86" ry="12" />

      <g className="ax-mascot-bob">
        {/* Body */}
        <path
          d="M126 250c0-18 14-31 32-31h44c18 0 32 13 32 31v23c0 13-11 24-24 24h-60c-13 0-24-11-24-24z"
          fill="var(--ax-shell)"
          stroke="var(--ax-ink)"
          strokeWidth="4"
        />
        <rect x="148" y="238" width="64" height="18" rx="9" fill="var(--ax-lilac)" stroke="var(--ax-ink)" strokeWidth="3.5" />
        <path d="M158 247h44" stroke="var(--ax-ink)" strokeWidth="2" strokeLinecap="round" opacity=".35" />

        {/* Badge */}
        <rect x="163" y="264" width="34" height="30" rx="8" fill="var(--ax-paper)" stroke="var(--ax-ink)" strokeWidth="3" />
        <path d="M174 284v-11h7a4 4 0 0 1 0 8h-7m7 0 4 3" fill="none" stroke="var(--ax-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Head assembly */}
        <g className="ax-mascot-head">
          {/* Antenna */}
          <path d="M180 72V48" stroke="var(--ax-ink)" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="180" cy="36" r="10" fill="var(--ax-coral)" stroke="var(--ax-ink)" strokeWidth="3.5" />
          <circle cx="177" cy="33" r="2.6" fill="var(--ax-paper)" opacity=".85" />

          {/* Ears */}
          <rect x="66" y="110" width="30" height="54" rx="15" fill="var(--ax-lilac)" stroke="var(--ax-ink)" strokeWidth="3.5" />
          <circle cx="81" cy="137" r="5.5" fill="var(--ax-ink)" opacity=".55" />
          <rect x="264" y="110" width="30" height="54" rx="15" fill="var(--ax-lilac)" stroke="var(--ax-ink)" strokeWidth="3.5" />
          <circle cx="279" cy="137" r="5.5" fill="var(--ax-ink)" opacity=".55" />

          {/* Pencil behind the right ear */}
          <g transform="rotate(24 292 104)">
            <rect x="288" y="58" width="9" height="54" rx="3" fill="var(--ax-coral)" stroke="var(--ax-ink)" strokeWidth="2.6" />
            <path d="M288 112h9l-4.5 10z" fill="var(--ax-paper)" stroke="var(--ax-ink)" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M288 66h9" stroke="var(--ax-ink)" strokeWidth="2.6" />
          </g>

          {/* Shell */}
          <rect x="82" y="66" width="196" height="158" rx="58" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="4.5" />
          <path d="M104 98c8-16 22-24 40-27" stroke="var(--ax-paper)" strokeWidth="6" strokeLinecap="round" opacity=".8" />

          {/* Face plate */}
          <rect x="103" y="92" width="154" height="112" rx="38" fill="var(--ax-face)" stroke="var(--ax-ink)" strokeWidth="3.2" />

          {/* Cheeks */}
          <ellipse cx="123" cy="166" rx="12" ry="6.5" fill="var(--ax-coral)" opacity=".32" />
          <ellipse cx="237" cy="166" rx="12" ry="6.5" fill="var(--ax-coral)" opacity=".32" />

          {/* Eyes */}
          <g>
            <circle cx="146" cy="139" r="22" fill="var(--ax-eye)" stroke="var(--ax-ink)" strokeWidth="3.6" />
            <circle className="ax-pupil" cx="146" cy="139" r="9.5" fill="var(--ax-ink)" />
            <circle className="ax-pupil" cx="149.5" cy="135" r="3" fill="var(--ax-paper)" opacity=".9" />
          </g>
          <g>
            <circle cx="214" cy="139" r="22" fill="var(--ax-eye)" stroke="var(--ax-ink)" strokeWidth="3.6" />
            <circle className="ax-pupil" cx="214" cy="139" r="9.5" fill="var(--ax-ink)" />
            <circle className="ax-pupil" cx="217.5" cy="135" r="3" fill="var(--ax-paper)" opacity=".9" />
          </g>

          {/* Lids for the idle blink */}
          <rect className="ax-lid ax-lid-left" x="124" y="117" width="44" height="44" rx="22" fill="var(--ax-face)" />
          <rect className="ax-lid ax-lid-right" x="192" y="117" width="44" height="44" rx="22" fill="var(--ax-face)" />

          {/* Brows appear only while peeking */}
          <g className="ax-brows">
            <path d="M132 108c8-5 20-5 28 0" fill="none" stroke="var(--ax-ink)" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M200 108c8-5 20-5 28 0" fill="none" stroke="var(--ax-ink)" strokeWidth="3.4" strokeLinecap="round" />
          </g>

          {/* Mouth */}
          {mood === "cover" ? (
            <path d="M168 180c5-3 9-3 12 0s7 3 12 0" fill="none" stroke="var(--ax-ink)" strokeWidth="3.4" strokeLinecap="round" />
          ) : mood === "peek" ? (
            <ellipse cx="180" cy="181" rx="6.5" ry="7.5" fill="var(--ax-ink)" opacity=".82" />
          ) : (
            <path d="M168 178c7 6 17 6 24 0" fill="none" stroke="var(--ax-ink)" strokeWidth="3.4" strokeLinecap="round" />
          )}
        </g>

        {/* Hands. Positioned over the eyes at rest, translated away when idle. */}
        <g className="ax-hand ax-hand-left">
          <circle cx="146" cy="139" r="26" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="4" />
          <path d="M133 128v22M146 124v30M159 128v22" stroke="var(--ax-ink)" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
          <rect x="132" y="158" width="28" height="10" rx="5" fill="var(--ax-coral)" stroke="var(--ax-ink)" strokeWidth="2.6" />
        </g>
        <g className="ax-hand ax-hand-right">
          <circle cx="214" cy="139" r="26" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="4" />
          <path d="M201 128v22M214 124v30M227 128v22" stroke="var(--ax-ink)" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
          <rect x="200" y="158" width="28" height="10" rx="5" fill="var(--ax-coral)" stroke="var(--ax-ink)" strokeWidth="2.6" />
        </g>
      </g>
    </svg>
  );
}

/** Two smaller companions so the whole desk reacts together. */
export function AuthMascotMini({ mood, className, blinkDelay = 0 }: MascotProps) {
  const ref = useRef<SVGSVGElement>(null);
  useGaze(ref);

  return (
    <svg
      ref={ref}
      viewBox="0 0 150 130"
      role="presentation"
      aria-hidden="true"
      data-mood={mood}
      className={cn("ax-mascot ax-mascot-mini", className)}
      style={{ "--ax-blink-delay": `${blinkDelay}s` } as React.CSSProperties}
    >
      <g className="ax-mascot-bob">
        <path d="M45 96c0-9 7-15 16-15h28c9 0 16 6 16 15v9c0 8-6 14-14 14H59c-8 0-14-6-14-14z" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="3.5" />
        <path d="M75 38V26" stroke="var(--ax-ink)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="75" cy="21" r="6" fill="var(--ax-coral)" stroke="var(--ax-ink)" strokeWidth="3" />

        <g className="ax-mascot-head">
          <rect x="32" y="34" width="86" height="70" rx="27" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="4" />
          <rect x="43" y="45" width="64" height="48" rx="19" fill="var(--ax-face)" stroke="var(--ax-ink)" strokeWidth="2.8" />
          <circle cx="61" cy="68" r="10.5" fill="var(--ax-eye)" stroke="var(--ax-ink)" strokeWidth="3" />
          <circle className="ax-pupil" cx="61" cy="68" r="4.6" fill="var(--ax-ink)" />
          <circle cx="89" cy="68" r="10.5" fill="var(--ax-eye)" stroke="var(--ax-ink)" strokeWidth="3" />
          <circle className="ax-pupil" cx="89" cy="68" r="4.6" fill="var(--ax-ink)" />
          <rect className="ax-lid ax-lid-left" x="50" y="57" width="22" height="22" rx="11" fill="var(--ax-face)" />
          <rect className="ax-lid ax-lid-right" x="78" y="57" width="22" height="22" rx="11" fill="var(--ax-face)" />
          <path d="M69 82c4 3 8 3 12 0" fill="none" stroke="var(--ax-ink)" strokeWidth="2.6" strokeLinecap="round" />
        </g>

        <g className="ax-hand ax-hand-left">
          <circle cx="61" cy="68" r="12.5" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="3" />
        </g>
        <g className="ax-hand ax-hand-right">
          <circle cx="89" cy="68" r="12.5" fill="var(--ax-shell)" stroke="var(--ax-ink)" strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}
