"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadCount } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";

/**
 * Header bell badge. Polls the unread-count endpoint on a 60s cadence
 * so the badge stays in sync with backend writes without forcing the user
 * to refresh. Click navigates to the full inbox page.
 */
export function NotificationsBell({
  href = "/dashboard/notifications",
}: {
  href?: string;
}) {
  const { data } = useUnreadCount();
  const count = data?.unreadCount ?? 0;

  return (
    <Link
      href={href}
      aria-label={`Notifications (${count} unread)`}
      className="relative inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Bell className="h-4 w-4" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-violet-600 px-1 text-xs font-semibold leading-[1.4] text-white ring-2 ring-background",
            count > 99 && "px-1.5"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
