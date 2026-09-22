"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Trash2,
  Edit3,
  Plus,
  ChevronDown,
  ChevronUp,
  History,
  Quote,
  Lock,
  Layers,
  Code2,
  Calendar,
  Users,
  Target,
  FileCheck2,
  X,
  ExternalLink,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EvidenceEntry = {
  id: string;
  title: string;
  statement: string;
  source: string;
  status: string;
  technologies?: string[];
  details?: Record<string, string | number>;
};

export type StoryDocument = {
  id: string;
  kind?: string;
  title: string;
  subject: string;
  body: string;
  evidence: Array<{ quote: string; source: string }>;
  versions: Array<{ body: string; savedAt: string }>;
};

type Actions = {
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
};

const inputClass =
  "w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

const starDetails = [
  { key: "situation", label: "Situation", placeholder: "Context: what challenge or circumstance did your team face?" },
  { key: "task", label: "Task", placeholder: "Your specific assignment or goal in that situation" },
  { key: "action", label: "Action", placeholder: "The exact steps, decisions, and technical choices you made" },
  { key: "result", label: "Result", placeholder: "Quantifiable impact, outcomes, latency/cost reductions" },
  { key: "project", label: "Project name / scope", placeholder: "e.g. NextGen Microservices Migration" },
  { key: "metrics", label: "Key metrics", placeholder: "e.g. 40% latency reduction, $12k/mo AWS savings" },
  { key: "dates", label: "Timeframe / Dates", placeholder: "e.g. Q3 2024 - Q1 2025" },
] as const;

export function EvidenceStudio({
  evidence,
  busy,
  run,
  onDelete,
}: Actions & {
  evidence: EvidenceEntry[];
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EvidenceEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "USER_CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Confirmed
          </span>
        );
      case "INFERRED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-3.5" />
            Inferred
          </span>
        );
      case "MISSING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <HelpCircle className="size-3.5" />
            Needs Info
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 grid gap-6 lg:grid-cols-12">
      {/* Add / Edit Form (5 cols on lg) */}
      <Card className="w-full min-w-0 border-violet-500/20 shadow-sm lg:col-span-5">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400">
                {editing ? <Edit3 className="size-4" /> : <Plus className="size-4" />}
              </span>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {editing ? "Edit Evidence" : "Add Real Evidence"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {editing
                    ? "Update and re-ground your statements"
                    : "Verified achievements you can stand behind"}
                </CardDescription>
              </div>
            </div>
            {editing && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setEditing(null);
                  setShowDetails(false);
                }}
              >
                <X className="mr-1 size-3.5" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <form
            key={editing?.id ?? "new"}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const f = new FormData(form);
              void run(async () => {
                const body = {
                  title: f.get("title"),
                  statement: f.get("statement"),
                  source: f.get("source"),
                  status: f.get("status"),
                  technologies: String(f.get("technologies"))
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  details: {
                    ...Object.fromEntries(
                      starDetails
                        .map((d) => d.key)
                        .filter((k) => String(f.get(k)).trim())
                        .map((k) => [k, String(f.get(k)).trim()])
                    ),
                    ...(f.get("teamSize") ? { teamSize: Number(f.get("teamSize")) } : {}),
                  },
                };
                if (editing) {
                  await api.put(`/career/evidence/${editing.id}`, body);
                } else {
                  await api.post("/career/evidence", body);
                }
                form.reset();
                setEditing(null);
                setShowDetails(false);
              });
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project or Responsibility
              </label>
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                placeholder="e.g. Distributed Payment Pipeline Redesign"
                defaultValue={editing?.title}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What did you accomplish? (Statement)
              </label>
              <textarea
                name="statement"
                required
                minLength={10}
                maxLength={3000}
                rows={3}
                placeholder="Describe what you built, resolved, or led, and the real impact..."
                defaultValue={editing?.statement}
                className={inputClass}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Source
                </label>
                <input
                  name="source"
                  required
                  minLength={2}
                  maxLength={500}
                  placeholder="e.g. GitHub PR #412, JIRA, Performance Review"
                  defaultValue={editing?.source}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification Status
                </label>
                <select
                  name="status"
                  defaultValue={
                    editing?.status === "VERIFIED"
                      ? "USER_CONFIRMED"
                      : editing?.status ?? "USER_CONFIRMED"
                  }
                  className={inputClass}
                >
                  <option value="USER_CONFIRMED">I confirm these facts</option>
                  <option value="INFERRED">Inferred — needs confirmation</option>
                  <option value="MISSING">Missing information</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technologies (comma separated)
              </label>
              <input
                name="technologies"
                placeholder="TypeScript, PostgreSQL, Redis, Kafka"
                defaultValue={editing?.technologies?.join(", ")}
                className={inputClass}
              />
            </div>

            {/* Collapsible STAR details */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-xs font-semibold text-foreground/80 hover:text-foreground"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-violet-500" />
                  STAR Framework & Interview Details (Optional)
                </span>
                {showDetails || Boolean(editing) ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {(showDetails || Boolean(editing)) && (
                <div className="mt-3.5 space-y-3 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Adding Situation, Task, Action & Result prepares ready-to-use stories for the Interview Studio.
                  </p>
                  {starDetails.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </label>
                      <textarea
                        name={key}
                        rows={2}
                        placeholder={placeholder}
                        maxLength={
                          key === "dates"
                            ? 100
                            : ["project", "metrics"].includes(key)
                            ? 300
                            : 1000
                        }
                        defaultValue={editing?.details?.[key] ?? ""}
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Team size (if applicable)
                    </label>
                    <input
                      type="number"
                      name="teamSize"
                      min={1}
                      step={1}
                      placeholder="e.g. 6"
                      defaultValue={editing?.details?.teamSize}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                disabled={busy}
                className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              >
                {editing ? "Update Evidence" : "Save Evidence"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing(null);
                    setShowDetails(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Evidence Bank List (7 cols on lg) */}
      <Card className="w-full min-w-0 border-border/70 lg:col-span-7">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <CardTitle className="text-lg font-semibold">Evidence Bank</CardTitle>
                <CardDescription className="text-xs">
                  Your grounded record of professional facts and milestones
                </CardDescription>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {evidence.length} {evidence.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {!evidence.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <FileCheck2 className="size-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold">No evidence added yet</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Ground your job applications in facts. Add projects, metrics, or technical responsibilities you can confidently speak to.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
              {evidence.map((item) => {
                const isExpanded = expandedDetailsId === item.id;
                const hasDetails =
                  item.details &&
                  Object.values(item.details).some((val) => String(val).trim().length > 0);

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "group rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-violet-500/30 hover:shadow-sm",
                      editing?.id === item.id && "ring-2 ring-violet-500/30 border-violet-500/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-snug text-foreground">
                          {item.title}
                        </h4>
                      </div>
                      <div className="shrink-0">{getStatusBadge(item.status)}</div>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">
                      {item.statement}
                    </p>

                    {item.technologies && item.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            <Code2 className="size-3 text-violet-500" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Quote className="size-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="truncate">Source: {item.source}</span>
                    </div>

                    {/* STAR Details Accordion */}
                    {hasDetails && (
                      <div className="mt-3 border-t border-border/50 pt-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDetailsId((prev) => (prev === item.id ? null : item.id))
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Sparkles className="size-3" />
                          {isExpanded ? "Hide STAR details" : "View STAR breakdown"}
                          {isExpanded ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </button>

                        {isExpanded && item.details && (
                          <div className="mt-2.5 grid gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                            {Object.entries(item.details).map(([k, val]) => (
                              <div key={k} className="flex flex-col sm:flex-row sm:gap-2">
                                <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] sm:w-20 shrink-0">
                                  {k}:
                                </span>
                                <span className="text-foreground/90">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          setEditing(item);
                          setShowDetails(true);
                        }}
                        className="h-8 text-xs font-medium"
                      >
                        <Edit3 className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api.delete(`/career/evidence/${item.id}`);
                            if (editing?.id === item.id) {
                              setEditing(null);
                              setShowDetails(false);
                            }
                            onDelete(item.id);
                          })
                        }
                        className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InterviewStudio({
  evidence,
  documents,
  plan,
  busy,
  run,
}: Actions & {
  evidence: EvidenceEntry[];
  documents: StoryDocument[];
  plan: string;
}) {
  const [evidenceId, setEvidenceId] = useState("");
  const [story, setStory] = useState<StoryDocument | null>(null);

  const confirmedEvidence = evidence.filter((e) =>
    ["VERIFIED", "USER_CONFIRMED"].includes(e.status)
  );

  return (
    <div className="w-full min-w-0 grid gap-6 lg:grid-cols-12">
      {/* Left panel: Builder & Saved Stories (5 cols) */}
      <Card className="w-full min-w-0 border-border/70 lg:col-span-5">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="size-4" />
            </span>
            <div>
              <CardTitle className="text-lg font-semibold">Interview Story Builder</CardTitle>
              <CardDescription className="text-xs">
                Construct clear STAR answers from confirmed evidence
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Structure your project achievements into Situation, Task, Action, and Result formats that recruiters look for.
          </p>

          {plan === "free" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-semibold">Pro Plan Feature</p>
              <p className="mt-0.5">
                AI Story generation requires Pro or Career Plus. You can still document details in your Evidence Bank.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Confirmed Project
            </label>
            <select
              className={inputClass}
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
            >
              <option value="">Choose an evidence item</option>
              {confirmedEvidence.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
            disabled={busy || !evidenceId || plan === "free"}
            onClick={() =>
              void run(async () =>
                setStory(await api.post<StoryDocument>("/career/stories", { evidenceId }))
              )
            }
          >
            <Sparkles className="mr-2 size-4" />
            Build My Story
          </Button>

          {/* Saved Stories */}
          <div className="pt-3 border-t border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Saved Stories ({documents.filter((d) => d.kind === "INTERVIEW_STORY").length})
            </h4>

            {documents.filter((d) => d.kind === "INTERVIEW_STORY").length === 0 ? (
              <p className="text-xs text-muted-foreground">No interview stories generated yet.</p>
            ) : (
              <div className="space-y-2">
                {documents
                  .filter((d) => d.kind === "INTERVIEW_STORY")
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setStory(d)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all duration-200 hover:border-violet-500/40",
                        story?.id === d.id
                          ? "border-violet-500/60 bg-violet-500/10 text-foreground font-medium shadow-sm"
                          : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{d.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{d.body}</p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right panel: Story Editor (7 cols) */}
      <Card className="w-full min-w-0 border-border/70 lg:col-span-7">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Practice & Review</CardTitle>
              <CardDescription className="text-xs">
                Refine the wording to reflect your authentic speaking style
              </CardDescription>
            </div>
            {story && (
              <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                Editing
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {!story ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-10 text-center">
              <Sparkles className="size-8 text-muted-foreground/40" />
              <h4 className="mt-3 text-sm font-semibold">Select or generate a story</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Choose a project on the left or select a saved story to read, rehearse, and edit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Speaking Script
                </label>
                <textarea
                  rows={14}
                  className={cn(inputClass, "font-sans leading-relaxed text-sm")}
                  value={story.body}
                  onChange={(e) => setStory({ ...story, body: e.target.value })}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  disabled={busy}
                  className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                  onClick={() =>
                    void run(async () =>
                      setStory(
                        await api.put<StoryDocument>(`/career/drafts/${story.id}`, {
                          subject: story.subject,
                          body: story.body,
                          reviewed: true,
                        })
                      )
                    )
                  }
                >
                  <FileCheck2 className="mr-1.5 size-4" />
                  Save Reviewed Story
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.delete(`/career/drafts/${story.id}`);
                      setStory(null);
                    })
                  }
                  className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  Delete Story
                </Button>
              </div>

              {/* Citations & Versions */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                <details>
                  <summary className="cursor-pointer font-medium text-foreground hover:text-violet-600 flex items-center gap-2">
                    <History className="size-3.5 text-violet-500" />
                    Sources & Previous Revisions ({story.versions.length})
                  </summary>
                  <div className="mt-3 space-y-3 pt-2 border-t border-border/40">
                    {story.evidence.map((c, i) => (
                      <blockquote
                        key={i}
                        className="border-l-2 border-violet-500/40 pl-3 text-xs text-muted-foreground"
                      >
                        &ldquo;{c.quote}&rdquo;
                        <cite className="mt-1 block font-medium text-foreground/80 not-italic">
                          — {c.source}
                        </cite>
                      </blockquote>
                    ))}
                    {story.versions.map((v, i) => (
                      <article
                        key={i}
                        className="rounded border border-border/40 bg-background/50 p-2.5 text-xs text-muted-foreground"
                      >
                        <time className="font-semibold text-foreground/80">
                          {new Date(v.savedAt).toLocaleString()}
                        </time>
                        <p className="mt-1 whitespace-pre-wrap">{v.body}</p>
                      </article>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export type DiscoveryPreferences = {
  roles?: string[];
  locations?: string[];
  industries?: string[];
  workplace?: string;
  salaryMin?: number | null;
  salaryCurrency?: string | null;
  writingStyle?: { tone: string; length: string };
};

export function PreferencesForm({
  preferences,
  busy,
  run,
}: Actions & { preferences?: DiscoveryPreferences }) {
  return (
    <form
      key={JSON.stringify(preferences)}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        void run(async () => {
          await api.put("/career/preferences", {
            roles: String(f.get("roles"))
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            locations: String(f.get("locations"))
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            industries: String(f.get("industries"))
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            workplace: f.get("workplace"),
            salaryMin: f.get("salaryMin") ? Number(f.get("salaryMin")) : null,
            salaryCurrency: f.get("salaryCurrency")
              ? String(f.get("salaryCurrency")).toUpperCase()
              : null,
          });
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="size-3.5 text-violet-500" />
            Target Roles (comma separated)
          </label>
          <input
            name="roles"
            placeholder="Senior Full Stack, Lead Frontend, Staff Engineer"
            defaultValue={preferences?.roles?.join(", ")}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-3.5 text-violet-500" />
            Preferred Locations (comma separated)
          </label>
          <input
            name="locations"
            placeholder="San Francisco, New York, Remote US, London"
            defaultValue={preferences?.locations?.join(", ")}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="size-3.5 text-violet-500" />
            Target Industries (comma separated)
          </label>
          <input
            name="industries"
            placeholder="Fintech, AI/ML, Developer Tools, Healthtech"
            defaultValue={preferences?.industries?.join(", ")}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="size-3.5 text-violet-500" />
            Workplace Preference
          </label>
          <select
            name="workplace"
            defaultValue={preferences?.workplace ?? "ANY"}
            className={inputClass}
          >
            <option value="ANY">Any workplace model</option>
            <option value="REMOTE">Remote only</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ON_SITE">On-site</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="size-3.5 text-violet-500" />
            Minimum Annual Salary
          </label>
          <input
            type="number"
            min={0}
            name="salaryMin"
            placeholder="e.g. 150000"
            defaultValue={preferences?.salaryMin ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Currency Code
          </label>
          <input
            name="salaryCurrency"
            pattern="[A-Za-z]{3}"
            minLength={3}
            maxLength={3}
            placeholder="USD"
            defaultValue={preferences?.salaryCurrency ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground max-w-md">
          Preferences help evaluate relevance in Discovery without automatic AI filters or false exclusions.
        </p>
        <Button
          type="submit"
          disabled={busy}
          className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
        >
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
