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
    <ol className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 xl:block xl:space-y-1 xl:overflow-visible xl:pb-0">
      {steps.map((step, i) => {
        const isCurrent = i === currentIndex;
        const isComplete = completedIds.includes(step.id) || i < currentIndex;
        const clickable = Boolean(onStepClick) && (isComplete || i === currentIndex);

        return (
          <li key={step.id} className="min-w-[9.5rem] snap-start xl:min-w-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              className={cn(
                "group flex h-full w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition xl:items-start xl:gap-3 xl:rounded-lg xl:p-3",
                clickable
                  ? "cursor-pointer hover:bg-accent"
                  : "cursor-not-allowed",
                isCurrent && "bg-violet-50/70 dark:bg-violet-950/20"
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition xl:mt-0.5",
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
                  <span className="mt-0.5 hidden text-xs text-muted-foreground xl:block">
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
