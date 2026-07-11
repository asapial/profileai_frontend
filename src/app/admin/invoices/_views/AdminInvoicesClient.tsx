"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconDownload,
  IconReceipt2,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useAdminInvoices,
  useExportInvoices,
  useRefundInvoice,
  type AdminInvoice,
  type InvoiceStatus,
} from "@/lib/hooks/useAdminInvoices";

const STATUSES: Array<{ key: InvoiceStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "OPEN", label: "Open" },
  { key: "FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "VOID", label: "Void" },
];

function statusVariant(s: InvoiceStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "PAID":
      return "default";
    case "OPEN":
      return "secondary";
    case "FAILED":
    case "VOID":
      return "destructive";
    case "REFUNDED":
      return "outline";
    default:
      return "outline";
  }
}

export function AdminInvoicesClient() {
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = { status, search, from, to };
  const { data, isLoading, refetch, isFetching } = useAdminInvoices(filters);
  const invoices = useMemo(() => data ?? [], [data]);

  const exportCsv = useExportInvoices();
  const refund = useRefundInvoice("");
  const [refundTarget, setRefundTarget] = useState<AdminInvoice | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");

  async function doRefund() {
    if (!refundTarget) return;
    const amount =
      refundAmount.trim() === "" ? undefined : Number(refundAmount);
    if (amount !== undefined && Number.isNaN(amount)) {
      toast.error("Invalid amount.");
      return;
    }
    try {
      await refund.mutateAsync(amount);
      toast.success("Refund issued.");
      setRefundTarget(null);
      setRefundAmount("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Refund failed.");
    }
  }

  async function doExport() {
    try {
      const res = await exportCsv.mutateAsync(filters);
      if (res.url) {
        window.open(res.url, "_blank", "noopener");
      } else {
        toast.success("Export queued.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Billing activity and refunds.
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
        {STATUSES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStatus(s.key)}
            className={`px-4 py-2 text-sm ${
              status === s.key ? "bg-muted font-medium" : ""
            } ${i > 0 ? "border-l" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, email, plan…"
            />
          </div>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <IconReceipt2 className="text-muted-foreground size-8" />
            <div className="text-sm font-medium">No invoices match these filters.</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">
                    {inv.number}
                  </TableCell>
                  <TableCell className="text-sm">{inv.userEmail}</TableCell>
                  <TableCell className="text-sm">{inv.planName}</TableCell>
                  <TableCell className="text-sm">
                    ${inv.amount.toFixed(2)} {inv.currency}
                    {inv.refundedAmount > 0 ? (
                      <div className="text-muted-foreground text-xs">
                        refund −${inv.refundedAmount.toFixed(2)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {inv.invoiceUrl ? (
                        <Button asChild size="sm" variant="ghost">
                          <a href={inv.invoiceUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={inv.status !== "PAID"}
                        onClick={() => {
                          setRefundTarget(inv);
                          setRefundAmount("");
                        }}
                      >
                        Refund
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AdminConfirmDialog
        open={Boolean(refundTarget)}
        onOpenChange={(o) => {
          if (!o) {
            setRefundTarget(null);
            setRefundAmount("");
          }
        }}
        title={`Refund ${refundTarget?.number ?? ""}`}
        description={
          refundTarget
            ? `Issue a refund to ${refundTarget.userEmail}. Leave the amount blank to refund the full ${refundTarget.amount.toFixed(2)} ${refundTarget.currency}.`
            : ""
        }
        confirmLabel="Issue refund"
        variant="destructive"
        onConfirm={doRefund}
      >
        <div className="flex flex-col gap-2 py-2">
          <Label>Amount (blank = full)</Label>
          <Input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder={refundTarget?.amount.toFixed(2) ?? ""}
          />
        </div>
      </AdminConfirmDialog>
    </div>
  );
}