"use client";

// Client-side wrapper around the admin dashboard so the page header
// (title + refresh button) can be interactive without re-fetching on
// the server. The page itself fetches the initial summary via
// `adminApi` and passes it down as `initial`.

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCcw, FileSearch } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  ADMIN_DASHBOARD_QUERY_KEY,
  useAdminDashboard,
  type AdminDashboardSummary,
} from "@/lib/hooks/useAdminDashboard";

type Props = {
  initial: AdminDashboardSummary;
  loadError: string | null;
};

export function AdminDashboardClient({ initial, loadError }: Props) {
  const router = useRouter();
  const { refetch, isFetching } = useAdminDashboard();

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success("Dashboard refreshed.");
    } catch {
      toast.error("Couldn't refresh — try again in a moment.");
    }
  }, [refetch]);

  const handleForceRefresh = useCallback(() => {
    // Invalidate the QueryClient cache entry and re-render.
    router.refresh();
    handleRefresh();
  }, [router, handleRefresh]);

  if (loadError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Admin overview
          </h2>
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {loadError} Showing cached values until the service recovers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/audit-log">
              <FileSearch className="mr-1.5 h-3.5 w-3.5" />
              Audit log
            </Link>
          </Button>
          <Button size="sm" onClick={handleForceRefresh} disabled={isFetching}>
            <RefreshCcw
              className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const generatedAt = initial.generatedAt
    ? new Date(initial.generatedAt).toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Admin overview
        </h2>
        <p className="text-sm text-muted-foreground">
          {generatedAt
            ? `Last updated ${generatedAt}.`
            : "Real-time operational view."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/audit-log">
            <FileSearch className="mr-1.5 h-3.5 w-3.5" />
            Audit log
          </Link>
        </Button>
        <Button size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCcw
            className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      {/* Mark initial as read by the query client to keep the cache warm. */}
      <span className="sr-only" data-dashboard-key={ADMIN_DASHBOARD_QUERY_KEY.join("/")}>
        {initial.generatedAt}
      </span>
    </div>
  );
}
