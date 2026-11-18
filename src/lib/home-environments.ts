import type { CSSProperties } from "react";

export type HomeEnvironment = "trust" | "workspace" | "graph" | "showcase" | "story" | "templates" | "pricing" | "faq" | "closing" | "footer";

/** The same physical room, independently lit and framed for each theme/device. */
export function homeEnvironmentStyle(kind: HomeEnvironment): CSSProperties {
  const root = `/art/environments-v2/${kind}`;
  return {
    "--room-light": `url("${root}-light.webp")`,
    "--room-dark": `url("${root}-dark.webp")`,
    "--room-light-mobile": `url("${root}-light-mobile.webp")`,
    "--room-dark-mobile": `url("${root}-dark-mobile.webp")`,
  } as CSSProperties;
}
