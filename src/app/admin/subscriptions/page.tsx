"use client";

import { FormEvent, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconRefresh, IconSearch } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AdminSubscriptionRow, useAdminSubscriptions, useResetPlanUsage } from "@/lib/hooks/useAdminSubscriptions";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function Usage({ used, limit }: { used: number; limit: number }) {
  const unlimited = limit < 0;
  const percent = unlimited ? 0 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : used > 0 ? 100 : 0;
  return (
    <div className="min-w-32 space-y-1.5">
      <div className="flex justify-between text-xs"><span className="font-medium tabular-nums">{used} / {unlimited ? "∞" : limit}</span><span className="text-muted-foreground">{unlimited ? "Unlimited" : `${percent}%`}</span></div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [resetTarget, setResetTarget] = useState<AdminSubscriptionRow | null>(null);
  const query = useAdminSubscriptions(page, search);
  const reset = useResetPlanUsage();
  const rows = query.data?.subscriptions ?? [];
  const meta = query.data?.meta;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User subscriptions</h1>
        <p className="text-sm text-muted-foreground">Review each user’s plan, renewal date, allowance usage, and reset cycle.</p>
      </div>

      <Card className="p-4">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search user name or email" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Resume usage</TableHead><TableHead>AI usage</TableHead><TableHead>Renews</TableHead><TableHead>Usage resets</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? Array.from({ length: 6 }).map((_, index) => <TableRow key={index}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) : null}
            {!query.isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No users match this search.</TableCell></TableRow> : null}
            {rows.map((row) => (
              <TableRow key={row.user.id}>
                <TableCell><div className="font-medium">{row.user.name || row.user.email}</div><div className="text-xs text-muted-foreground">{row.user.email}</div></TableCell>
                <TableCell><div className="font-medium">{row.plan.name}</div><div className="text-xs uppercase text-muted-foreground">{row.plan.interval?.toLowerCase() ?? "default"}</div></TableCell>
                <TableCell><Badge variant={row.status === "ACTIVE" || row.status === "TRIALING" || row.status === "FREE" ? "outline" : "destructive"}>{row.status.replaceAll("_", " ")}</Badge>{row.cancelAtPeriodEnd ? <div className="mt-1 text-xs text-amber-600">Cancels at period end</div> : null}</TableCell>
                <TableCell><Usage {...row.usage.resumes} /></TableCell>
                <TableCell><Usage {...row.usage.ai} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(row.currentPeriodEnd)}</TableCell>
                <TableCell><div className="text-xs">{formatDate(row.usage.resetAt)}</div>{row.usage.overrideByAdmin ? <div className="text-xs text-violet-600">Admin override</div> : null}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setResetTarget(row)}><IconRefresh className="size-4" /> Reset usage</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{meta ? `${meta.total} user${meta.total === 1 ? "" : "s"}` : ""}</span>
        <div className="flex items-center gap-2"><Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><IconChevronLeft className="size-4" /> Previous</Button><span className="text-muted-foreground">Page {page} of {Math.max(1, meta?.totalPages ?? 1)}</span><Button size="sm" variant="ghost" disabled={page >= (meta?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next <IconChevronRight className="size-4" /></Button></div>
      </div>

      <AdminConfirmDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => { if (!open) setResetTarget(null); }}
        title="Reset plan usage"
        description={<>This will set resume and AI usage to zero for <span className="font-medium">{resetTarget?.user.email}</span>. Their subscription and billing period will not change.</>}
        confirmLabel="Reset usage"
        busy={reset.isPending}
        onConfirm={async () => {
          if (!resetTarget) return;
          await reset.mutateAsync(resetTarget.user.id);
          toast.success("Plan usage reset successfully.");
        }}
      />
    </div>
  );
}
