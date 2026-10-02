"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import type { AtsResult } from "@/lib/hooks/useResumes";

type Props = {
  atsData: AtsResult | null;
  loading: boolean;
  onRun: () => Promise<unknown> | unknown;
  onOptimize: () => Promise<unknown> | unknown;
  optimizing: boolean;
};

export function AtsPanel({ atsData, loading, onRun, onOptimize, optimizing }: Props) {
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleRun() {
    setErrMsg(null);
    try {
      await onRun();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "ATS check failed.");
    }
  }

  const tone =
    atsData && atsData.atsScore >= 80
      ? "emerald"
      : atsData && atsData.atsScore >= 60
        ? "amber"
        : "rose";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {atsData && atsData.atsScore >= 60 ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold">ATS Check</h3>
        </div>
        {atsData ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
              tone === "emerald"
                ? "bg-emerald-100 text-emerald-700"
                : tone === "amber"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            Score {atsData.atsScore}
          </span>
        ) : null}
      </header>

      {atsData ? (
        <div className="space-y-3">
          {atsData.analysisMode === "DETERMINISTIC_FALLBACK" ? <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-200"><span className="font-semibold">Limited analysis:</span> AI semantic analysis was unavailable. This score uses deterministic keyword, evidence, quality, parsing and completeness checks. Run it again later to upgrade to the full hybrid analysis.</div> : null}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Overall</p>
            <ScoreBar score={atsData.atsScore} />
          </div>
          {atsData.breakdown ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold">Hybrid score breakdown</p><span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{atsData.confidence ?? "MEDIUM"} confidence</span></div>
              <div className="space-y-2">
                {([
                  ["Requirement coverage", atsData.breakdown.requirementCoverage, "30%"],
                  ["Evidence strength", atsData.breakdown.evidenceStrength, "25%"],
                  ["Semantic relevance", atsData.breakdown.semanticRelevance, "15%"],
                  ["Experience alignment", atsData.breakdown.experienceAlignment, "10%"],
                  ["Content quality", atsData.breakdown.contentQuality, "10%"],
                  ["Parsing safety", atsData.breakdown.parsingSafety, "5%"],
                  ["Completeness", atsData.breakdown.completeness, "5%"],
                ] as const).map(([label, value, weight]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,1fr)_2rem_2rem] items-center gap-2 text-[11px]"><span className="truncate text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span><span className="text-right text-muted-foreground">{weight}</span></div>
                ))}
              </div>
            </div>
          ) : null}
          {atsData.requirements?.length ? (
            <details className="rounded-xl border border-border/70 bg-background/60 p-3">
              <summary className="cursor-pointer text-xs font-semibold">Requirement evidence map ({atsData.requirements.filter((item) => item.matched).length}/{atsData.requirements.length})</summary>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {atsData.requirements.map((item) => <div key={`${item.label}-${item.priority}`} className="rounded-lg border border-border/60 p-2 text-[11px]"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{item.label}</span><span className={item.matched ? "text-emerald-600" : "text-rose-600"}>{item.matched ? `${item.matchType} · ${item.matchConfidence}%` : "Missing"}</span></div>{item.evidence ? <p className="mt-1 line-clamp-2 text-muted-foreground">{item.evidenceSection}: {item.evidence}</p> : null}</div>)}
              </div>
            </details>
          ) : null}
          {atsData.matchedKeywords?.length ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Matched keywords
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {atsData.matchedKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {atsData.missingKeywords?.length ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Missing keywords
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {atsData.missingKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {atsData.suggestions?.length ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Suggestions
              </p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {atsData.suggestions.map((s, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">
                      {s.section}:
                    </span>{" "}
                    {s.issue} — {s.suggestion}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running ATS check…
          </>
        ) : (
          "Run ATS check"
        )}
      </button>
      <button type="button" onClick={() => void onOptimize()} disabled={loading || optimizing} className="flex w-full items-center justify-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 disabled:opacity-60 dark:text-violet-300">
        {optimizing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Optimizing document…</> : <><Sparkles className="h-3.5 w-3.5" /> Optimize for ATS</>}
      </button>
      <p className="text-[10px] leading-relaxed text-muted-foreground">Creates a restorable version, prioritizes relevant skills, cleans section formatting, applies an ATS-safe template, and checks the score again. It never invents qualifications.</p>
      {errMsg ? <p className="text-xs text-rose-600">{errMsg}</p> : null}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all ${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}
