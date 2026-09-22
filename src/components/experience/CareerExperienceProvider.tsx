"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { CareerScene } from "./CareerScene";
import { useScrollStory } from "./useScrollStory";

const StoryContext = createContext<ReturnType<typeof useScrollStory> | null>(null);

export function CareerExperienceProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const story = useScrollStory(root);
  return <StoryContext.Provider value={story}><div ref={root} className="career-story-root">{children}<CareerScene /></div></StoryContext.Provider>;
}

export function useCareerStory() {
  const story = useContext(StoryContext);
  if (!story) throw new Error("Career Core requires CareerExperienceProvider");
  return story;
}
