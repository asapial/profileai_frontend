"use client";

import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

function timeAgo(iso?: string) {
  if (!iso) return "";
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const typeColors: Record<string, string> = {
  SYSTEM: "bg-slate-500",
  RESUME: "bg-violet-500",
  APPLICATION: "bg-fuchsia-500",
  BILLING: "bg-amber-500",
  SECURITY: "bg-rose-500",
};

export function NotificationsPreview() {
  const { data } = useDashboardSummary();
  const items = data?.notifications ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-500" />
            Notifications
          </CardTitle>
          <CardDescription>
            {data?.stats.unreadNotifications
              ? `${data.stats.unreadNotifications} unread`
              : "You're all caught up."}
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/notifications">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.slice(0, 5).map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${typeColors[n.type] ?? "bg-slate-400"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`truncate text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}