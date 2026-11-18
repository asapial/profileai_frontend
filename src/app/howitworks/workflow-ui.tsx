import Image from "next/image";
import type { ReactNode } from "react";
import s from "./HowItWorks.module.css";

const paths = {
  file: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h6" />,
  search: <><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="M6 18L18 6M6 6h12v12" />,
  link: <path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" />,
  spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />,
  browser: <><rect x="3" y="4" width="18" height="15" rx="2" /><path d="M3 8h18M7 6h.01M10 6h.01M8 22h8M12 19v3" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0M12 12v3" /></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers: <path d="m12 3 10 5-10 5L2 8l10-5zM2 12l10 5 10-5M2 16l10 5 10-5" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8L22 5" /></>,
  folder: <path d="M3 7V5h7l2 3h9v12H3V7Z" />,
  sheet: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 8h16M4 13h16M4 17h16M10 8v13" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  pause: <path d="M8 5v14M16 5v14" />,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
};

export function WorkflowIcon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Chip({ children, positive = false }: { children: ReactNode; positive?: boolean }) {
  return <span className={`${s.chip}${positive ? ` ${s.green}` : ""}`}>{children}</span>;
}

export function WindowBar({ title, subtitle = "Illustrative workflow" }: { title: string; subtitle?: string }) {
  return <div className={s.windowBar}><div><Image src="/brand/profileai-mark.svg" alt="" width={25} height={25} /><strong>{title}</strong></div><span>{subtitle}</span><i aria-hidden="true">•••</i></div>;
}

export function SectionHeading({ id, label, title, text }: { id: string; label: string; title: ReactNode; text: string }) {
  return <div className={s.sectionHeading}><div><span className={s.label}>{label}</span><h2 id={id}>{title}</h2></div><p>{text}</p></div>;
}

export function Guide({ steps }: { steps: readonly (readonly [string, string])[] }) {
  return <ol className={s.guide}>{steps.map(([title, text], index) => <li key={title}><span aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>;
}
