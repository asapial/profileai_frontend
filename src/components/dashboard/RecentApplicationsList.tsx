"use client";

// Recent applications widget. The spec calls for "recent applications
// provide shortcuts" — link each row to the application detail page
// (U-P11) so the user can resume work without navigating the full
// tracker.

import Link from "next/link";
import { Briefcase, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import {
  WidgetCard,
  WidgetEmpty,
  WidgetError,
  WidgetSkeleton,
} from "./WidgetCard";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function RecentApplicationsList() {
  const q = useDashboardSummary();

  if (q.isLoading) {
    return (
      <WidgetCard
        title={
          <>
            <Briefcase className="h-4 w-4 text-fuchsia-500" />
            Recent applications
          </>
        }
        description="Track your job pipeline."
        action={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/jobs">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <WidgetSkeleton rows={3} />
      </WidgetCard>
    );
  }

  if (q.isError) {
    return (
      <WidgetCard
        title={
          <>
            <Briefcase className="h-4 w-4 text-fuchsia-500" />
            Recent applications
          </>
        }
        description="Track your job pipeline."
      >
        <WidgetError onRetry={() => void q.refetch()} />
      </WidgetCard>
    );
  }

  const items = q.data?.recentApplications ?? [];

  return (
    <WidgetCard
      title={
        <>
          <Briefcase className="h-4 w-4 text-fuchsia-500" />
          Recent applications
        </>
      }
      description="Track your job pipeline."
      action={
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/jobs">
            All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <WidgetEmpty
          title="Track your first application"
          description="Log where you&apos;ve applied so nothing slips through."
          cta={
            <Button asChild size="sm" className="mt-2 gap-1">
              <Link href="/dashboard/jobs">
                <Plus className="h-3.5 w-3.5" />
                Add application
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Link
                href={`/dashboard/applications/${a.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium hover:text-violet-600">
                  {a.role}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.company}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={a.status} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(a.appliedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
