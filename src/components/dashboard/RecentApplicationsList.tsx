"use client";

import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

const statusStyles: Record<string, string> = {
  APPLIED: "bg-violet-100 text-violet-700",
  INTERVIEW: "bg-amber-100 text-amber-700",
  OFFER: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

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
  const { data } = useDashboardSummary();
  const items = data?.recentApplications ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-fuchsia-500" />
            Recent applications
          </CardTitle>
          <CardDescription>Track your job pipeline.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/applications">
            All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No applications tracked yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.role}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.company}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[a.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {a.status.toLowerCase()}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(a.appliedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}