import type { CSSProperties } from "react";

const tones: Record<string, [string, string, string, string]> = {
  login: ["#eee8f4", "#151525", "#e8e2f1", "#29253a"],
  register: ["#eee8f1", "#221d2e", "#dcd5e5", "#453e5c"],
  reset: ["#eee8f1", "#221d2e", "#dcd5e5", "#453e5c"],
  forgot: ["#f0ebf5", "#1a1c2b", "#ece7f4", "#353347"],
  verify: ["#ede9f2", "#151923", "#e2deed", "#29353d"],
  contact: ["#e9eff0", "#14232a", "#acc2ca", "#294550"],
  "billing-help": ["#e9eaf0", "#201b29", "#b9c2cf", "#453650"],
};

/** Room edge samples supply the wall colour; the surrounding surface stays readable. */
export function publicToneStyle(page: string): CSSProperties {
  const [light, dark, lightEdge, darkEdge] = tones[page] ?? ["#f2eef5", "#191521", "#ded3e8", "#33283e"];
  return { "--canvas-light": light, "--canvas-dark": dark, "--scene-light": lightEdge, "--scene-dark": darkEdge } as CSSProperties;
}
