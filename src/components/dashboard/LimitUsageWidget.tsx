"use client";

// Plan-usage widget. Renders the resume + AI usage meters and surfaces
// the spec-mandated warning state at 80%+ AI usage ("warning before I hit
// it"). The widget intentionally does not block actions itself; the
// QuickActionTiles handle disabled states with tooltips.

import Link from "next/link";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import {
  WidgetCard,
  WidgetError,
  WidgetSkeleton,
} from "./WidgetCard";

function formatReset(resetAt?: string) {
  if (!resetAt) return "";
  try {
    return new Date(resetAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function LimitUsageWidget() {
  const q = useDashboardSummary();

  if (q.isLoading) {
    return (
      <WidgetCard
        title={
          <>
            <TrendingUp className="h-4 w-4 text-fuchsia-500" />
            Plan usage
          </>
        }
        description="Loading usage…"
      >
        <WidgetSkeleton rows={4} />
      </WidgetCard>
    );
  }

  if (q.isError) {
    return (
      <WidgetCard
        title={
          <>
            <TrendingUp className="h-4 w-4 text-fuchsia-500" />
            Plan usage
          </>
        }
        description="Resets monthly."
      >
        <WidgetError onRetry={() => void q.refetch()} />
      </WidgetCard>
    );
  }

  const limits = q.data?.limits;
  const resumePercent = limits?.resumePercent ?? 0;
  const apiPercent = limits?.apiPercent ?? 0;
  const resumeTone =
    resumePercent >= 90 ? "rose" : resumePercent >= 70 ? "amber" : "violet";
  const apiTone =
    apiPercent >= 90 ? "rose" : apiPercent >= 70 ? "amber" : "emerald";

  const showUpgradePrompt = apiPercent >= 80;

  return (
    <WidgetCard
      title={
        <>
          <TrendingUp className="h-4 w-4 text-fuchsia-500" />
          Plan usage
        </>
      }
      description={`Resets ${formatReset(limits?.resetAt)}`}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Resumes</span>
            <span className="tabular-nums text-muted-foreground">
              <span aria-hidden>{limits?.resumeUsed ?? 0}</span>
              <span className="sr-only">
                {limits?.resumeUsed ?? 0} of {limits?.resumeLimit ?? 0} resumes used
              </span>{" "}
              / {limits?.resumeLimit ?? 0}
            </span>
          </div>
          <Progress value={resumePercent} tone={resumeTone} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">AI generation credits</span>
            <span className="tabular-nums text-muted-foreground">
              <span aria-hidden>{limits?.apiUsed ?? 0}</span>
              <span className="sr-only">
                {limits?.apiUsed ?? 0} of {limits?.apiLimit ?? 0} AI credits used
              </span>{" "}
              / {limits?.apiLimit ?? 0}
            </span>
          </div>
          <Progress value={apiPercent} tone={apiTone} />
        </div>

        {showUpgradePrompt ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-amber-900">
                You&apos;re approaching your AI limit
              </p>
              <p className="text-xs text-amber-800">
                You&apos;ve used {apiPercent}% of this month&apos;s AI credits.
                Upgrade now so you&apos;re not blocked mid-task.
              </p>
              <Button
                asChild
                size="sm"
                variant="default"
                className="mt-1 gap-1"
              >
                <Link href="/pricing">
                  Upgrade plan
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Upgrade plan
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </WidgetCard>
  );
}