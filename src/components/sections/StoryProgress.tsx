"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENE_COUNT, progressForUnit } from "@/lib/career-cinema";
import { STORY_COPY } from "@/lib/story-i18n";
import { useStoryStore } from "@/store/useStoryStore";

/** Fixed progress dots. The indicator never morphs into a reading rail. */
type Tick = { id: string; atPx: number; label: string; target?: Element };

export function StoryProgress() {
  const locale = useStoryStore((state) => state.locale);
  const copy = STORY_COPY[locale];
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [active, setActive] = useState(-1);
  const ticksRef = useRef<Tick[]>([]);

  useEffect(() => {
    let viewport = window.innerHeight;
    /** Scene rests sit at progressForUnit(N) · travel, matching the film's drive. */
    const measure = () => {
      viewport = window.innerHeight;
      const film = document.querySelector<HTMLElement>('[class*="__film"]');
      const travel = film ? Math.max(0, film.offsetHeight - viewport) : 0;
      const next: Tick[] = [];
      for (let index = 0; index < SCENE_COUNT; index += 1) {
        const atPx = progressForUnit(index) * travel;
        next.push({
          id: `scene-${index}`,
          atPx,
          label: copy.rail.chapter(index + 1, copy.chapters[index]?.title ?? ""),
        });
      }
      const staticZone = document.querySelector("#static-zone");
      const zones = staticZone
        ? Array.from(staticZone.children).filter(
            (node) => !(node instanceof HTMLElement && node.className.includes("static-zone__")),
          )
        : [];
      for (const [index, zone] of zones.entries()) {
        const label = zone.querySelector("h2")?.textContent?.trim() ?? zone.getAttribute("aria-label") ?? "";
        if (!label) continue;
        next.push({
          id: `zone-${index}`,
          atPx: zone.getBoundingClientRect().top + window.scrollY - viewport * 0.38,
          label,
          target: zone,
        });
      }
      next.sort((a, b) => a.atPx - b.atPx);
      setTicks(next);
      ticksRef.current = next;
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const scrollY = window.scrollY;
        let next = 0;
        const list = ticksRef.current;
        for (let index = 0; index < list.length; index += 1) if (scrollY >= list[index]!.atPx) next = index;
        setActive((current) => (current === next ? current : next));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [copy]);

  const jump = useCallback((tick: Tick) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (tick.target) tick.target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    else window.scrollTo({ top: tick.atPx, behavior: reduced ? "auto" : "smooth" });
  }, []);

  // Empty until the first measure lands: renders nothing on the server and
  // hydrates into the spine (decorative, so no SSR markup is required).
  if (ticks.length === 0) return null;

  return (
    <div className="story-spine" role="navigation" aria-label={copy.spine.label}>
      {ticks.map((tick, index) => (
        <button
          key={tick.id}
          type="button"
          className={`story-spine__tick ${active === index ? "is-active" : ""}`}
          style={{ top: `${((index / Math.max(1, ticks.length - 1)) * 100).toFixed(2)}%` }}
          aria-label={tick.label}
          aria-current={active === index ? "true" : undefined}
          onClick={() => jump(tick)}
        />
      ))}
    </div>
  );
}
