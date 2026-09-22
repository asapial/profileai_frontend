/** Pure, measured scroll mapping shared by the DOM and the Career Core. */
export type StoryAnchor = { id: string; top: number; height: number };
export const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

export function sampleStory(anchors: StoryAnchor[], scroll: number, viewport: number) {
  if (!anchors.length) return { progress: 0, hero: 0 };
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  const travel = Math.max(1, last.top + last.height - viewport - first.top);
  const hero = anchors.find(anchor => anchor.id === "hero");
  return {
    progress: clampProgress((scroll - first.top) / travel),
    hero: hero ? clampProgress((scroll - hero.top) / Math.max(1, hero.height - viewport)) : 0,
  };
}

export const CAREER_MOTION = {
  desktopQuery: "(min-width: 1000px) and (prefers-reduced-motion: no-preference)",
  dpr: 1.5,
  pointerDegrees: { x: 2, y: 3 },
} as const;
