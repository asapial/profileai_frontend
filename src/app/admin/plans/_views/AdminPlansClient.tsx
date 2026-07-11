"use client";

// Admin Plan Management (A-P13).
//
// Card-per-plan overview with create/edit/duplicate/archive flows.
// Feature gating matrix edits live inline; price fields are stored
// as cents in StripePriceId form (here we use decimal dollars for
// legibility in the UI).

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconArchive,
  IconCopy,
  IconPencil,
  IconPlus,
  IconStar,
  IconTrash,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  useAdminPlans,
  useArchivePlan,
  useCreatePlan,
  useUpdatePlan,
  type Plan,
  type PlanFeature,
} from "@/lib/hooks/useAdminPlans";

type DraftPlan = Partial<Plan> & {
  features: PlanFeature[];
};

const EMPTY_DRAFT: DraftPlan = {
  slug: "",
  name: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  currency: "USD",
  features: [
    { key: "resume_limit", label: "Resume limit", included: true, limit: 1 },
    { key: "api_limit", label: "AI actions / month", included: true, limit: 50 },
    { key: "ats_score", label: "ATS scoring", included: true },
    { key: "cover_letter", label: "Cover letters", included: true },
    { key: "export_pdf", label: "PDF export", included: true },
  ],
  isDefault: false,
  isArchived: false,
  trialDays: 0,
};

export function AdminPlansClient() {
  const { data, isLoading } = useAdminPlans();
  const plans = useMemo(() => data ?? [], [data]);

  const create = useCreatePlan();
  const [draft, setDraft] = useState<DraftPlan>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Plan | null>(null);

  async function save() {
    if (!draft.slug || !draft.name) {
      toast.error("Slug and name are required.");
      return;
    }
    try {
      if (editingId) {
        await useUpdatePlanHook(editingId)(draft);
        toast.success("Plan updated.");
      } else {
        await create.mutateAsync(draft);
        toast.success("Plan created.");
      }
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setDraft({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
      isDefault: plan.isDefault,
      isArchived: plan.isArchived,
      trialDays: plan.trialDays,
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-muted-foreground text-sm">
            Subscription tiers that drive paywalls, feature gating, and
            Stripe checkout.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
          }}
        >
          <IconPlus className="mr-1.5 size-4" />
          New plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{p.name}</span>
                    {p.isDefault ? (
                      <Badge>
                        <IconStar className="mr-1 size-3" />
                        Default
                      </Badge>
                    ) : null}
                    {p.isArchived ? <Badge variant="outline">Archived</Badge> : null}
                  </div>
                  <span className="text-muted-foreground text-xs">{p.slug}</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                    <IconPencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setDraft({
                        ...EMPTY_DRAFT,
                        name: `${p.name} (copy)`,
                        slug: `${p.slug}-copy`,
                        description: p.description,
                        priceMonthly: p.priceMonthly,
                        priceYearly: p.priceYearly,
                        currency: p.currency,
                        features: p.features,
                        trialDays: p.trialDays,
                      });
                      toast.success("Draft populated — adjust and save.");
                    }}
                  >
                    <IconCopy className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmArchive(p)}
                  >
                    <IconArchive className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{p.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Monthly</div>
                  <div className="text-base font-medium">
                    ${p.priceMonthly.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Yearly</div>
                  <div className="text-base font-medium">
                    ${p.priceYearly.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Trial</div>
                  <div>{p.trialDays} days</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Subscribers</div>
                  <div>{p.activeSubscribers.toLocaleString()}</div>
                </div>
              </div>
              <Separator />
              <ul className="flex flex-col gap-1 text-xs">
                {p.features.map((f) => (
                  <li key={f.key} className="flex items-center justify-between">
                    <span
                      className={
                        f.included ? "" : "text-muted-foreground line-through"
                      }
                    >
                      {f.label}
                      {f.limit !== undefined ? ` (${f.limit})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {editingId ? "Edit plan" : "Create plan"}
          </h2>
          {editingId ? (
            <Badge variant="outline">Editing existing plan</Badge>
          ) : null}
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Slug</Label>
            <Input
              value={draft.slug ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              placeholder="pro"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <Input
              value={draft.name ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Pro"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Description</Label>
            <Input
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Monthly ($)</Label>
            <Input
              type="number"
              value={draft.priceMonthly ?? 0}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  priceMonthly: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Yearly ($)</Label>
            <Input
              type="number"
              value={draft.priceYearly ?? 0}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  priceYearly: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Trial (days)</Label>
            <Input
              type="number"
              value={draft.trialDays ?? 0}
              onChange={(e) =>
                setDraft((d) => ({ ...d, trialDays: Number(e.target.value) }))
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault)}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, isDefault: e.target.checked }))
                }
              />
              <span>Default for new signups</span>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium">Feature gating</h3>
          <Separator className="my-3" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Included</TableHead>
                <TableHead>Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.features.map((f, i) => (
                <TableRow key={f.key}>
                  <TableCell>
                    <span className="text-sm">{f.label}</span>
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={f.included}
                      onChange={(e) =>
                        setDraft((d) => {
                          const features = [...d.features];
                          features[i] = { ...features[i], included: e.target.checked };
                          return { ...d, features };
                        })
                      }
                      className="size-4 accent-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={f.limit ?? 0}
                      onChange={(e) =>
                        setDraft((d) => {
                          const features = [...d.features];
                          features[i] = {
                            ...features[i],
                            limit: Number(e.target.value),
                          };
                          return { ...d, features };
                        })
                      }
                      className="max-w-[120px]"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setDraft(EMPTY_DRAFT);
            }}
          >
            Reset
          </Button>
          <Button onClick={save} disabled={create.isPending}>
            <IconPlus className="mr-1.5 size-4" />
            {editingId ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirmArchive)}
        onOpenChange={(o) => {
          if (!o) setConfirmArchive(null);
        }}
        title={`Archive "${confirmArchive?.name}"?`}
        description="The plan will be hidden from new checkouts but existing subscribers keep their access."
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={async () => {
          if (!confirmArchive) return;
          try {
            await useArchivePlanHook(confirmArchive.id)();
            toast.success("Plan archived.");
            setConfirmArchive(null);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed.");
          }
        }}
      />
    </div>
  );
}

// local helper bridges — keeps the imports at top of file stable.
function useUpdatePlanHook(id: string) {
  const m = useUpdatePlan(id);
  return m.mutateAsync;
}
function useArchivePlanHook(id: string) {
  const m = useArchivePlan(id);
  return m.mutateAsync;
}
