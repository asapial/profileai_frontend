"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CareerSceneDeck.module.css";

type Connection = { from: string; to: string; tone?: string };
type Wire = { path: string; x: number; y: number; endX: number; endY: number; tone?: string };

/** Measure real card ports, so connectors stay attached across responsive layouts. */
export function StoryConnections({ connections, radial = false }: { connections: Connection[]; radial?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<{ width: number; height: number; wires: Wire[] }>({ width: 1, height: 1, wires: [] });
  useEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      // Layout offsets instead of client rects: the film rotates and translates every scene,
      // and transformed rects both skew the geometry and produce non-finite scale factors.
      const local = (element: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = element;
        while (node && node !== container) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return node === container ? { x, y, w: element.offsetWidth, h: element.offsetHeight } : null;
      };
      const wires: Wire[] = [];
      for (const connection of connections) {
        const from = container.querySelector<HTMLElement>(`[data-wire="${connection.from}"]`);
        const to = container.querySelector<HTMLElement>(`[data-wire="${connection.to}"]`);
        if (!from || !to) continue;
        const a = local(from);
        const b = local(to);
        if (!a || !b) continue;
        let x = a.x + a.w;
        let y = a.y + a.h / 2;
        let endX = b.x;
        let endY = b.y + b.h / 2;
        let path: string;
        if (radial) {
          x = a.x + a.w / 2;
          y = a.y + a.h / 2;
          endX = b.x + b.w / 2;
          endY = b.y + b.h / 2;
          path = `M${x} ${y} Q${(x + endX) / 2} ${endY + (y - endY) * .18} ${endX} ${endY}`;
        } else if (b.y >= a.y + a.h && b.x < a.x + a.w) {
          // Stacked mobile panels use a visible outer rail instead of disappearing.
          endX = b.x + b.w;
          const rail = container.clientWidth - 3;
          path = `M${x} ${y} C${rail} ${y} ${rail} ${y} ${rail} ${(y + endY) / 2} S${rail} ${endY} ${endX} ${endY}`;
        } else {
          const bend = Math.max(24, (endX - x) * .5);
          path = `M${x} ${y} C${x + bend} ${y} ${endX - bend} ${endY} ${endX} ${endY}`;
        }
        wires.push({ path, x, y, endX, endY, tone: connection.tone });
      }
      setLayout({ width: container.clientWidth, height: container.clientHeight, wires });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    container.querySelectorAll<HTMLElement>("[data-wire]").forEach((element) => observer.observe(element));
    document.fonts.ready.then(schedule);
    window.addEventListener("resize", schedule);
    measure();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); };
  }, [connections, radial]);
  return <svg ref={ref} className={styles.sceneWires} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
    {layout.wires.map((wire, index) => <g key={index} className={wire.tone ? styles[wire.tone] : undefined}>
      <path className={styles.wireTrack} d={wire.path} />
      <path className={styles.wirePacket} d={wire.path} pathLength="100" style={{ animationDelay: `${index * -.6}s` }} />
      {!radial && <><circle cx={wire.x} cy={wire.y} r="2.6" /><circle cx={wire.endX} cy={wire.endY} r="2.6" /></>}
    </g>)}
  </svg>;
}
