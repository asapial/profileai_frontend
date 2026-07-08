"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

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
  const { data } = useDashboardSummary();
  const limits = data?.limits;

  const resumeTone =
    (limits?.resumePercent ?? 0) >= 90
      ? "rose"
      : (limits?.resumePercent ?? 0) >= 70
        ? "amber"
        : "violet";
  const apiTone =
    (limits?.apiPercent ?? 0) >= 90
      ? "rose"
      : (limits?.apiPercent ?? 0) >= 70
        ? "amber"
        : "emerald";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-fuchsia-500" />
          Plan usage
        </CardTitle>
        <CardDescription>
          Resets {formatReset(limits?.resetAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Resumes</span>
            <span className="tabular-nums text-muted-foreground">
              {limits?.resumeUsed ?? 0} / {limits?.resumeLimit ?? 0}
            </span>
          </div>
          <Progress value={limits?.resumePercent ?? 0} tone={resumeTone} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">AI generation credits</span>
            <span className="tabular-nums text-muted-foreground">
              {limits?.apiUsed ?? 0} / {limits?.apiLimit ?? 0}
            </span>
          </div>
          <Progress value={limits?.apiPercent ?? 0} tone={apiTone} />
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          Upgrade plan
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}