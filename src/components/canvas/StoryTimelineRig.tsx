"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStoryStore } from "@/store/useStoryStore";

export function StoryTimelineRig() {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const store = useStoryStore.getState;
    const story = document.querySelector<HTMLElement>("#scrollytelling-container");
    const staticZone = document.querySelector<HTMLElement>("#static-zone");
    if (!story) return;

    let lastStage = -1;
    const storyTrigger = ScrollTrigger.create({
      trigger: story,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = Math.min(1, Math.max(0, self.progress));
        const nextStage = Math.min(7, Math.floor(progress * 8));
        store().setScrollProgress(progress);
        if (nextStage !== lastStage) {
          lastStage = nextStage;
          store().setActiveStage(nextStage);
        }
      },
    });

    const dockTrigger = staticZone
      ? ScrollTrigger.create({
          trigger: staticZone,
          start: "top 82%",
          end: "bottom top",
          onEnter: () => store().setDocked(true),
          onLeaveBack: () => store().setDocked(false),
        })
      : null;

    ScrollTrigger.refresh();
    return () => {
      storyTrigger.kill();
      dockTrigger?.kill();
    };
  }, []);

  return null;
}
