"use client";
import { useEffect } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { sceneNodes, type SceneFrame } from "@/lib/career-scene";

/** Continue from the displayed pose when direction or chapter changes. */
export function useSmoothedScene(target: MotionValue<SceneFrame>, paused: MotionValue<boolean>) {
  const displayed = useMotionValue(target.get());
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
    const draw = (time: number) => {
      raf = 0;
      const goal = target.get();
      if (paused.get() && !reduced.matches && !goal.manual) {
        const current = displayed.get();
        displayed.set({...goal, local:current.local, pose:sceneNodes(current)}); last = 0; return;
      }
      if (reduced.matches || paused.get() || document.hidden) {
        displayed.set(goal); last = 0; return;
      }
      const current = displayed.get();
      const before = sceneNodes(current), after = sceneNodes(goal);
      const amount = 1 - Math.exp(-Math.min(last ? time-last : 16, 48)/95);
      last = time;
      let distance = 0;
      const pose = after.map((node, i) => {
        const result = { ...node };
        for (const key of ["x", "y", "z", "w", "h", "opacity"] as const) {
          const delta = node[key] - before[i][key];
          distance = Math.max(distance, Math.abs(delta));
          result[key] = before[i][key] + delta * amount;
        }
        return result;
      });
      if (distance < .025) { displayed.set(goal); last = 0; return; }
      displayed.set({ ...goal, local: current.local + (goal.local-current.local)*amount, pose });
      raf = requestAnimationFrame(draw);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const visibility = () => { stop(); if (!document.hidden) wake(); };
    const off = [target.on("change", wake), paused.on("change", wake)];
    reduced.addEventListener("change", wake);
    document.addEventListener("visibilitychange", visibility);
    wake();
    return () => { stop(); off.forEach(fn=>fn()); reduced.removeEventListener("change",wake); document.removeEventListener("visibilitychange",visibility); };
  }, [target, displayed, paused]);
  return displayed;
}
