import {
  Sparkles,
  Gauge,
  LayoutTemplate,
  Download,
  PenLine,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import type { ManagedHomepageSection } from "@/lib/homepage";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
};

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI resume generation",
    description:
      "Paste the job description and your background. Our AI writes a tailored, quantified resume in seconds.",
    highlight: "Tailored to the JD",
  },
  {
    icon: Gauge,
    title: "Instant ATS score",
    description:
      "See how well your resume matches the role with a clear 0–100 score, plus actionable fixes.",
    highlight: "Beat the bots",
  },
  {
    icon: LayoutTemplate,
    title: "Premium templates",
    description:
      "Hand-crafted templates for modern, classic, executive and technical roles — fully responsive.",
    highlight: "20+ designs",
  },
  {
    icon: Download,
    title: "One-click export",
    description:
      "Export to a pixel-perfect PDF or DOCX, formatted for both humans and applicant tracking systems.",
    highlight: "PDF · DOCX",
  },
  {
    icon: PenLine,
    title: "Cover letters that match",
    description:
      "Generate a matching cover letter for every role, written in your voice and aligned to the JD.",
    highlight: "Pairs with resume",
  },
  {
    icon: ListChecks,
    title: "Application tracker",
    description:
      "Track every job you apply to in one place — status, follow-ups, notes, and interview reminders.",
    highlight: "Stay organized",
  },
];

const FEATURE_ICONS = [Sparkles, Gauge, LayoutTemplate, Download, PenLine, ListChecks];

export function FeatureGridSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const features = content?.items?.map((item, index) => ({
    icon: FEATURE_ICONS[index % FEATURE_ICONS.length]!,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    highlight: item.label ? String(item.label) : undefined,
  })) ?? FEATURES;
  return (
    <section id="features" className="premium-section py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={content?.eyebrow || "Features"}
          title={<>{content?.title || "Everything you need to land the interview"}</>}
          description={content?.description || "Six powerful tools, one simple workflow. Built for job seekers who want to stop guessing and start getting callbacks."}
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.title}
                className="glass-panel group relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-violet-500/10"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-fuchsia-500 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  {f.highlight && (
                    <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {f.highlight}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
