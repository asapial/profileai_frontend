"use client";

import { useEffect, type RefObject } from "react";
import { CAREER_MOTION } from "@/lib/career-story";

/** Writes transform variables, never React state, and leaves touch/focus alone. */
export function usePointerParallax(root: RefObject<HTMLElement | null>, magnetic = false) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const reset = () => {
      element.style.setProperty("--pointer-x", "0deg");
      element.style.setProperty("--pointer-y", "0deg");
      element.style.setProperty("--magnet-x", "0px");
      element.style.setProperty("--magnet-y", "0px");
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== "mouse") return;
      const rect = element.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      if (magnetic) {
        element.style.setProperty("--magnet-x", `${x * 3}px`);
        element.style.setProperty("--magnet-y", `${y * 2}px`);
      } else {
        element.style.setProperty("--pointer-x", `${-y * CAREER_MOTION.pointerDegrees.x}deg`);
        element.style.setProperty("--pointer-y", `${x * CAREER_MOTION.pointerDegrees.y}deg`);
      }
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    element.addEventListener("blur", reset);
    media.addEventListener("change", reset);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("blur", reset);
      media.removeEventListener("change", reset);
      reset();
    };
  }, [root, magnetic]);
}
