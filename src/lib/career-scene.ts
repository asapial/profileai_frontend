export type ScenePhase = "hero" | "match" | "workflow" | "workspace" | "evidence" | "readiness" | "email" | "interview" | "followup" | "privacy" | "features" | "finalCta";
export type SceneNode = { x: number; y: number; z: number; w: number; h: number; opacity: number; label: string; title: string; detail: string };
export type SceneFrame = { phase: ScenePhase; local: number; previous: ScenePhase; pose?: SceneNode[]; manual?: boolean };
export const SCENE_META: Record<ScenePhase, { title: string; description: string }> = {
  hero: { title: "Your experience, connected", description: "Six layers. One story. Scroll to unfold, or use the preview button." },
  match: { title: "Evidence meets the role", description: "Connections show supporting evidence, never hiring probability." },
  workflow: { title: "From possibility to application", description: "Discover → Align → Tailor → Apply → Track. Review before sending." },
  workspace: { title: "Everything finds its place", description: "Role, resume, status, notes, follow-up and interview — together." },
  evidence: { title: "Follow the source", description: "Project → contribution → skill → evidence → resume claim." },
  readiness: { title: "Make the real work shine", description: "A stronger statement, supported by your project. No invented metrics." },
  email: { title: "Evidence becomes a draft", description: "Confirmed experience feeds into your words. Editable, never auto-sent." },
  interview: { title: "Four parts. One clear story.", description: "Situation, Task, Action and Result come together around your real work." },
  followup: { title: "Keep the next step in sight", description: "A quiet timeline for notes, preparation and reviewed follow-ups." },
  privacy: { title: "Your story stays yours", description: "Contained sources. Traceable claims. Your confirmation." },
  features: { title: "One connected toolkit", description: "Resume Studio, Role Insights and Application Tracker." },
  finalCta: { title: "One ProfileAI Career Core", description: "Your evidence, documents and next steps — brought together." },
};
export const isScenePhase = (id: string): id is ScenePhase => Object.hasOwn(SCENE_META, id);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const words: Record<ScenePhase, string[][]> = {
  hero: [["PROFILE", "Alex Morgan", "Frontend Engineer"], ["EXPERIENCE", "Customer dashboard", "Frontend development"], ["SKILLS", "React", "Used in the dashboard"], ["PROJECTS", "Shared components", "Reusable interface patterns"], ["ACHIEVEMENTS", "Library documentation", "No invented metrics"], ["EVIDENCE", "Project notes", "Source: your own account"]],
  match: [["YOUR EVIDENCE", "React project", "Customer dashboard"], ["REQUIREMENT", "React", "Strong evidence"], ["YOUR EVIDENCE", "Shared components", "Design system project"], ["REQUIREMENT", "Design systems", "Strong evidence"], ["NEEDS CONTEXT", "Mentoring", "Add a specific example"], ["NOT YET EVIDENCED", "Accessibility testing", "No evidence added yet"]],
  workflow: [["01 / DISCOVER", "Frontend Engineer", "Review the role"], ["02 / ALIGN", "Connect evidence", "Check missing context"], ["03 / TAILOR", "Resume draft", "Your words, your review"], ["04 / APPLY", "Application ready", "Confirm before sending"], ["05 / TRACK", "Next action", "Keep progress in sight"], ["APPLICATION", "One thoughtful draft", "Based on real work"]],
  workspace: [["ROLE", "Frontend Engineer", "Example Studio"], ["RESUME", "Tailored draft", "Review your experience"], ["STATUS", "Preparing", "Application workspace"], ["NOTES", "Project context", "Keep the details"], ["FOLLOW-UP", "Review draft", "Never auto-sent"], ["INTERVIEW", "Prepare a story", "Use confirmed evidence"]],
  evidence: [["PROJECT", "Customer dashboard", "Source: project notes"], ["CONTRIBUTION", "Shared components", "What you actually did"], ["SKILL", "React", "Supported by the project"], ["EVIDENCE", "Your project notes", "Traceable source"], ["RESUME CLAIM", "Reusable components", "Review before accepting"], ["PROVENANCE", "User confirmed", "No invented outcomes"]],
  readiness: [["BEFORE", "Frontend tasks", "Vague description"], ["SOURCE", "Customer dashboard", "Your confirmed project"], ["CONTRIBUTION", "Reusable components", "Specific work"], ["AFTER", "Built React components", "For the customer dashboard"], ["REVIEW", "Your confirmation", "Accept or edit the change"], ["EVIDENCE", "Project notes", "No invented metrics"]],
  email: [["CONFIRMED", "React components", "From your project"], ["CONTEXT", "Customer dashboard", "Relevant experience"], ["DRAFT", "Hello hiring team,", "Frontend Engineer application"], ["YOUR WORDS", "I built reusable", "React components…"], ["EDITABLE", "Make it warmer", "Keep your own voice"], ["YOUR CONTROL", "Review before sending", "Draft only · never auto-sent"]],
  interview: [["SITUATION", "Customer dashboard", "Repeated interface patterns"], ["TASK", "Make it reusable", "Your responsibility"], ["ACTION", "Built shared components", "Documented the library"], ["RESULT", "One component library", "Confirm any measured outcome"], ["YOUR STORY", "Grounded in real work", "One coherent account"], ["SOURCE", "Project evidence", "Nothing made up"]],
  followup: [["MON / 14", "Review the role", "Confirm the requirements"], ["TUE / 15", "Tailor your draft", "Use project evidence"], ["WED / 16", "Follow up", "Review your message"], ["THU / 17", "Prepare your story", "One clear contribution"], ["FRI / 18", "Review next steps", "Keep your notes together"], ["CALENDAR", "Your confirmation", "Illustrative week"]],
  privacy: [["SOURCES", "Private by default", "Your own workspace"], ["EVIDENCE", "Traceable claims", "Follow every source"], ["DRAFTS", "Always editable", "Keep your own words"], ["CONFIRMATION", "You have the final say", "Review every action"], ["EXPORT", "Take your work", "Your workspace data"], ["CONTROL", "Your connections", "Disconnect when you choose"]],
  features: [["RESUME STUDIO", "Your experience", "Write, tailor and export"], ["ROLE INSIGHTS", "Your next role", "Review evidence coverage"], ["APPLICATION TRACKER", "Your next action", "Keep the whole picture"], ["SOURCE", "Confirmed evidence", "Connected to your drafts"], ["DOCUMENT", "Your resume", "Your words, your design"], ["WORKSPACE", "One place", "For every possibility"]],
  finalCta: [["PROFILEAI", "Your Career Core", "One connected workspace"], ["EXPERIENCE", "The work you did", "Your story is the starting point"], ["EVIDENCE", "Claims with a source", "Grounded in real projects"], ["DOCUMENTS", "Thoughtful applications", "Ready for your review"], ["TIMELINE", "A clear next step", "Keep your momentum"], ["YOUR NEXT CHAPTER", "Make it yours.", "Ready when you are"]],
};

function layout(phase: ScenePhase, p: number): SceneNode[] {
  return words[phase].map(([label, title, detail], i) => {
    let x = 24 + (i % 2) * 248, y = 40 + Math.floor(i / 2) * 119, w = 224, h = 82, z = i % 2 * 8, opacity = 1;
    if (phase === "hero" || phase === "finalCta") {
      const expand = phase === "hero" ? p : 1 - p;
      x = mix(118, x, expand); y = mix(24 + i * 62, y, expand);
      w = mix(284, w, expand); h = mix(51, h, expand); z = mix(i * 2, z, expand);
    } else if (phase === "workspace" || phase === "privacy") {
      x += (1 - p) * (i % 2 ? 22 : -18); y += (1 - p) * (i % 3 - 1) * 20; z = (1 - p) * i * 9;
    } else if (phase === "workflow") {
      x = 24 + (i % 2) * 248; y = 32 + Math.floor(i / 2) * 122 + (i % 2) * 14 * (1 - p); z = i * 4 * (1 - p);
    } else if (phase === "evidence") {
      z = i === 3 ? 22 * p : -8; w += i === 3 ? p * 12 : 0;
    } else if (phase === "readiness") {
      opacity = i === 0 ? 1 - p * .55 : 1; z = i === 3 ? p * 25 : 0;
    } else if (phase === "email") {
      if (i < 2) { x = mix(x, 118, p); y = mix(y, 45 + i * 55, p); opacity = 1 - p * .6; }
      if (i >= 2) { x = mix(x, 96, p); y = mix(y, 156 + (i - 2) * 57, p); w = mix(w, 328, p); h = mix(h, 51, p); }
    } else if (phase === "interview") {
      if (i < 4) { x = mix(x, 115, p); y = mix(y, 35 + i * 72, p); w = mix(w, 290, p); h = mix(h, 64, p); }
      else { y = 342; opacity = i === 5 ? 1 - p : 1; }
    } else if (phase === "followup") {
      if (i < 5) { x = 20 + i * 16; y = 25 + i * 69; w = 350; h = 58; z = i === 2 ? 18 : 0; x -= p * 12; }
      else { x = 380; y = 125; w = 115; h = 115; }
    } else if (phase === "features") {
      if (i < 3) { x = 40 + i * 17; y = 36 + i * 110; w = 370; h = 90; z = i * 9; }
      else opacity = 0;
    }
    return { x, y, z, w, h, opacity, label, title, detail };
  });
}

/** Six identities persist; only their pose and supported product labels evolve. */
export function sceneNodes(frame: SceneFrame): SceneNode[] {
  if (frame.pose) return frame.pose;
  const p = clamp(frame.local);
  const nodes = layout(frame.phase, p);
  if (frame.phase === "hero" || frame.previous === frame.phase) return nodes;
  const before = layout(frame.previous, 1);
  const blend = clamp(p / .3);
  const eased = blend * blend * (3 - 2 * blend);
  return nodes.map((node, i) => ({ ...node,
    x: mix(before[i].x, node.x, eased), y: mix(before[i].y, node.y, eased),
    w: mix(before[i].w, node.w, eased), h: mix(before[i].h, node.h, eased),
    z: mix(before[i].z, node.z, eased), opacity: mix(before[i].opacity, node.opacity, eased),
  }));
}

export function sceneConnections(phase: ScenePhase): [number, number][] {
  if (phase === "match") return [[0, 1], [2, 3]];
  if (phase === "interview") return [[0, 1], [1, 2], [2, 3], [3, 4]];
  return [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]];
}
