"use client";

// Notification preview widget. Shows the three most recent notifications
// (per U-P1 spec) and links out to the full notification center.
// Clicking an item navigates to its `targetUrl` and marks it read in the
// background.

import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useMarkRead } from "@/lib/hooks/useNotifications";
import {
  WidgetCard,
  WidgetEmpty,
  WidgetError,
  WidgetSkeleton,
} from "./WidgetCard";

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
  const q = useDashboardSummary();
  const markRead = useMarkRead();

  if (q.isLoading) {
    return (
      <WidgetCard
        title={
          <>
            <Bell className="h-4 w-4 text-violet-500" />
            Notifications
          </>
        }
        description="Loading…"
        action={
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/notifications">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
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
            <Bell className="h-4 w-4 text-violet-500" />
            Notifications
          </>
        }
        description="Your latest alerts."
      >
        <WidgetError onRetry={() => void q.refetch()} />
      </WidgetCard>
    );
  }

  const items = (q.data?.notifications ?? []).slice(0, 3);
  const unread = q.data?.stats.unreadNotifications ?? 0;

  return (
    <WidgetCard
      title={
        <>
          <Bell className="h-4 w-4 text-violet-500" />
            Notifications
        </>
      }
      description={
        unread ? `${unread} unread` : "You’re all caught up."
      }
      action={
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/notifications">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <WidgetEmpty
          title="No notifications yet"
          description="We’ll surface alerts here as your account grows."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const href = n.link ?? "/dashboard/notifications";
            return (
              <li
                key={n.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${typeColors[n.type] ?? "bg-slate-400"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={href}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                      }}
                      className={
                        "truncate text-sm hover:text-violet-600 " +
                        (n.read ? "text-muted-foreground" : "font-medium")
                      }
                    >
                      {n.title}
                    </Link>
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
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}