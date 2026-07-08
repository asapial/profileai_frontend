"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
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
  DRAFT: "bg-amber-100 text-amber-700",
  GENERATED: "bg-violet-100 text-violet-700",
  EXPORTED: "bg-emerald-100 text-emerald-700",
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

export function RecentResumesList() {
  const { data } = useDashboardSummary();
  const items = data?.recentResumes ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-500" />
            Recent resumes
          </CardTitle>
          <CardDescription>Pick up where you left off.</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="/resumes/new">
            <Plus className="h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No resumes yet. Create your first one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/resumes/${r.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-violet-600"
                >
                  {r.title}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[r.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {r.status.toLowerCase()}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(r.updatedAt)}
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