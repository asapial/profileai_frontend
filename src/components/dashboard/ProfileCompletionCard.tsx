"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

export function ProfileCompletionCard() {
  const { data, isLoading } = useDashboardSummary();
  const profile = data?.profile;

  const pct = profile?.completionPercentage ?? 0;
  const tone = pct >= 80 ? "emerald" : pct >= 50 ? "amber" : "rose";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-violet-500" />
            Profile completion
          </CardTitle>
          <CardDescription>
            Complete your profile to unlock better resume suggestions.
          </CardDescription>
        </div>
        <span className="text-2xl font-semibold tabular-nums">
          {isLoading ? "—" : `${pct}%`}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} tone={tone} />

        {profile?.missingFields?.length ? (
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {profile.missingFields.slice(0, 5).map((field) => (
              <li key={field} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                <span className="capitalize">
                  {field.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Your profile is complete.
          </p>
        )}

        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/profile">
            Edit profile
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}