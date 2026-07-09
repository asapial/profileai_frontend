"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  label: string;
  description?: string;
};

export function WizardStepper({
  steps,
  currentIndex,
  completedIds = [],
  onStepClick,
}: {
  steps: WizardStep[];
  currentIndex: number;
  completedIds?: string[];
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="space-y-1">
      {steps.map((step, i) => {
        const isCurrent = i === currentIndex;
        const isComplete = completedIds.includes(step.id) || i < currentIndex;
        const clickable = Boolean(onStepClick) && (isComplete || i === currentIndex);

        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg p-3 text-left transition",
                clickable
                  ? "cursor-pointer hover:bg-accent"
                  : "cursor-not-allowed",
                isCurrent && "bg-violet-50/70 dark:bg-violet-950/20"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition",
                  isComplete
                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow"
                    : isCurrent
                      ? "border-2 border-violet-500 bg-background text-violet-600"
                      : "border border-border bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {step.description}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}