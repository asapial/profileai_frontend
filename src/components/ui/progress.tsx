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
    violet: "bg-gradient-to-r from-violet-600 to-fuchsia-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500",
    rose: "bg-gradient-to-r from-rose-500 to-pink-500",
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
        className={cn("h-full transition-all duration-500", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
