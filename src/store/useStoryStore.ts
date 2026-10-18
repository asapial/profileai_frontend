import { create } from "zustand";

import type { StoryLocale } from "@/lib/story-i18n";

export type ShowcaseTab = "resume" | "alignment" | "tracker";
export type TemplateKey = "editorial" | "technical" | "minimal" | "grid";
export type StoryTheme = "light" | "dark";

type StoryState = {
  scrollProgress: number;
  activeStage: number;
  activeShowcaseTab: ShowcaseTab;
  activeTemplate: TemplateKey;
  theme: StoryTheme;
  motionEnabled: boolean;
  docked: boolean;
  locale: StoryLocale;
  setScrollProgress: (scrollProgress: number) => void;
  setActiveStage: (activeStage: number) => void;
  setActiveShowcaseTab: (activeShowcaseTab: ShowcaseTab) => void;
  setActiveTemplate: (activeTemplate: TemplateKey) => void;
  setTheme: (theme: StoryTheme) => void;
  setMotionEnabled: (motionEnabled: boolean) => void;
  setDocked: (docked: boolean) => void;
  setLocale: (locale: StoryLocale) => void;
};

export const useStoryStore = create<StoryState>((set) => ({
  scrollProgress: 0,
  activeStage: 0,
  activeShowcaseTab: "resume",
  activeTemplate: "editorial",
  theme: "light",
  motionEnabled: true,
  docked: false,
  locale: "en",
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setActiveStage: (activeStage) => set({ activeStage }),
  setActiveShowcaseTab: (activeShowcaseTab) => set({ activeShowcaseTab }),
  setActiveTemplate: (activeTemplate) => set({ activeTemplate }),
  setTheme: (theme) => set({ theme }),
  setMotionEnabled: (motionEnabled) => set({ motionEnabled }),
  setDocked: (docked) => set({ docked }),
  setLocale: (locale) => set({ locale }),
}));
