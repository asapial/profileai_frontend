"use client";

// Greeting header for `/dashboard`.
//
// Renders the user's first name, a time-of-day-specific greeting, and the
// real headline from the profile (if set). Keeps copy dense and friendly
// without leaning on a hard-coded greeting that ignores the user's data.

import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(full?: string | null): string {
  if (!full) return "there";
  const trimmed = full.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

export function GreetingHeader() {
  const { data, isLoading } = useDashboardSummary();
  const summary = data;
  const name = firstName(summary?.user?.name);
  const headline = summary?.profile?.headline;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {greetingFor(new Date())}
        {isLoading ? "," : name ? `, ${name}` : ","}
      </h1>
      <p className="text-sm text-muted-foreground">
        {headline
          ? headline
          : "Pick up where you left off, or start something new."}
      </p>
    </div>
  );
}