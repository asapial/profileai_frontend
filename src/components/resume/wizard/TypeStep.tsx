"use client";

import { FileText, ScrollText } from "lucide-react";
import type { ResumeType } from "@/lib/hooks/useResumes";

const TYPES: Array<{
  value: ResumeType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "RESUME",
    title: "Resume",
    description:
      "1–2 pages. Best for industry jobs, internships, and most tech roles.",
    icon: FileText,
  },
  {
    value: "CV",
    title: "CV",
    description:
      "Detailed academic record. Best for research, faculty, or international roles.",
    icon: ScrollText,
  },
];

export function TypeStep({
  type,
  onChange,
}: {
  type: ResumeType;
  onChange: (value: ResumeType) => void;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Pick a document type
        </h2>
        <p className="text-sm text-muted-foreground">
          You can change this later — content stays intact.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const selected = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={selected}
              className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                selected
                  ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-500/30 dark:bg-violet-950/30"
                  : "border-border bg-card hover:border-violet-300"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  selected
                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow"
                    : "bg-violet-500/10 text-violet-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="space-y-1">
                <span className="block text-base font-semibold">{t.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {t.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}