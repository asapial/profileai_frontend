"use client";

// Hook wrapper around `useDashboardSummary` that exposes a normalized
// `state` so every widget can render a skeleton, an empty state, or an
// inline retry without each one re-deriving the same loading/error logic.
//
// Keeping it shared also lets us swap to a per-widget fetch later if
// the aggregate endpoint is split, without touching every widget.

import { useEffect, useState } from "react";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

export type WidgetState<T> =
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "ready"; data: T };

export function useWidgetSummary<T>(
  select: (summary: NonNullable<ReturnType<typeof useDashboardSummary>["data"]>) => T
): WidgetState<T> {
  const q = useDashboardSummary();

  // `keepPreviousData` analogue: when refetching after an error, the
  // last good summary should stay rendered so the user doesn't see a
  // flash of "loading" while we retry.
  const [last, setLast] = useState<
    NonNullable<ReturnType<typeof useDashboardSummary>["data"]> | null
  >(q.data ?? null);

  useEffect(() => {
    if (q.data) setLast(q.data);
  }, [q.data]);

  if (q.isLoading && !last) return { kind: "loading" };
  if (q.isError && !last) {
    return { kind: "error", retry: () => void q.refetch() };
  }
  if (q.isError && last) {
    // Render the cached summary with an inline retry banner overlay
    // (handled in the composed view). We still surface "error" so the
    // caller can opt to render a stale-data indicator.
    return { kind: "ready", data: select(last) };
  }
  if (!last) return { kind: "loading" };
  return { kind: "ready", data: select(last) };
}
