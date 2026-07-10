"use client";

// Critical alerts panel — surfaces platform-wide events that need an
// admin's attention (failed payments, security events, quota breaches).
// Lives at the top of the admin dashboard so it can't be missed.

import Link from "next/link";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdminAlert } from "@/lib/hooks/useAdminDashboard";

const tone = {
  info: {
    icon: Info,
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  warning: {
    icon: AlertTriangle,
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  critical: {
    icon: ShieldAlert,
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
} as const;

function timeAgo(iso?: string) {
  if (!iso) return "";
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function AdminAlertsPanel({ alerts }: { alerts: AdminAlert[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Critical alerts
          </CardTitle>
          <CardDescription>
            {alerts.length === 0
              ? "All clear — nothing needs your attention."
              : `${alerts.length} active item${alerts.length === 1 ? "" : "s"} requiring review.`}
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/security">Open security</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No critical alerts at the moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.slice(0, 5).map((a) => {
              const Icon = tone[a.level].icon;
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone[a.level].chip}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    {a.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {a.body}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
