"use client";

/**
 * Lightweight client analytics for spec-mandated events.
 *
 * The backend already records server-side audit/usage events, but several
 * pages (dashboard, resume editor, billing, …) call out UI-level events
 * like `dashboard_view` and `dashboard_quick_action_click` that should be
 * captured client-side. We POST them to a single endpoint that the backend
 * can no-op or persist; failures are intentionally swallowed because
 * analytics must never break a user flow.
 */
export type AnalyticsEventName =
  | "dashboard_view"
  | "dashboard_quick_action_click"
  | "profile_tab_view"
  | "profile_save"
  | "template_gallery_view"
  | "resume_generate_click"
  | "resume_editor_open"
  | "resume_export_click";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      name: event.name,
      properties: event.properties ?? {},
      path: window.location.pathname,
      ts: Date.now(),
    });
    // `keepalive` lets the request outlive a navigation, which matters
    // when the user clicks a quick-action tile and immediately leaves
    // the dashboard.
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      credentials: "include",
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}
