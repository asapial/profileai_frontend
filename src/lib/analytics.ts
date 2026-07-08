"use client";

/**
 * Lightweight, privacy-friendly client analytics.
 *
 * Posts a beacon to /api/analytics/event which the backend can persist to the
 * internal analytics table. Falls back silently if the endpoint is missing so
 * the page never breaks in dev or when analytics is disabled.
 */
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
};

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify({
      ...event,
      path: window.location.pathname,
      ts: Date.now(),
    });

    const url = "/api/analytics/event";
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback for older browsers.
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        /* swallow — analytics is best-effort */
      });
    }
  } catch {
    /* never let analytics break the page */
  }
}
