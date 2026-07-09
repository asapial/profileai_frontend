"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

const JD_MAX = 5000;

export function JobStep({
  title,
  setTitle,
  type,
  setType,
  targetJobTitle,
  setTargetJobTitle,
  jobDescription,
  setJobDescription,
}: {
  title: string;
  setTitle: (v: string) => void;
  type: "RESUME" | "CV";
  setType: (v: "RESUME" | "CV") => void;
  targetJobTitle: string;
  setTargetJobTitle: (v: string) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
}) {
  const { data } = useDashboardSummary();
  const limits = data?.limits;

  const resumeRemaining =
    limits ? Math.max(0, limits.resumeLimit - limits.resumeUsed) : null;
  const apiRemaining =
    limits ? Math.max(0, limits.apiLimit - limits.apiUsed) : null;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Job details</h2>
        <p className="text-sm text-muted-foreground">
          The AI tailors output to the role. A pasted job description unlocks ATS
          scoring.
        </p>
      </header>

      {limits ? (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 dark:bg-violet-950/30">
            Resumes: {resumeRemaining} left this month
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/30">
            AI credits: {apiRemaining} left
          </span>
          {(resumeRemaining === 0 || apiRemaining === 0) && (
            <Link
              href="/pricing"
              className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700 hover:bg-rose-100"
            >
              Upgrade plan
            </Link>
          )}
        </div>
      ) : null}

      <div className="grid gap-4">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Resume title</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g. Senior Frontend Engineer — Stripe"
          />
          <span className="text-xs text-muted-foreground">
            Shown in your dashboard. {title.length}/100
          </span>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">Document type</span>
          <div className="flex gap-2">
            {(["RESUME", "CV"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  type === opt
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-border bg-card hover:border-violet-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">Target job title</span>
          <Input
            value={targetJobTitle}
            onChange={(e) => setTargetJobTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g. Product Engineer"
          />
        </label>

        <label className="space-y-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Job description (optional)
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {jobDescription.length}/{JD_MAX}
            </span>
          </span>
          <textarea
            value={jobDescription}
            onChange={(e) =>
              setJobDescription(e.target.value.slice(0, JD_MAX))
            }
            placeholder="Paste the role description for better ATS targeting."
            className="min-h-44 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <p className="text-xs text-muted-foreground">
            Don&apos;t have one? Skip — the AI will use the title only.
          </p>
        </label>
      </div>
    </div>
  );
}