"use client";

// Admin activity feed — most recent admin-relevant events across the
// platform (user signups, role changes, template updates, etc.).
// Rendered below the stat cards on the admin dashboard.

import Link from "next/link";
import { Activity } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdminActivityItem } from "@/lib/hooks/useAdminDashboard";

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

export function AdminActivityFeed({ items }: { items: AdminActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-500" />
            Activity feed
          </CardTitle>
          <CardDescription>
            Latest events across users, templates, and billing.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/audit-log">View audit log</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.slice(0, 10).map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">
                      {it.actor.name ?? it.actor.id}
                    </span>{" "}
                    <span className="text-muted-foreground">{it.action}</span>{" "}
                    {it.target ? (
                      <span className="font-medium">{it.target}</span>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {timeAgo(it.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
