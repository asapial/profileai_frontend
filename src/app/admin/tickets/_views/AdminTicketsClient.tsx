"use client";

// Admin Support Tickets (A-P11).
//
// Two-pane: list on left (filters + table), detail on right (thread +
// reply + status transitions). Detail state is local since URL routing
// is preferable but kept simple — admin clicks a row to focus.

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  IconCheck,
  IconClock,
  IconSearch,
  IconSend,
  IconTicket,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminTicketDetail,
  useAdminTickets,
  useReplyToTicket,
  useTransitionTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/hooks/useAdminTickets";

const STATUSES: Array<TicketStatus | "ALL"> = ["ALL", "OPEN", "PENDING", "CLOSED"];

export function AdminTicketsClient() {
  const [status, setStatus] = useState<TicketStatus | "ALL">("OPEN");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: list, isLoading } = useAdminTickets({ status, q });
  const items = useMemo(() => list ?? [], [list]);

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
        <p className="text-muted-foreground text-sm">
          Triage user-submitted tickets. Reply in-thread; close when
          resolved.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="flex flex-col">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search subject or user"
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TicketStatus | "ALL")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 p-12 text-center text-sm">
              <IconTicket className="size-10" />
              Nothing in this view.
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((t) => (
                <li
                  key={t.id}
                  className={`cursor-pointer border-b p-3 transition hover:bg-muted/50 ${
                    selectedId === t.id ? "bg-muted/40" : ""
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 font-medium">
                      {t.subject}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {t.preview}
                  </div>
                  <div className="text-muted-foreground mt-2 flex items-center justify-between text-[10px]">
                    <span>{t.user.name ?? t.user.email}</span>
                    <span>
                      <IconClock className="mr-1 inline size-3" />
                      {formatDistanceToNow(new Date(t.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <TicketDetail id={selectedId} />
      </div>
    </div>
  );
}

function TicketDetail({ id }: { id: string | null }) {
  const { data, isLoading } = useAdminTicketDetail(id);
  const reply = useReplyToTicket(id ?? "");
  const transition = useTransitionTicket(id ?? "");
  const [body, setBody] = useState("");

  if (!id) {
    return (
      <Card className="flex items-center justify-center p-12 text-sm">
        Select a ticket to view the thread.
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-2 h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  async function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await reply.mutateAsync(trimmed);
      setBody("");
      toast.success("Reply sent.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Send failed.");
    }
  }

  async function move(next: TicketStatus) {
    try {
      await transition.mutateAsync(next);
      toast.success(`Ticket marked ${next.toLowerCase()}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Transition failed.");
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{data.subject}</h2>
            <PriorityBadge priority={data.priority} />
          </div>
          <p className="text-muted-foreground text-xs">
            {data.user.name ?? data.user.email} · {data.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.status !== "PENDING" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => move("PENDING")}
              disabled={transition.isPending}
            >
              <IconClock className="mr-1.5 size-4" />
              Mark pending
            </Button>
          ) : null}
          {data.status !== "CLOSED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => move("CLOSED")}
              disabled={transition.isPending}
            >
              <IconCheck className="mr-1.5 size-4" />
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => move("OPEN")}
              disabled={transition.isPending}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3 p-4">
        {data.messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No messages in this thread yet.
          </p>
        ) : (
          data.messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 rounded-md border p-3 ${
                m.authorRole === "ADMIN"
                  ? "border-primary/30 bg-primary/5"
                  : "bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {m.authorName}
                  <Badge
                    variant="outline"
                    className="ml-2 text-[10px]"
                  >
                    {m.authorRole.toLowerCase()}
                  </Badge>
                </span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(m.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{m.body}</p>
            </div>
          ))
        )}
      </div>
      <Separator />
      <div className="flex flex-col gap-2 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[10px]">
            Replies are sent from{" "}
            <code>support@profileai.app</code> by default.
          </span>
          <Button
            size="sm"
            onClick={send}
            disabled={reply.isPending || body.trim().length === 0}
          >
            <IconSend className="mr-1.5 size-4" />
            {reply.isPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case "URGENT":
      return <Badge variant="destructive">Urgent</Badge>;
    case "HIGH":
      return <Badge>High</Badge>;
    case "NORMAL":
      return <Badge variant="secondary">Normal</Badge>;
    case "LOW":
      return <Badge variant="outline">Low</Badge>;
  }
}
