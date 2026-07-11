"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconArchive,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTag,
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
  useAdminCoupons,
  useCreateCoupon,
  useDeactivateCoupon,
  useUpdateCoupon,
  type Coupon,
  type CouponDiscountType,
} from "@/lib/hooks/useAdminCoupons";

const STATUS_TABS: Array<{
  key: NonNullable<Parameters<typeof useAdminCoupons>[0]>["status"];
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "scheduled", label: "Scheduled" },
  { key: "exhausted", label: "Exhausted" },
  { key: "expired", label: "Expired" },
];

type Draft = {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  percentOff: number;
  amountOff: number;
  currency: string;
  startsAt: string;
  expiresAt: string;
  maxRedemptions: number;
  isActive: boolean;
  planIds: string;
};

const EMPTY_DRAFT: Draft = {
  code: "",
  description: "",
  discountType: "PERCENT",
  percentOff: 10,
  amountOff: 0,
  currency: "USD",
  startsAt: "",
  expiresAt: "",
  maxRedemptions: 0,
  isActive: true,
  planIds: "",
};

function statusOf(c: Coupon): string {
  if (!c.isActive) return "Inactive";
  const now = Date.now();
  if (new Date(c.startsAt).getTime() > now) return "Scheduled";
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return "Expired";
  if (c.maxRedemptions > 0 && c.redemptions >= c.maxRedemptions)
    return "Exhausted";
  return "Active";
}

export function AdminCouponsClient() {
  const [status, setStatus] = useState<"all" | "active" | "expired" | "scheduled" | "exhausted">(
    "all",
  );
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useAdminCoupons({ status, search });
  const coupons = useMemo(() => data ?? [], [data]);

  const create = useCreateCoupon();
  const update = useUpdateCoupon("");
  const deactivate = useDeactivateCoupon("");

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Coupon | null>(null);

  function populateDraft(d: Draft) {
    setDraft(d);
  }

  async function save() {
    if (!draft.code.trim()) {
      toast.error("Code is required.");
      return;
    }
    const payload = {
      code: draft.code.toUpperCase().trim(),
      description: draft.description,
      discountType: draft.discountType,
      percentOff: draft.discountType === "PERCENT" ? draft.percentOff : 0,
      amountOff: draft.discountType === "FIXED" ? draft.amountOff : 0,
      currency: draft.currency,
      startsAt: draft.startsAt || new Date().toISOString(),
      expiresAt: draft.expiresAt || null,
      maxRedemptions: draft.maxRedemptions,
      isActive: draft.isActive,
      planIds: draft.planIds
        ? draft.planIds.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editing) {
        await update.mutateAsync(payload);
        toast.success("Coupon updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Coupon created.");
      }
      setEditing(null);
      populateDraft(EMPTY_DRAFT);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground text-sm">
            Promo codes for upgrades and retention offers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <IconRefresh className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              populateDraft(EMPTY_DRAFT);
            }}
          >
            <IconPlus className="mr-1.5 size-4" />
            New coupon
          </Button>
        </div>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border">
        {STATUS_TABS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStatus(s.key ?? "all")}
            className={`px-4 py-2 text-sm ${
              status === s.key ? "bg-muted font-medium" : "bg-background"
            } ${i > 0 ? "border-l" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or description…"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <IconTag className="text-muted-foreground size-8" />
            <div className="text-sm font-medium">No coupons</div>
            <div className="text-muted-foreground text-xs">
              Create your first promotional code above.
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => {
                const status = statusOf(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {c.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.discountType === "PERCENT"
                        ? `${c.percentOff}%`
                        : `$${c.amountOff.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div>{new Date(c.startsAt).toLocaleDateString()}</div>
                      {c.expiresAt ? (
                        <div>→ {new Date(c.expiresAt).toLocaleDateString()}</div>
                      ) : (
                        <div>→ no expiry</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.redemptions}
                      {c.maxRedemptions > 0 ? ` / ${c.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "Active"
                            ? "default"
                            : status === "Scheduled"
                              ? "secondary"
                              : status === "Exhausted"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c);
                            populateDraft({
                              code: c.code,
                              description: c.description,
                              discountType: c.discountType,
                              percentOff: c.percentOff,
                              amountOff: c.amountOff,
                              currency: c.currency,
                              startsAt: c.startsAt.slice(0, 16),
                              expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
                              maxRedemptions: c.maxRedemptions,
                              isActive: c.isActive,
                              planIds: c.planIds.join(", "),
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!c.isActive}
                          onClick={() => setConfirmDeactivate(c)}
                        >
                          <IconArchive className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">
          {editing ? `Edit "${editing.code}"` : "Create coupon"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Code</Label>
            <Input
              value={draft.code}
              onChange={(e) =>
                setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
              }
              placeholder="LAUNCH20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Discount type</Label>
            <div className="inline-flex overflow-hidden rounded-md border">
              {(["PERCENT", "FIXED"] as CouponDiscountType[]).map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, discountType: t }))}
                  className={`px-4 py-2 text-sm ${
                    draft.discountType === t ? "bg-muted font-medium" : ""
                  } ${i > 0 ? "border-l" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {draft.discountType === "PERCENT" ? (
            <div className="flex flex-col gap-2">
              <Label>Percent off</Label>
              <Input
                type="number"
                value={draft.percentOff}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, percentOff: Number(e.target.value) }))
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Amount off (cents)</Label>
              <Input
                type="number"
                value={draft.amountOff}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, amountOff: Number(e.target.value) }))
                }
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Input
              value={draft.currency}
              onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Starts at</Label>
            <Input
              type="datetime-local"
              value={draft.startsAt}
              onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Expires at</Label>
            <Input
              type="datetime-local"
              value={draft.expiresAt}
              onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Max redemptions (0 = unlimited)</Label>
            <Input
              type="number"
              value={draft.maxRedemptions}
              onChange={(e) =>
                setDraft((d) => ({ ...d, maxRedemptions: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Apply to plan IDs (comma-separated, empty = all)</Label>
            <Input
              value={draft.planIds}
              onChange={(e) => setDraft((d) => ({ ...d, planIds: e.target.value }))}
              placeholder="plan_pro, plan_team"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Description (internal)</Label>
            <Input
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(null);
              populateDraft(EMPTY_DRAFT);
            }}
          >
            Reset
          </Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>
            {editing ? "Save changes" : "Create coupon"}
          </Button>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirmDeactivate)}
        onOpenChange={(o) => {
          if (!o) setConfirmDeactivate(null);
        }}
        title={`Deactivate ${confirmDeactivate?.code ?? ""}?`}
        description="Users can no longer redeem this coupon. Existing redemptions remain valid."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={async () => {
          if (!confirmDeactivate) return;
          try {
            await deactivate.mutateAsync();
            toast.success("Coupon deactivated.");
            setConfirmDeactivate(null);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed.");
          }
        }}
      />
    </div>
  );
}