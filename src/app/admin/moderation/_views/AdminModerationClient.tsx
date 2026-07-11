"use client";

// Admin Content Moderation Queue (A-P10).
//
// Lists flagged resumes / share links / comments with bulk
// approve / reject, plus per-item "remove and notify author" flow.
// Backend endpoint isn't live yet — graceful empty state.

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  IconCheck,
  IconEye,
  IconFlag,
  IconSearch,
  IconShieldOff,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useAdminModeration,
  useResolveModerationItem,
  type ModerationItem,
  type ModerationItemKind,
  type ModerationItemStatus,
} from "@/lib/hooks/useAdminModeration";

const STATUSES: Array<ModerationItemStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REMOVED",
];
const KINDS: Array<ModerationItemKind | "ALL"> = [
  "ALL",
  "RESUME",
  "SHARE_LINK",
  "COMMENT",
];

export function AdminModerationClient() {
  const [status, setStatus] = useState<ModerationItemStatus | "ALL">(
    "PENDING",
  );
  const [kind, setKind] = useState<ModerationItemKind | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{
    item: ModerationItem;
    action: ModerationItemStatus;
  } | null>(null);

  const { data, isLoading } = useAdminModeration({ status, kind, q });
  const items = useMemo(() => data ?? [], [data]);

  const resolve = useResolveModerationItem();

  async function act(item: ModerationItem, action: ModerationItemStatus) {
    try {
      await resolve.mutateAsync({ id: item.id, action });
      toast.success(
        action === "APPROVED"
          ? "Approved."
          : action === "REJECTED"
            ? "Rejected."
            : "Removed.",
      );
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAct(action: ModerationItemStatus) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    for (const id of ids) {
      const item = items.find((i) => i.id === id);
      if (item) await act(item, action);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Moderation queue
          </h1>
          <p className="text-muted-foreground text-sm">
            Review flagged resumes, share links, and comments. Approve to
            restore; reject to remove and notify the author.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => bulkAct("APPROVED")}
          >
            <IconCheck className="mr-1.5 size-4" />
            Approve ({selected.size})
          </Button>
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => bulkAct("REJECTED")}
          >
            <IconX className="mr-1.5 size-4" />
            Reject
          </Button>
          <Button
            variant="destructive"
            disabled={selected.size === 0}
            onClick={() => bulkAct("REMOVED")}
          >
            <IconTrash className="mr-1.5 size-4" />
            Remove
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs">Search</div>
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, author, or reporter"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs">Status</div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
            >
              <SelectTrigger>
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
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs">Type</div>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as typeof kind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k.toLowerCase().replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <IconShieldOff className="text-muted-foreground size-10" />
            <p className="text-sm">No items in this queue.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(it.id)}
                      onChange={() => toggle(it.id)}
                      aria-label={`Select ${it.title}`}
                      className="size-4 accent-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{it.title}</span>
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        by {it.author.name ?? it.author.id} ·{" "}
                        {it.preview}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{it.kind.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {it.reportedBy?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{it.reportCount}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(it.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={it.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <IconEye className="size-4" />
                      </Button>
                      {it.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirm({ item: it, action: "APPROVED" })}
                          >
                            <IconCheck className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirm({ item: it, action: "REMOVED" })}
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Separator />

      <AdminConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title={
          confirm?.action === "APPROVED"
            ? "Approve this item?"
            : confirm?.action === "REJECTED"
              ? "Reject this item?"
              : "Remove and notify author?"
        }
        description={
          confirm ? (
            <>
              <p className="font-medium">{confirm.item.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {confirm.item.preview}
              </p>
            </>
          ) : null
        }
        confirmLabel={
          confirm?.action === "APPROVED"
            ? "Approve"
            : confirm?.action === "REJECTED"
              ? "Reject"
              : "Remove"
        }
        variant={confirm?.action === "APPROVED" ? "default" : "destructive"}
        busy={resolve.isPending}
        onConfirm={async () => {
          if (!confirm) return;
          await act(confirm.item, confirm.action);
          setConfirm(null);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ModerationItemStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline">
          <IconFlag className="mr-1 size-3" />
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge>
          <IconCheck className="mr-1 size-3" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <IconX className="mr-1 size-3" />
          Rejected
        </Badge>
      );
    case "REMOVED":
      return <Badge variant="secondary">Removed</Badge>;
  }
}
