"use client";

// Profile completeness widget. Owns:
//   - top-level percentage display
//   - list of specific missing fields (per U-P1 "lists the specific missing sections")
//   - onboarding CTA when the profile is completely empty
//
// Why this is a separate piece rather than the greeting: the spec calls
// out a dedicated "completeness meter lists the specific missing
// sections" widget, distinct from the greeting band at the top.

import Link from "next/link";
import { ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import {
  WidgetCard,
  WidgetEmpty,
  WidgetError,
  WidgetSkeleton,
} from "./WidgetCard";

function humanize(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

export function ProfileCompletionCard() {
  const q = useDashboardSummary();

  if (q.isLoading) {
    return (
      <WidgetCard
        title={
          <>
            <UserRound className="h-4 w-4 text-violet-500" />
            Profile completion
          </>
        }
        description="Complete your profile to unlock better resume suggestions."
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
            <UserRound className="h-4 w-4 text-violet-500" />
            Profile completion
          </>
        }
        description="Complete your profile to unlock better resume suggestions."
      >
        <WidgetError onRetry={() => void q.refetch()} />
      </WidgetCard>
    );
  }

  const profile = q.data?.profile;
  const pct = profile?.completionPercentage ?? 0;
  const missing = profile?.missingFields ?? [];
  const tone = pct >= 80 ? "emerald" : pct >= 50 ? "amber" : "rose";
  const empty =
    pct === 0 &&
    (profile?.skillsCount ?? 0) === 0 &&
    (profile?.experienceCount ?? 0) === 0 &&
    (profile?.educationCount ?? 0) === 0;

  return (
    <WidgetCard
      title={
        <>
          <UserRound className="h-4 w-4 text-violet-500" />
          Profile completion
        </>
      }
      description="Complete your profile to unlock better resume suggestions."
      action={
        <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
      }
    >
      <div className="space-y-4">
        <div className="sr-only" aria-live="polite">
          Profile {pct}% complete
        </div>
        <Progress value={pct} tone={tone} />

        {empty ? (
          <WidgetEmpty
            title="Start your profile"
            description="Add a headline, skills, and at least one experience to unlock tailored AI drafts."
            cta={
              <Button asChild size="sm" className="mt-2 gap-1">
                <Link href="/profile">
                  Open profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
        ) : missing.length > 0 ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Missing sections
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {missing.slice(0, 6).map((field) => (
                <li key={field} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  <span>{humanize(field)}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/profile">
                Edit profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Your profile is complete.
          </p>
        )}
      </div>
    </WidgetCard>
  );
}