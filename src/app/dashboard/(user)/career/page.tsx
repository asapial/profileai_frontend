"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  EvidenceStudio,
  InterviewStudio,
  type DiscoveryPreferences,
  type EvidenceEntry,
} from "@/components/career/EvidenceStudio";
import {
  ShieldCheck,
  Target,
  Mail,
  MessageSquare,
  Link2,
  BarChart3,
  Sparkles,
  ArrowRight,
  Calendar,
  RefreshCw,
  Check,
  AlertCircle,
  AlertTriangle,
  Download,
  Trash2,
  Send,
  Info,
  Minus,
  Plus,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyProfile } from "@/lib/hooks/useMyProfile";

type Evidence = EvidenceEntry;

type Draft = {
  kind?: string;
  subjects?: string[];
  id: string;
  title: string;
  subject: string;
  body: string;
  recipient: string | null;
  reviewedAt: string | null;
  evidence: Array<{ evidenceId: string; quote: string; source: string }>;
  versions: Array<{ subject: string; body: string; savedAt: string }>;
  generatedBy?: "ai" | "structured-fallback";
  model?: string;
  targetCharacters?: number;
  targetMet?: boolean;
  generationWarning?: string;
};

type Overview = {
  preference?: { preferences: DiscoveryPreferences };
  evidence: Evidence[];
  documents: Draft[];
  jobs: Array<{ id: string; title: string; company: string }>;
  resumes: Array<{ id: string; title: string; version: number }>;
  plan: string;
  limits: Record<string, number | null>;
  usage: Array<{ feature: string; used: number }>;
  outcomes: Record<string, number>;
  resetAt: string;
};

type Analysis = {
  result: {
    score: number | null;
    disclaimer: string;
    method: string;
    risks: string[];
    requirements: Array<{
      requirement: string;
      status: string;
      coverage: number;
      confidence: string;
      importance: string;
      rationale?: string;
      components?: { lexical: number; semantic: number; evidenceQuality: number };
      citation: { source: string; quote: string } | null;
    }>;
    breakdown: Record<string, string | number | null>;
  };
};

const tabs = [
  { id: "Career story", label: "Career story", icon: ShieldCheck },
  { id: "Alignment", label: "Alignment", icon: Target },
  { id: "Email studio", label: "Email studio", icon: Mail },
  { id: "Interview", label: "Interview", icon: MessageSquare },
  { id: "Connections", label: "Connections", icon: Link2 },
  { id: "Insights", label: "Insights", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

const fieldClass =
  "w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

export default function CareerPage() {
  const client = useQueryClient();
  const profile = useMyProfile();
  const query = useQuery({
    queryKey: ["career"],
    queryFn: () => api.get<Overview>("/career"),
  });

  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "Career story";
    const requested = new URLSearchParams(window.location.search).get("tab");
    return tabs.some((item) => item.id === requested) ? (requested as TabId) : "Career story";
  });
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [analysisDocumentId, setAnalysisDocumentId] = useState("");
  const [combined, setCombined] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<{
    previewKey: string;
    before: { summary?: string };
    after: { summary: string };
  } | null>(null);
  const [kind, setKind] = useState("APPLICATION");
  const [tone, setTone] = useState("neutral");
  const [length, setLength] = useState("standard");
  const [targetCharacters, setTargetCharacters] = useState(1600);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ["career"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete the action.");
    } finally {
      setBusy(false);
    }
  }

  // Loading skeleton
  if (query.isPending) {
    return (
      <div className="career-workspace relative mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 lg:px-6 [scrollbar-gutter:stable]">
        <div className="career-glass-surface h-40 animate-pulse rounded-3xl" />
        <div className="career-glass-surface h-12 w-full animate-pulse rounded-2xl" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="career-glass-surface h-96 animate-pulse rounded-2xl" />
          <div className="career-glass-surface h-96 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (query.isError || !query.data) {
    return (
      <div className="career-workspace relative mx-auto w-full max-w-5xl px-4 py-12 lg:px-6 [scrollbar-gutter:stable]">
        <Card className="border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Workspace unavailable</h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
            {query.error?.message ?? "We encountered a problem loading your career intelligence workspace."}
          </p>
          <Button
            onClick={() => query.refetch()}
            className="mt-6 bg-violet-600 text-white hover:bg-violet-700"
          >
            <RefreshCw className="mr-2 size-4" />
            Retry Workspace
          </Button>
        </Card>
      </div>
    );
  }

  const data = query.data;

  const contextSelector = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Target Job Opportunity">
        <select
          className={fieldClass}
          value={jobId}
          onChange={(e) => {
            setJobId(e.target.value);
            setAnalysis(null);
            setPreview(null);
          }}
        >
          <option value="">Choose a saved job</option>
          {data.jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} · {j.company}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Base Resume">
        <select
          className={fieldClass}
          value={resumeId}
          onChange={(e) => {
            setResumeId(e.target.value);
            setAnalysis(null);
            setPreview(null);
          }}
        >
          <option value="">Choose a resume</option>
          {data.resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title} · v{r.version}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );

  const claimsSelector = (
    <fieldset className="space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4">
      <div className="flex items-center justify-between">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Confirmed Achievements to Include
        </legend>
        <span className="text-xs text-muted-foreground">
          {selected.length} selected
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.evidence
          .filter((e) => ["VERIFIED", "USER_CONFIRMED"].includes(e.status))
          .map((e) => {
            const isChecked = selected.includes(e.id);
            return (
              <label
                key={e.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-150",
                  isChecked
                    ? "border-violet-500/50 bg-violet-500/10 shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/30"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded accent-violet-600"
                  checked={isChecked}
                  onChange={(ev) => {
                    setSelected(
                      ev.target.checked
                        ? [...selected, e.id]
                        : selected.filter((id) => id !== e.id)
                    );
                    setPreview(null);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {e.statement}
                  </p>
                </div>
              </label>
            );
          })}
      </div>

      {!data.evidence.some((e) => ["VERIFIED", "USER_CONFIRMED"].includes(e.status)) && (
        <p className="text-xs text-muted-foreground">
          Add and confirm at least one achievement in Career story first.
        </p>
      )}
    </fieldset>
  );

  return (
    <div className="career-workspace relative mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 lg:px-6 [scrollbar-gutter:stable]">
      {/* Hero Header */}
      <header className="career-glass-surface relative isolate w-full overflow-hidden rounded-3xl border border-violet-500/20 p-6 sm:p-8">
        {/* Glow ambient effects */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 -z-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/25"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-400/20"
          aria-hidden="true"
        />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 backdrop-blur-md dark:text-violet-200">
            <Sparkles className="size-3.5 text-violet-600 dark:text-violet-300" />
            {data.plan} plan · Career workspace
          </div>
          <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Build applications with evidence.
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Connect achievements to target roles, review every draft, and prepare with confidence.
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav
        aria-label="Career workspace sections"
        className="career-glass-surface flex w-full gap-1.5 overflow-x-auto rounded-2xl border border-border/60 p-1.5 shadow-xs"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                active
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4", active ? "text-white" : "text-muted-foreground")} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content Panels */}
      <main className="w-full min-w-0 min-h-[550px]">
        {tab === "Career story" && (
          <div className="space-y-4">
            <PathwayLinks
              links={[
                { href: "/dashboard/profile?tab=professional", label: "Professional profile", detail: "Keep experience and role details current" },
                { href: "/dashboard/profile?tab=skills", label: "Skills profile", detail: "Use your profile as the source for career achievements" },
              ]}
            />
            <EvidenceStudio
              evidence={data.evidence}
              profile={profile.data}
              busy={busy}
              run={run}
              onDelete={(id) => {
                setSelected(selected.filter((value) => value !== id));
                setPreview(null);
              }}
            />
          </div>
        )}

        {tab === "Interview" && (
          <div className="space-y-4">
            <PathwayLinks links={[{ href: "/dashboard/jobs", label: "Job workspace", detail: "Open a tracked role before preparing its interview story" }]} />
            <InterviewStudio
              evidence={data.evidence}
              documents={data.documents}
              plan={data.plan}
              busy={busy}
              run={run}
            />
          </div>
        )}

        {tab === "Alignment" && (
          <Panel
            title="Job Alignment & Resume Review"
            description="Evaluate requirement match percentages and generate verified tailored summaries"
            icon={Target}
          >
            <div className="space-y-5">
              <PathwayLinks
                links={[
                  { href: "/dashboard/ats", label: "JD Analyzer", detail: "Review the same job description in ATS analysis" },
                  { href: "/dashboard/resumes", label: "Resumes", detail: "Open, edit, or review a tailored resume version" },
                ]}
              />
              {contextSelector}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Document to Analyze">
                  <select
                    className={fieldClass}
                    value={analysisDocumentId}
                    onChange={(e) => setAnalysisDocumentId(e.target.value)}
                  >
                    <option value="">Resume only</option>
                    {data.documents
                      .filter((d) => d.kind !== "INTERVIEW_STORY")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                  </select>
                </Field>

                {analysisDocumentId && (
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-4 rounded accent-violet-600"
                        checked={combined}
                        onChange={(e) => setCombined(e.target.checked)}
                      />
                      Include resume for combined readiness assessment
                    </label>
                  </div>
                )}
              </div>

              <Button
                disabled={busy || !jobId || !resumeId}
                className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                onClick={() =>
                  void run(async () =>
                    setAnalysis(
                      await api.post<Analysis>("/career/alignment", {
                        jobId,
                        resumeId,
                        ...(analysisDocumentId ? { documentId: analysisDocumentId, combined } : {}),
                      })
                    )
                  )
                }
              >
                <Target className="mr-2 size-4" />
                Analyze Alignment
              </Button>

              {/* Analysis Results Display */}
              {analysis && (
                <div className="mt-6 space-y-6 rounded-2xl border border-border/70 bg-card p-6">
                  {/* Score banner */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Evidence Coverage Score
                      </span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {analysis.result.score !== null ? `${analysis.result.score}%` : "Pending"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          grounded in confirmed evidence
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="size-4 text-violet-500" />
                      <span>{analysis.result.method}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {analysis.result.disclaimer}
                  </p>

                  {/* Risks */}
                  {analysis.result.risks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Identified Risks & Missing Signals
                      </h4>
                      {analysis.result.risks.map((r) => (
                        <div
                          key={r}
                          className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300"
                        >
                          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Breakdown metrics */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(analysis.result.breakdown).map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                        <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {k.replace(/([A-Z])/g, " $1")}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground">
                          {v ?? "Needs review"}
                        </dd>
                      </div>
                    ))}
                  </div>

                  {/* Requirement Details */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Detailed Requirement Alignment
                    </h4>
                    {analysis.result.requirements.map((r, i) => (
                      <article
                        key={i}
                        className="rounded-xl border border-border/60 bg-card p-4 transition-all duration-150 hover:border-violet-500/30"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                              r.status === "strong"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : r.status === "partial"
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            )}
                          >
                            {r.status}
                          </span>
                          <span className="text-xs font-semibold text-foreground">{r.coverage}% coverage</span>
                          <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {r.importance} · {r.confidence} confidence
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-foreground">{r.requirement}</p>
                        {r.components && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                            <span>Lexical {r.components.lexical}%</span>
                            <span>Semantic {r.components.semantic}%</span>
                            <span>Evidence quality {r.components.evidenceQuality}%</span>
                          </div>
                        )}
                        {r.rationale && <p className="mt-2 text-xs text-muted-foreground">{r.rationale}</p>}
                        {r.citation && (
                          <blockquote className="mt-2.5 border-l-2 border-violet-500/40 pl-3 text-xs text-muted-foreground">
                            &ldquo;{r.citation.quote}&rdquo;
                            <cite className="mt-1 block font-normal text-xs text-muted-foreground/80 not-italic">
                              Source: {r.citation.source}
                            </cite>
                          </blockquote>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* Tailoring Section */}
              <div className="mt-8 pt-6 border-t border-border/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-600" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Tailor Resume Summary with Evidence
                  </h3>
                </div>

                {claimsSelector}

                <Button
                  variant="outline"
                  disabled={busy || !jobId || !resumeId || !selected.length}
                  onClick={() =>
                    void run(async () =>
                      setPreview(
                        await api.post("/career/tailor", {
                          jobId,
                          resumeId,
                          evidenceIds: selected,
                          accept: false,
                        })
                      )
                    )
                  }
                >
                  Preview Tailored Summary
                </Button>

                {preview && (
                  <div className="mt-4 space-y-4 rounded-2xl border border-border/70 bg-card p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Current Summary
                        </span>
                        <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                          {preview.before.summary ?? "No current summary provided."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          Tailored Summary
                        </span>
                        <p className="mt-2 text-xs leading-relaxed text-foreground font-medium">
                          {preview.after.summary}
                        </p>
                      </div>
                    </div>

                    <Button
                      disabled={busy}
                      className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                      onClick={() =>
                        void run(async () => {
                          await api.post("/career/tailor", {
                            jobId,
                            resumeId,
                            evidenceIds: selected,
                            accept: true,
                            previewKey: preview.previewKey,
                          });
                          setPreview(null);
                          toast.success("Saved as a new resume version");
                        })
                      }
                    >
                      <Check className="mr-2 size-4" />
                      Accept and Save New Resume Version
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        )}

        {tab === "Email studio" && (
          <div className="space-y-4">
            <PathwayLinks
              links={[
                { href: "/dashboard/cover-letters", label: "Cover letters", detail: "Open and manage your saved cover letters" },
                { href: "/dashboard/jobs", label: "Job workspace", detail: "Attach outreach and follow-ups to a tracked role" },
              ]}
            />
            <div className="w-full min-w-0 grid gap-6 lg:grid-cols-12">
            {/* Left column: Compose (5 cols) */}
            <div className="w-full min-w-0 lg:col-span-5">
              <Panel
                title="Compose Grounded Draft"
                description="Generate cold emails, outreach, or cover letters backed by verified claims"
                icon={Mail}
              >
                <div className="space-y-4">
                  {contextSelector}
                  {claimsSelector}

                  <Field label="Message Purpose">
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                      className={fieldClass}
                    >
                      {[
                        "APPLICATION",
                        "OUTREACH",
                        "FOLLOW_UP",
                        "THANK_YOU",
                        "REFERRAL",
                        "COVER_LETTER",
                      ].map((k) => (
                        <option key={k} value={k}>
                          {k.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tone">
                      <select
                        className={fieldClass}
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      >
                        <option value="neutral">Neutral & Professional</option>
                        <option value="warm">Warm & Conversational</option>
                        <option value="confident">More Confident</option>
                      </select>
                    </Field>

                    <Field label="Length">
                      <select
                        className={fieldClass}
                        value={length}
                        onChange={(e) => {
                          const nextLength = e.target.value;
                          setLength(nextLength);
                          setTargetCharacters(nextLength === "short" ? 900 : 1600);
                        }}
                      >
                        <option value="standard">Standard</option>
                        <option value="short">Short & Concise</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Target Characters">
                    <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 p-1.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Decrease email character target"
                        disabled={targetCharacters <= 600}
                        onClick={() => setTargetCharacters((value) => Math.max(600, value - 200))}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <div className="min-w-0 flex-1 text-center">
                        <p className="text-sm font-semibold tabular-nums">{targetCharacters.toLocaleString()} characters</p>
                        <p className="text-xs text-muted-foreground">Applies to every tone · adjustable from 600–3,600</p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Increase email character target"
                        disabled={targetCharacters >= 3600}
                        onClick={() => setTargetCharacters((value) => Math.min(3600, value + 200))}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </Field>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="text-xs"
                      onClick={() =>
                        void run(async () => {
                          await api.put("/career/style", { tone, length, targetCharacters });
                          toast.success("Writing style preferences saved");
                        })
                      }
                    >
                      Remember Style
                    </Button>
                    {data.preference?.preferences.writingStyle && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          const style = data.preference!.preferences.writingStyle!;
                          setTone(style.tone);
                          setLength(style.length);
                          setTargetCharacters(style.targetCharacters ?? (style.length === "short" ? 900 : 1600));
                        }}
                      >
                        Use Saved Style
                      </Button>
                    )}
                  </div>

                  <Button
                    disabled={busy || !jobId}
                    className="w-full bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                    onClick={() =>
                      void run(async () => {
                        const created = await api.post<Draft>("/career/drafts", {
                            jobId,
                            ...(resumeId ? { resumeId } : {}),
                            evidenceIds: selected,
                            kind,
                            tone,
                            length,
                            targetCharacters,
                          });
                        setDraft(created);
                        toast.success(created.generatedBy === "ai" ? "Professional AI draft created" : "Professional draft created with the safe fallback");
                      })
                    }
                  >
                    <Sparkles className="mr-2 size-4" />
                    Create Draft
                  </Button>

                  {/* Saved Drafts List */}
                  <div className="pt-3 border-t border-border/60">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Saved Drafts ({data.documents.filter((d) => d.kind !== "INTERVIEW_STORY").length})
                    </h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {data.documents
                        .filter((d) => d.kind !== "INTERVIEW_STORY")
                        .map((d) => (
                          <button
                            key={d.id}
                            className={cn(
                              "block w-full rounded-xl border p-3 text-left transition-all duration-150",
                              draft?.id === d.id
                                ? "border-violet-500/50 bg-violet-500/10 font-medium"
                                : "border-border/60 bg-card hover:bg-muted/40"
                            )}
                            onClick={() => setDraft(d)}
                          >
                            <p className="text-xs font-semibold text-foreground line-clamp-1">
                              {d.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {d.subject || "No subject specified"}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Right column: Review & Send (7 cols) */}
            <div className="w-full min-w-0 lg:col-span-7">
              <Panel
                title="Review Before Sending"
                description="Edit copy, check verified citations, and manage delivery"
                icon={Send}
              >
                {!draft ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
                    <Mail className="size-8 text-muted-foreground/40" />
                    <h4 className="mt-3 text-sm font-semibold">No draft selected</h4>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Compose a new draft on the left or select an existing draft to inspect and polish.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.generatedBy && (
                      <div className={cn(
                        "rounded-xl border p-3 text-xs",
                        draft.generationWarning ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300" : "border-violet-500/20 bg-violet-500/5 text-muted-foreground",
                      )}>
                        <div className="flex items-center gap-2 font-medium">
                          <Sparkles className="size-3.5 text-violet-500" />
                          {draft.generatedBy === "ai" ? "AI-written from your confirmed career context" : "Safe grounded fallback created"}
                        </div>
                        {draft.generationWarning && <p className="mt-1 pl-5.5">{draft.generationWarning}</p>}
                      </div>
                    )}
                    <Field label="Recipient Email">
                      <input
                        type="email"
                        placeholder="recruiter@company.com"
                        className={fieldClass}
                        value={draft.recipient ?? ""}
                        onChange={(e) =>
                          setDraft({ ...draft, recipient: e.target.value, reviewedAt: null })
                        }
                      />
                    </Field>

                    {draft.subjects && draft.subjects.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Suggested Subject Lines
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {draft.subjects.map((subject) => (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => setDraft({ ...draft, subject, reviewedAt: null })}
                              className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-violet-500/40 hover:text-foreground"
                            >
                              {subject}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Field label="Subject">
                      <input
                        className={fieldClass}
                        value={draft.subject}
                        onChange={(e) =>
                          setDraft({ ...draft, subject: e.target.value, reviewedAt: null })
                        }
                      />
                    </Field>

                    <Field label="Draft Message">
                      <textarea
                        className={cn(fieldClass, "font-sans leading-relaxed")}
                        rows={12}
                        value={draft.body}
                        onChange={(e) =>
                          setDraft({ ...draft, body: e.target.value, reviewedAt: null })
                        }
                      />
                    </Field>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">{draft.body.length.toLocaleString()} characters</span>
                      <span className={cn(draft.targetMet === false && "text-amber-600 dark:text-amber-400")}>
                        Generation target: {(draft.targetCharacters ?? targetCharacters).toLocaleString()}
                        {draft.targetMet === false ? " · target not reached" : ""}
                      </span>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-semibold">Review Requirement</p>
                      <p className="mt-0.5">
                        Review every claim and recipient before queueing delivery. Attachments are not automatically attached.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <Button
                        variant="outline"
                        disabled={!draft.body.trim()}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
                            toast.success("Email copied with subject and message");
                          } catch {
                            toast.error("Could not copy the email. Please select the text manually.");
                          }
                        }}
                      >
                        <Copy className="mr-1.5 size-3.5" />
                        Copy Email
                      </Button>

                      <Button
                        disabled={busy}
                        className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                        onClick={() =>
                          void run(async () =>
                            setDraft(
                              await api.put<Draft>(`/career/drafts/${draft.id}`, {
                                subject: draft.subject,
                                body: draft.body,
                                ...(draft.recipient ? { recipient: draft.recipient } : {}),
                                reviewed: true,
                              })
                            )
                          )
                        }
                      >
                        <Check className="mr-1.5 size-4" />
                        Save Reviewed Draft
                      </Button>

                      <Button
                        variant="outline"
                        disabled={busy || !draft.reviewedAt || !draft.recipient}
                        onClick={() =>
                          void run(async () => {
                            await api.post(`/career/drafts/${draft.id}/send`, {
                              key: crypto.randomUUID(),
                              reviewed: true,
                            });
                            toast.success("Queued. Check Connections tab for delivery status.");
                          })
                        }
                      >
                        <Send className="mr-1.5 size-3.5" />
                        Send Reviewed Email
                      </Button>

                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api.delete(`/career/drafts/${draft.id}`);
                            setDraft(null);
                          })
                        }
                        className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Delete Draft
                      </Button>
                    </div>

                    {/* Claims & Revision History */}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                      <details>
                        <summary className="cursor-pointer font-medium text-foreground hover:text-violet-600">
                          Claim Sources & Revision History ({draft.evidence.length} claims, {draft.versions.length} versions)
                        </summary>
                        <div className="mt-3 space-y-3 pt-2 border-t border-border/40">
                          {draft.evidence.map((e, i) => (
                            <blockquote
                              key={i}
                              className="border-l-2 border-violet-500/40 pl-3 text-xs text-muted-foreground"
                            >
                              &ldquo;{e.quote}&rdquo;
                              <cite className="mt-0.5 block font-medium text-foreground/80 not-italic">
                                — {e.source}
                              </cite>
                            </blockquote>
                          ))}
                          {draft.versions.map((v, i) => (
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
              </Panel>
            </div>
            </div>
          </div>
        )}

        {tab === "Connections" && <Connections run={run} busy={busy} />}

        {tab === "Insights" && (
          <Panel
            title="Application Outcomes, Not Speculation"
            description="Clear records of where your applications stand, without synthetic AI predictions"
            icon={BarChart3}
          >
            <div className="space-y-6">
              <PathwayLinks
                links={[
                  { href: "/dashboard/jobs", label: "Job workspace", detail: "Update the tracked role behind these outcomes" },
                  { href: "/dashboard/analytics", label: "Analytics", detail: "View response, interview, and offer trends" },
                ]}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(data.outcomes).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-2xl border border-border/70 bg-card p-5 transition hover:shadow-xs"
                  >
                    <p className="text-3xl font-bold tracking-tight text-foreground">{count}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 text-xs text-muted-foreground leading-relaxed">
                <p>
                  These numbers reflect your recorded real-world application states. Small sample sizes cannot establish what caused an outcome. Alignment checks and evidence-grounded drafts use deterministic rules and carry zero third-party AI training exposure.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  onClick={() =>
                    void run(async () => {
                      const value = await api.get("/career/export");
                      const url = URL.createObjectURL(
                        new Blob([JSON.stringify(value, null, 2)], {
                          type: "application/json",
                        })
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "profileai-export.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    })
                  }
                >
                  <Download className="mr-2 size-4" />
                  Export My Workspace Data
                </Button>

                <Link
                  className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  href="/dashboard/settings"
                >
                  Account privacy and data retention settings →
                </Link>
              </div>
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: typeof ShieldCheck;
  children: ReactNode;
}) {
  return (
    <Card className="w-full min-w-0 border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400">
              <Icon className="size-4" />
            </span>
          )}
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function PathwayLinks({
  links,
}: {
  links: Array<{ href: string; label: string; detail: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 transition hover:border-violet-500/40 hover:bg-violet-500/10"
        >
          <span>
            <span className="block text-xs font-semibold text-foreground">{link.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{link.detail}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-violet-500 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}

type Actions = { run: (fn: () => Promise<void>) => Promise<void>; busy: boolean };

function Connections({ run, busy }: Actions) {
  const q = useQuery({
    queryKey: ["career", "connections"],
    queryFn: () =>
      api.get<{
        configured: boolean;
        connections: Array<{ provider: string }>;
        deliveries: Array<{ id: string; kind: string; state: string; error: string | null }>;
      }>("/career/integrations"),
    refetchInterval: 30000,
  });

  return (
    <Panel
      title="Email & Calendar Connections"
      description="Connect verified Google OAuth tokens with restricted send and schedule permissions"
      icon={Link2}
    >
      <div className="space-y-6">
        <PathwayLinks
          links={[
            { href: "/dashboard/profile", label: "Profile", detail: "Manage the professional identity connected to this workspace" },
            { href: "/dashboard/settings", label: "Settings", detail: "Review privacy, retention, and account controls" },
            { href: "/dashboard/notifications", label: "Notifications", detail: "See email and calendar delivery updates" },
          ]}
        />
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          <p>
            Google OAuth grants sending or calendar-event access only. Refresh tokens are encrypted at rest. No mailbox password or inbox reading access is collected.
          </p>
        </div>

        {q.data?.configured === false && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
            Google OAuth must be configured by an administrator before connections can be established.
          </div>
        )}

        {/* Providers */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(["mail", "calendar"] as const).map((p) => {
            const isConnected = q.data?.connections.some((c) => c.provider === `google-${p}`);
            return (
              <div
                key={p}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">
                    {p === "mail" ? <Mail className="size-4" /> : <Calendar className="size-4" />}
                  </span>
                  <div>
                    <p className="text-xs font-semibold capitalize text-foreground">Google {p}</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? "Connected & authorized" : "Not connected"}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api.post("/career/integrations/disconnect", { purpose: p });
                      })
                    }
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busy || !q.data?.configured}
                    onClick={() =>
                      void run(async () => {
                        const result = await api.post<{ url: string }>(
                          "/career/integrations/connect",
                          { purpose: p }
                        );
                        window.location.assign(result.url);
                      })
                    }
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Schedule event form */}
        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(async () => {
              await api.post("/career/calendar", {
                key: crypto.randomUUID(),
                summary: f.get("summary"),
                start: new Date(String(f.get("start"))).toISOString(),
                end: new Date(String(f.get("end"))).toISOString(),
                reviewed: true,
              });
              toast.success("Reviewed calendar event queued");
            });
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-violet-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Schedule or Review a Calendar Event
            </h3>
          </div>

          <Field label="Interview or Follow-up Title">
            <input
              name="summary"
              required
              placeholder="e.g. Technical Screen with Engineering Lead"
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start Time (Your Local Time)">
              <input type="datetime-local" name="start" required className={fieldClass} />
            </Field>

            <Field label="End Time (Your Local Time)">
              <input type="datetime-local" name="end" required className={fieldClass} />
            </Field>
          </div>

          <Button
            disabled={
              busy || !q.data?.connections.some((c) => c.provider === "google-calendar")
            }
            type="submit"
            className="bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
          >
            Create Reviewed Event
          </Button>
        </form>

        {/* Delivery Audit Log */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery Status Log
          </h4>
          {q.data?.deliveries.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent delivery activity.</p>
          ) : (
            <div className="space-y-2">
              {q.data?.deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        d.state === "SENT"
                          ? "bg-emerald-500"
                          : d.state === "FAILED"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="font-semibold capitalize text-foreground">{d.kind}</span>
                    <span className="text-muted-foreground">· State: {d.state}</span>
                  </div>
                  {d.error && <span className="text-rose-500 text-xs">{d.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
