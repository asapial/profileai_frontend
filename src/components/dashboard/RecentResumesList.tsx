"use client";

// Recent resumes widget. Shows the five most recently updated resumes
// (per U-P1 AC: "the five most recently updated resumes appear with a
// direct edit link"). Onboarding empty state nudges first-time users
// toward the wizard instead of dead-ending.

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
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

export function RecentResumesList() {
  const q = useDashboardSummary();

  if (q.isLoading) {
    return (
      <WidgetCard
        title={
          <>
            <FileText className="h-4 w-4 text-violet-500" />
            Recent resumes
          </>
        }
        description="Pick up where you left off."
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
            <FileText className="h-4 w-4 text-violet-500" />
            Recent resumes
          </>
        }
        description="Pick up where you left off."
      >
        <WidgetError onRetry={() => void q.refetch()} />
      </WidgetCard>
    );
  }

  const items = q.data?.recentResumes ?? [];

  return (
    <WidgetCard
      title={
        <>
          <FileText className="h-4 w-4 text-violet-500" />
          Recent resumes
        </>
      }
      description="Pick up where you left off."
      action={
        <Button asChild size="sm" className="gap-1">
          <Link href="/resume/create">
            <Plus className="h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <WidgetEmpty
          title="Create your first resume"
          description="Start from a template and let AI draft your content."
          cta={
            <Button asChild size="sm" className="mt-2 gap-1">
              <Link href="/resume/create">
                <Plus className="h-3.5 w-3.5" />
                Start a resume
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.slice(0, 5).map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Link
                href={`/dashboard/resume/${r.id}/edit`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:text-violet-600"
              >
                {r.title}
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={r.status} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(r.updatedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
