"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AtsResult } from "@/lib/hooks/useResumes";

type Props = {
  atsData: AtsResult | null;
  loading: boolean;
  onRun: () => Promise<unknown> | unknown;
};

export function AtsPanel({ atsData, loading, onRun }: Props) {
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
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Overall</p>
            <ScoreBar score={atsData.atsScore} />
          </div>
          {atsData.matchedKeywords?.length ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Matched keywords
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {atsData.matchedKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
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
                    className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700"
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