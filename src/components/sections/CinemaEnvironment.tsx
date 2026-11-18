"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { clamp01, smoothstep } from "@/lib/career-cinema";
import { homeEnvironmentStyle, type HomeEnvironment } from "@/lib/home-environments";
import { environmentPlateClass } from "./SectionEnvironment";
import styles from "./CinemaEnvironment.module.css";

export type CinemaEnvironmentHandle = { update: (unit: number) => void };
const rooms: HomeEnvironment[] = ["workspace", "workspace", "graph", "showcase", "trust"];

/** Background fades use the film's existing scroll clock, including reverse travel. */
export const CinemaEnvironment = forwardRef<CinemaEnvironmentHandle>(function CinemaEnvironment(_, ref) {
  const host = useRef<HTMLDivElement>(null);
  const previous = useRef(Number.NaN);
  useImperativeHandle(ref, () => ({
    update(unit) {
      if (!host.current) return;
      if (Math.abs(previous.current - unit) < .0001) return;
      previous.current = unit;
      const current = Math.min(4, Math.max(0, Math.floor(unit)));
      const blend = smoothstep(clamp01((unit - current - .38) / .6));
      const retire = 1 - smoothstep(clamp01((unit - 4.35) / .58));
      Array.from(host.current.children).forEach((node, index) => {
        const opacity = (index === current ? 1 : index === current + 1 ? blend : 0) * retire;
        (node as HTMLElement).style.opacity = opacity.toFixed(5);
      });
      host.current.dataset.unit = unit.toFixed(4);
    },
  }), []);
  return <div ref={host} className={styles.environment} data-cinema-environment aria-hidden="true">
    {rooms.map((kind, index) => <div key={index} className={`${environmentPlateClass} ${styles.room}`} data-cinema-room={index} style={{ ...homeEnvironmentStyle(kind), opacity: index === 0 ? 1 : 0 }}/>) }
  </div>;
});
