// Admin dashboard landing — `/admin`.
//
// Server component shell that fetches the initial dashboard summary
// via the cookie-forwarding `adminApi` fetcher, then mounts a small
// `AdminDashboardClient` so the Refresh button, alerts panel and
// activity feed can re-query without a full route transition.
//
// Admin 2FA enforcement is intentionally out of scope for this card —
// that's an A-P19 concern covered separately. The role gate is
// enforced at the layout level (`app/admin/layout.tsx`) and again at
// the edge by `src/proxy.ts`.

import { redirect } from "next/navigation";

import { AdminDashboardClient } from "./_views/AdminDashboardClient";
import { adminApi, ServerApiError } from "@/lib/adminApi";
import type { AdminDashboardSummary } from "@/lib/hooks/useAdminDashboard";

export const dynamic = "force-dynamic";

const FALLBACK_SUMMARY: AdminDashboardSummary = {
  totalUsers: 0,
  activeUsersToday: 0,
  totalResumes: 0,
  aiCallsToday: 0,
  openSecurityAlerts: 0,
  stats: [],
  trends: [],
  activity: [],
  alerts: [],
  quickLinks: [
    {
      label: "User directory",
      href: "/admin/users",
      description: "Search, filter, and act on accounts",
    },
    {
      label: "Templates",
      href: "/admin/templates",
      description: "Manage resume templates and defaults",
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      description: "Usage, revenue, and ATS trends",
    },
    {
      label: "Platform settings",
      href: "/admin/settings",
      description: "Limits, sessions, and 2FA policy",
    },
  ],
  errors: [
    { section: "metrics", message: "Metrics are temporarily unavailable." },
    { section: "trends", message: "Trends are temporarily unavailable." },
    { section: "activity", message: "Activity is temporarily unavailable." },
    { section: "alerts", message: "Alerts are temporarily unavailable." },
  ],
  generatedAt: new Date().toISOString(),
};

export default async function AdminDashboardPage() {
  let summary: AdminDashboardSummary = FALLBACK_SUMMARY;
  let loadError: string | null = null;

  try {
    const result = await adminApi.get<AdminDashboardSummary>(
      "/admin/dashboard",
    );
    summary = result.data;
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 401) {
      // Admin session expired — kick to login so they can re-auth.
      redirect("/login?redirect=/admin");
    }
    if (err instanceof ServerApiError && err.code === "ADMIN_2FA_SETUP_REQUIRED") {
      redirect("/login/2fa/setup?redirect=/admin");
    }
    if (err instanceof ServerApiError && err.code === "ADMIN_2FA_VERIFICATION_REQUIRED") {
      redirect("/login?redirect=/admin&reason=2fa");
    }
    loadError =
      err instanceof Error ? err.message : "Failed to load dashboard.";
    // Keep the fallback summary so the chrome + quick-links still render.
  }

  return <AdminDashboardClient initial={summary} loadError={loadError} />;
}
