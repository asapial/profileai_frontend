"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const GENERATE_MESSAGES = [
  "Analyzing your profile…",
  "Reading the job description…",
  "Structuring resume sections…",
  "Writing strong bullet points…",
  "Finalizing your resume…",
];

const ATS_MESSAGES = [
  "Reading your resume…",
  "Scanning the job description…",
  "Comparing keywords…",
  "Building suggestions…",
];

const AI_MODIFY_MESSAGES = [
  "Reading the section…",
  "Rewriting with AI…",
  "Polishing wording…",
];

/**
 * Friendly loading overlay used while AI is generating or modifying content.
 * Rotates messages every ~1.6s and supports an indeterminate progress bar.
 */
export function AiLoadingOverlay({
  open,
  variant = "generate",
  onCancel,
}: {
  open: boolean;
  variant?: "generate" | "ats" | "modify";
  onCancel?: () => void;
}) {
  const messages =
    variant === "ats"
      ? ATS_MESSAGES
      : variant === "modify"
        ? AI_MODIFY_MESSAGES
        : GENERATE_MESSAGES;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [open, messages.length]);

  if (!open) return null;

  const title =
    variant === "ats"
      ? "Scoring your resume"
      : variant === "modify"
        ? "Improving section"
        : "Generating resume";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-loading-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p id="ai-loading-title" className="text-sm font-semibold tracking-tight">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">
              This usually takes 10–30 seconds.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-[shimmer_2.4s_linear_infinite] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
          </div>
          <div className="relative h-5 overflow-hidden">
            {messages.map((m, i) => (
              <p
                key={m}
                className={`absolute inset-0 text-xs font-medium text-muted-foreground transition-all duration-500 ${
                  i === index
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                {m}
              </p>
            ))}
          </div>
        </div>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Loader2 className="hidden" /> Cancel
          </button>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}