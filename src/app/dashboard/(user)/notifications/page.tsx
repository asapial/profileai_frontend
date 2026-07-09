"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Filter,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useDeleteNotification,
  useInfiniteNotifications,
  useMarkAllRead,
  useMarkRead,
} from "@/lib/hooks/useNotifications";

const TYPE_TONE: Record<string, string> = {
  SYSTEM: "bg-slate-100 text-slate-700",
  RESUME: "bg-violet-100 text-violet-700",
  APPLICATION: "bg-emerald-100 text-emerald-700",
  BILLING: "bg-amber-100 text-amber-700",
  SECURITY: "bg-rose-100 text-rose-700",
};

const TYPE_LABEL: Record<string, string> = {
  SYSTEM: "System",
  RESUME: "Resume",
  APPLICATION: "Application",
  BILLING: "Billing",
  SECURITY: "Security",
};

const PAGE_SIZE = 25;

export default function NotificationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteNotifications({ limit: PAGE_SIZE });

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const remove = useDeleteNotification();

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );
  // The server keeps a stable unreadCount on every page; the last page is
  // the most up-to-date snapshot.
  const unreadCount = data?.pages.at(-1)?.unreadCount ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.body ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  function handleClick(id: string, link: string | null, read: boolean) {
    if (!read) markRead.mutate(id);
    if (link) router.push(link);
  }

  function handleMarkAll() {
    markAllRead.mutate(undefined, {
      onSuccess: (res) =>
        toast.success(
          res.updated > 0
            ? `Marked ${res.updated} as read.`
            : "All caught up."
        ),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not update."),
    });
  }

  function handleDelete(id: string) {
    setPendingDeleteId(id);
    remove.mutate(id, {
      onSettled: () => setPendingDeleteId(null),
      onSuccess: () => toast.success("Notification removed."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed."),
    });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account activity, resume updates, billing alerts, and security
            pings in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            <Bell className="h-3.5 w-3.5" />
            {unreadCount} unread
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="gap-1.5"
          >
            {markAllRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/dashboard/profile/notifications">Preferences</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Inbox</CardTitle>
            <div className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
              {isFetching && !isFetchingNextPage ? (
                <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or body"
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Client-side filter
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(search.trim())}
              onClear={() => setSearch("")}
            />
          ) : (
            <>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {filtered.map((n) => (
                  <li
                    key={n.id}
                    className={`group flex items-start gap-3 px-4 py-3 transition ${
                      n.read ? "bg-background" : "bg-violet-50/40"
                    } hover:bg-muted/50`}
                  >
                    <button
                      type="button"
                      onClick={() => handleClick(n.id, n.link, n.read)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          TYPE_TONE[n.type] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {n.title}
                          </span>
                          {!n.read ? (
                            <span
                              aria-label="Unread"
                              className="h-2 w-2 shrink-0 rounded-full bg-violet-500"
                            />
                          ) : null}
                        </span>
                        {n.body ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                          {formatRelative(n.createdAt)}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      {!n.read ? (
                        <button
                          type="button"
                          aria-label="Mark as read"
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Delete notification"
                        onClick={() => handleDelete(n.id)}
                        disabled={pendingDeleteId === n.id && remove.isPending}
                        className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {hasNextPage ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="gap-2"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Load older
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({
  hasSearch,
  onClear,
}: {
  hasSearch: boolean;
  onClear: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      {hasSearch ? (
        <BellOff className="h-8 w-8 text-muted-foreground" />
      ) : (
        <Bell className="h-8 w-8 text-violet-500" />
      )}
      <h3 className="mt-3 text-base font-semibold">
        {hasSearch ? "Nothing matches" : "You're all caught up"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasSearch
          ? "Try clearing your filters to see older items."
          : "Resume exports, application updates, and billing alerts will show up here."}
      </p>
      {hasSearch ? (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear search
        </Button>
      ) : null}
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.round(diff / minute)}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}
