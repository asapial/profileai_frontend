"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** A failed load must never turn a replace-all profile editor into an empty draft. */
export function useProfileDraft<T>(path: string, initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.get<T>(path, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setDraft(data); })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load your profile.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, attempt]);

  return { draft, setDraft, loading, error, retry: () => {
    setLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  } };
}
