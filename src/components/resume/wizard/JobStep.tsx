"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useJobs } from "@/lib/hooks/useJobs";

const JD_MAX = 5000;

export function JobStep({
  selectedJobId,
  setSelectedJobId,
  title,
  setTitle,
  targetJobTitle,
  setTargetJobTitle,
  jobDescription,
  setJobDescription,
  contentDepth,
  setContentDepth,
}: {
  selectedJobId: string;
  setSelectedJobId: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  targetJobTitle: string;
  setTargetJobTitle: (v: string) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  contentDepth: "CONCISE" | "STANDARD" | "DETAILED" | "COMPREHENSIVE";
  setContentDepth: (v: "CONCISE" | "STANDARD" | "DETAILED" | "COMPREHENSIVE") => void;
}) {
  const { data } = useDashboardSummary();
  const jobs = useJobs();
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
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Content depth</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["CONCISE", "Concise", "Focused one-page document"],
              ["STANDARD", "Standard", "Balanced detail for most roles"],
              ["DETAILED", "Detailed", "More context and stronger bullets"],
              ["COMPREHENSIVE", "Comprehensive", "Full career history for a CV"],
            ] as const).map(([value, label, description]) => (
              <button key={value} type="button" onClick={() => setContentDepth(value)} className={`rounded-xl border p-3 text-left transition ${contentDepth === value ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/15" : "border-border bg-background/65 hover:border-violet-400/50"}`}>
                <span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">Saved job description</span>
          <select
            value={selectedJobId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedJobId(nextId);
              const job = jobs.data?.find((item) => item.id === nextId);
              if (!job) return;
              setTitle(`${job.title} — ${job.company}`.slice(0, 100));
              setTargetJobTitle(job.title.slice(0, 100));
              setJobDescription(job.description.slice(0, JD_MAX));
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Use a manually entered job description</option>
            {jobs.data?.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} · {job.company}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            Selecting a saved job fills the role and description below. Resume content is generated from these details and your profile.
          </span>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">Document title</span>
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
