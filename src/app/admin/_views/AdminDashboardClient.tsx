"use client";

import { useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, FileSearch, RefreshCcw, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { AdminAlertsPanel } from "@/components/admin/AdminAlertsPanel";
import { AdminQuickLinks } from "@/components/admin/AdminQuickLinks";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminTrendChart } from "@/components/admin/AdminTrendChart";
import { Button } from "@/components/ui/button";
import {
  useAdminDashboard,
  type AdminAlert,
  type AdminDashboardSummary,
} from "@/lib/hooks/useAdminDashboard";

type Props = { initial: AdminDashboardSummary; loadError: string | null };
type Section = AdminDashboardSummary["errors"][number]["section"];

function CriticalAlertBanner({ alerts }: { alerts: AdminAlert[] }) {
  const critical = alerts.find((alert) => alert.level === "critical");
  if (!critical) return null;
  return (
    <div
      role="alert"
      className="mx-4 flex flex-col gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-950 sm:flex-row sm:items-center sm:justify-between lg:mx-6 dark:text-rose-100"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-rose-500/15 p-2"><ShieldAlert className="size-5" /></span>
        <div>
          <p className="font-semibold">{critical.title}</p>
          {critical.body ? <p className="mt-0.5 text-sm opacity-80">{critical.body}</p> : null}
        </div>
      </div>
      <Button asChild size="sm" variant="outline"><Link href="/admin/security">Review alert</Link></Button>
    </div>
  );
}

function SectionError({ section, errors }: { section: Section; errors: AdminDashboardSummary["errors"] }) {
  const error = errors.find((item) => item.section === section);
  if (!error) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
      <AlertTriangle className="size-3.5" /> {error.message}
    </div>
  );
}

export function AdminDashboardClient({ initial, loadError }: Props) {
  const query = useAdminDashboard(initial);
  const summary = query.data ?? initial;

  const handleRefresh = useCallback(async () => {
    try {
      await query.refetch({ throwOnError: true });
      toast.success("Dashboard refreshed.");
    } catch {
      toast.error("Couldn't refresh — the last good values are still shown.");
    }
  }, [query]);

  const generatedAt = new Date(summary.generatedAt).toLocaleString(undefined, {
    hour: "2-digit", minute: "2-digit", month: "short", day: "numeric",
  });

  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Admin overview</h1>
          <p className={loadError ? "text-sm text-rose-600 dark:text-rose-400" : "text-sm text-muted-foreground"}>
            {loadError ? `${loadError} Showing the last available values.` : `Last updated ${generatedAt}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/audit-log"><FileSearch className="mr-1.5 size-3.5" />Audit log</Link>
          </Button>
          <Button size="sm" onClick={handleRefresh} disabled={query.isFetching}>
            <RefreshCcw className={`mr-1.5 size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <CriticalAlertBanner alerts={summary.alerts} />

      <section className="px-4 lg:px-6" aria-label="Platform metrics">
        <SectionError section="metrics" errors={summary.errors} />
        <AdminStatCards stats={summary.stats} />
      </section>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <section className="lg:col-span-2" aria-label="Platform trends">
          <SectionError section="trends" errors={summary.errors} />
          <AdminTrendChart data={summary.trends} />
        </section>
        <section aria-label="Security alerts">
          <SectionError section="alerts" errors={summary.errors} />
          <AdminAlertsPanel alerts={summary.alerts} />
        </section>
      </div>

      <section className="px-4 lg:px-6" aria-label="Recent activity">
        <SectionError section="activity" errors={summary.errors} />
        <AdminActivityFeed items={summary.activity} />
      </section>

      <section aria-label="Quick links"><AdminQuickLinks links={summary.quickLinks} /></section>
    </div>
  );
}
