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
          {atsData.methodologyVersion !== "evidence-v3.1" ? <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-200">Legacy score detected. Run ATS check to recalculate with evidence-v3.1.</div> : null}
          {atsData.analysisMode === "DETERMINISTIC_FALLBACK" ? <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-200"><span className="font-semibold">Limited analysis:</span> AI semantic analysis was unavailable. This score uses deterministic keyword, evidence, quality, parsing and completeness checks. Run it again later to upgrade to the full hybrid analysis.</div> : null}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Job alignment estimate</p>
            <ScoreBar score={atsData.atsScore} />
          </div>
          {atsData.scoreCeiling !== undefined && atsData.scoreCeiling < 100 ? <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Current score ceiling: {atsData.scoreCeiling}. Fix critical blockers before polishing keywords.</p> : null}
          {atsData.notice ? <p className="text-xs leading-relaxed text-muted-foreground">{atsData.notice}</p> : null}
          {atsData.criticalIssues?.length ? (
            <div className="space-y-2 rounded-xl border border-rose-300/50 bg-rose-500/5 p-3">
              <p className="text-xs font-semibold">Critical checks</p>
              {atsData.criticalIssues.map((issue) => <div key={issue.code} className="flex gap-2 text-xs"><span className={issue.severity === "HIGH" ? "font-semibold text-rose-600" : "font-semibold text-amber-600"}>{issue.severity}</span><span>{issue.message}</span></div>)}
            </div>
          ) : null}
          {atsData.topActions?.length ? (
            <div className="space-y-2 rounded-xl border border-violet-300/40 bg-violet-500/5 p-3">
              <p className="text-xs font-semibold">Highest-impact improvements</p>
              {atsData.topActions.slice(0, 5).map((action, index) => <div key={`${action.section}-${index}`} className="rounded-lg border border-border/60 bg-background/70 p-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{action.section}</span><span className="text-violet-700 dark:text-violet-300">up to +{action.potentialGain}</span></div><p className="mt-1 text-muted-foreground">{action.issue}</p><p className="mt-1">{action.action}</p></div>)}
              <p className="text-[10px] text-muted-foreground">Potential gains are rubric estimates, not guaranteed ATS or hiring outcomes.</p>
            </div>
          ) : null}
          {atsData.optimization ? (
            <div role="status" className="space-y-3 rounded-xl border border-violet-300/40 bg-violet-500/5 p-3">
              <p className="text-sm font-semibold">Enhancement: {atsData.optimization.beforeScore} → {atsData.optimization.afterScore}</p>
              <p className="text-xs text-muted-foreground">Compared using the same job requirements and scoring rules.</p>
              <p className="text-xs text-muted-foreground">Optimize already runs the score check. Running ATS again without further edits should show this same latest score.</p>
              {atsData.optimization.outcome === "AI_UNAVAILABLE" ? <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">AI rewriting did not complete. The score is not evidence that your wording was improved.</p> : null}
              {atsData.optimization.diagnostics ? <p className="text-xs text-muted-foreground">Wording changes: {atsData.optimization.diagnostics.proposed} proposed · {atsData.optimization.diagnostics.applied} applied after evidence checks.</p> : null}
              {atsData.optimization.diagnostics?.conservativeCorrections ? <p className="text-xs text-muted-foreground">{atsData.optimization.diagnostics.conservativeCorrections} applied changes use conservative wording rules that preserve your existing claims.</p> : null}
              {atsData.optimization.unchanged ? <p className="text-xs text-muted-foreground">The score is unchanged. Clearer wording alone may not improve job alignment; review the missing evidence below.</p> : null}
              <ul className="list-disc space-y-1 pl-4 text-xs">{atsData.optimization.changes.map((change, i) => <li key={i}>{change}</li>)}</ul>
              {atsData.optimization.warnings.map((warning, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
              {atsData.optimization.patches.length ? <details>
                <summary className="cursor-pointer text-xs font-semibold">Review wording changes ({atsData.optimization.patches.length})</summary>
                <div className="mt-2 max-h-80 space-y-3 overflow-y-auto">
                  {atsData.optimization.patches.map((patch) => <div key={patch.path} className="space-y-1 border-t border-border pt-2 text-xs">
                    <p className="font-medium">{patch.path.startsWith("summary") ? "Summary" : patch.path.startsWith("experience") ? "Experience bullet" : "Project description"}</p>
                    <p className="text-muted-foreground"><span className="font-medium">Before: </span>{patch.before}</p>
                    <p><span className="font-medium">After: </span>{patch.after}</p>
                  </div>)}
                </div>
              </details> : null}
              <p className="text-xs text-muted-foreground">Applied document changes can be restored from Version history. ATS Word exports use readable text with a simple layout.</p>
            </div>
          ) : null}
          {atsData.breakdown ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold">Hybrid score breakdown</p><span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{atsData.confidence ?? "MEDIUM"} confidence</span></div>
              <div className="space-y-2">
                {([
                  ["Requirement coverage", atsData.breakdown.requirementCoverage, `${atsData.weights?.requirementCoverage ?? 35}%`],
                  ["Evidence strength", atsData.breakdown.evidenceStrength, `${atsData.weights?.evidenceStrength ?? 25}%`],
                  ["Experience alignment", atsData.breakdown.experienceAlignment, `${atsData.weights?.experienceAlignment ?? 15}%`],
                  ["Content quality", atsData.breakdown.contentQuality, `${atsData.weights?.contentQuality ?? 10}%`],
                  ["Parsing safety", atsData.breakdown.parsingSafety, `${atsData.weights?.parsingSafety ?? 10}%`],
                  ["Completeness", atsData.breakdown.completeness, `${atsData.weights?.completeness ?? 5}%`],
                ] as const).filter(([, value]) => value !== undefined).map(([label, value, weight]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,1fr)_2rem_2rem] items-center gap-2 text-[11px]"><span className="truncate text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span><span className="text-right text-muted-foreground">{weight}</span></div>
                ))}
              </div>
            </div>
          ) : null}
          {atsData.qualitySignals ? <p className="text-[11px] text-muted-foreground">Bullet evidence: {atsData.qualitySignals.bullets} total · {atsData.qualitySignals.actionLed} action-led · {atsData.qualitySignals.quantified} quantified · {atsData.qualitySignals.outcomeLed} outcome-led{atsData.qualitySignals.experienceEntries !== undefined ? ` · ${atsData.qualitySignals.structuredExperience}/${atsData.qualitySignals.experienceEntries} roles structured` : ""}{atsData.penalties?.keywordStuffing ? ` · ${atsData.penalties.keywordStuffing}-point repetition penalty` : ""}</p> : null}
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
        disabled={loading || optimizing}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-60"
      >
        {loading && !optimizing ? (
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
      <p className="text-[10px] leading-relaxed text-muted-foreground">Checks proposed summary and bullet rewrites against your existing evidence, prioritizes skills, and compares scores using the same requirements. Unsupported rewrites are skipped. Uses up to three AI operations; if AI is unavailable, only conservative wording and formatting corrections are considered.</p>
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
