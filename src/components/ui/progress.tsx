"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "violet",
}: {
  value: number;
  className?: string;
  tone?: "violet" | "amber" | "emerald" | "rose";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const tones: Record<typeof tone, string> = {
    violet: "bg-violet-600",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full origin-left transition-[width] duration-500 motion-reduce:transition-none", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
