"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconDownload,
  IconHistory,
  IconRefresh,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useAdminAuditEntry,
  useAdminAuditLog,
  useExportAuditLog,
  type AdminAuditFilters,
  type AuditEntry,
} from "@/lib/hooks/useAdminAudit";

const CATEGORY_TABS: Array<{ key: AuditEntry["category"] | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "AUTH", label: "Auth" },
  { key: "USER", label: "Users" },
  { key: "BILLING", label: "Billing" },
  { key: "TEMPLATE", label: "Templates" },
  { key: "CONTENT", label: "Content" },
  { key: "SETTINGS", label: "Settings" },
  { key: "SECURITY", label: "Security" },
];

function categoryVariant(c: AuditEntry["category"]) {
  switch (c) {
    case "AUTH":
      return "secondary" as const;
    case "USER":
      return "default" as const;
    case "BILLING":
      return "outline" as const;
    case "SECURITY":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function AdminAuditLogClient() {
  const [category, setCategory] = useState<AuditEntry["category"] | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: AdminAuditFilters = { category, search, from, to };
  const { data, isLoading, refetch, isFetching } = useAdminAuditLog(filters);
  const entries = useMemo(() => data ?? [], [data]);
  const detail = useAdminAuditEntry(selectedId ?? "");
  const exportCsv = useExportAuditLog();

  async function doExport() {
    try {
      const res = await exportCsv.mutateAsync(filters);
      if (res.url) window.open(res.url, "_blank", "noopener");
      else toast.success("Export queued.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-muted-foreground text-sm">
            Every consequential action across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <IconRefresh className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={doExport} disabled={exportCsv.isPending}>
            <IconDownload className="mr-1.5 size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border">
        {CATEGORY_TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setCategory(t.key)}
            className={`px-4 py-2 text-sm ${
              category === t.key ? "bg-muted font-medium" : ""
            } ${i > 0 ? "border-l" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, target id…"
          />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <IconHistory className="text-muted-foreground size-8" />
              <div className="text-sm font-medium">No events match.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    data-state={selectedId === e.id ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.actor ? (
                        <span className="flex items-center gap-1.5">
                          <IconUser className="text-muted-foreground size-3.5" />
                          {e.actor.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">system</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.action}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {e.target ? `${e.target.type}:${e.target.id.slice(0, 8)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoryVariant(e.category)}>
                        {e.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          {selectedId ? (
            detail.isLoading ? (
              <Skeleton className="h-48" />
            ) : detail.data ? (
              <DetailPane entry={detail.data} />
            ) : (
              <div className="text-muted-foreground text-sm">
                No details available.
              </div>
            )
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
              <IconHistory className="size-6" />
              Select an event to view its payload.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DetailPane({ entry }: { entry: NonNullable<ReturnType<typeof useAdminAuditEntry>["data"]> }) {
  if (!entry) return null;
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Event detail</h3>
        <Badge variant={categoryVariant(entry.category)}>{entry.category}</Badge>
      </div>
      <dl className="grid grid-cols-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">When</dt>
        <dd className="col-span-2">{new Date(entry.createdAt).toLocaleString()}</dd>
        <dt className="text-muted-foreground">Actor</dt>
        <dd className="col-span-2">{entry.actor?.email ?? "system"}</dd>
        <dt className="text-muted-foreground">IP</dt>
        <dd className="col-span-2">{entry.ip ?? "—"}</dd>
        <dt className="text-muted-foreground">Action</dt>
        <dd className="col-span-2 font-mono">{entry.action}</dd>
        {entry.target ? (
          <>
            <dt className="text-muted-foreground">Target</dt>
            <dd className="col-span-2">
              {entry.target.type} <span className="font-mono">{entry.target.id}</span>
            </dd>
          </>
        ) : null}
      </dl>

      {(entry.before || entry.after) ? (
        <div className="grid gap-2">
          <DiffBlock label="Before" value={entry.before} />
          <DiffBlock label="After" value={entry.after} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">Payload</span>
          <pre className="bg-muted max-h-72 overflow-auto rounded p-2 text-xs">
            {JSON.stringify(entry.payload, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}

function DiffBlock({
  label,
  value,
}: {
  label: string;
  value: Record<string, unknown> | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <pre className="bg-muted max-h-44 overflow-auto rounded p-2 text-xs">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}