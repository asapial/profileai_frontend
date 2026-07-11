"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconCircleDot,
  IconFlag,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  type FeatureFlag,
  type FlagEnvironment,
  useAdminFeatureFlags,
  useCreateFlag,
  useDeleteFlag,
  useUpdateFlag,
} from "@/lib/hooks/useAdminFeatureFlags";

type Draft = Partial<FeatureFlag> & {
  planIds: string;
  regions: string;
  userIds: string;
};

const ENV_TABS: Array<{ key: FlagEnvironment | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "DEV", label: "Dev" },
  { key: "STAGING", label: "Staging" },
  { key: "PRODUCTION", label: "Production" },
];

const EMPTY: Draft = {
  key: "",
  name: "",
  description: "",
  enabled: false,
  rolloutPercent: 0,
  environment: "PRODUCTION",
  targeting: { planIds: [], regions: [], userIds: [] },
  planIds: "",
  regions: "",
  userIds: "",
};

export function AdminFeatureFlagsClient() {
  const { data, isLoading } = useAdminFeatureFlags();
  const flags = useMemo(() => data ?? [], [data]);

  const [env, setEnv] = useState<FlagEnvironment | "ALL">("ALL");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeatureFlag | null>(null);

  const create = useCreateFlag();
  const update = useUpdateFlag(editingId ?? "");
  const del = useDeleteFlag("");

  const visible = useMemo(
    () => (env === "ALL" ? flags : flags.filter((f) => f.environment === env)),
    [flags, env],
  );

  function populateDraft(f: FeatureFlag) {
    setEditingId(f.id);
    setDraft({
      key: f.key,
      name: f.name,
      description: f.description,
      enabled: f.enabled,
      rolloutPercent: f.rolloutPercent,
      environment: f.environment,
      targeting: f.targeting,
      planIds: f.targeting.planIds.join(", "),
      regions: f.targeting.regions.join(", "),
      userIds: f.targeting.userIds.join(", "),
    });
  }

  function parseTargeting(d: Draft) {
    return {
      planIds: d.planIds ? d.planIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
      regions: d.regions ? d.regions.split(",").map((s) => s.trim()).filter(Boolean) : [],
      userIds: d.userIds ? d.userIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
  }

  async function save() {
    if (!draft.key || !draft.name) {
      toast.error("Key and name are required.");
      return;
    }
    const payload = {
      key: draft.key,
      name: draft.name,
      description: draft.description ?? "",
      enabled: Boolean(draft.enabled),
      rolloutPercent: Math.min(100, Math.max(0, Number(draft.rolloutPercent) || 0)),
      environment: (draft.environment ?? "PRODUCTION") as FlagEnvironment,
      targeting: parseTargeting(draft),
    };
    try {
      if (editingId) {
        await update.mutateAsync(payload);
        toast.success("Flag updated.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Flag created.");
      }
      setDraft(EMPTY);
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function toggle(f: FeatureFlag, enabled: boolean) {
    try {
      await useUpdateFlagHook(f.id, { enabled });
      toast.success(`Flag ${enabled ? "enabled" : "disabled"}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Feature flags</h1>
          <p className="text-muted-foreground text-sm">
            Toggle beta features and staged rollouts without redeploying.
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft(EMPTY);
            setEditingId(null);
          }}
        >
          <IconPlus className="mr-1.5 size-4" />
          New flag
        </Button>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border">
        {ENV_TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setEnv(t.key)}
            className={`px-4 py-2 text-sm ${
              env === t.key ? "bg-muted font-medium" : ""
            } ${i > 0 ? "border-l" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((f) => (
            <Card key={f.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <IconFlag className="size-4" />
                    <span className="font-mono text-xs">{f.key}</span>
                    <Badge variant={f.enabled ? "default" : "outline"}>
                      {f.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Badge variant="secondary">{f.environment}</Badge>
                  </div>
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {f.description}
                  </span>
                </div>
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(v) => toggle(f, v)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rollout</span>
                  <span>{f.rolloutPercent}%</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${f.rolloutPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                {f.targeting.planIds.length > 0 ? (
                  <span>plans: {f.targeting.planIds.join(", ")}</span>
                ) : null}
                {f.targeting.regions.length > 0 ? (
                  <span>regions: {f.targeting.regions.join(", ")}</span>
                ) : null}
                {f.targeting.userIds.length > 0 ? (
                  <span>{f.targeting.userIds.length} users</span>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  updated {new Date(f.updatedAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => populateDraft(f)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(f)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-base font-semibold">
          {editingId ? "Edit flag" : "Create flag"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Key</Label>
            <Input
              value={draft.key ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
              placeholder="new_ats_v2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <Input
              value={draft.name ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="ATS scoring v2"
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
            <Label>Environment</Label>
            <div className="inline-flex overflow-hidden rounded-md border">
              {(["DEV", "STAGING", "PRODUCTION"] as FlagEnvironment[]).map((e, i) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, environment: e }))}
                  className={`px-3 py-1.5 text-sm ${
                    draft.environment === e ? "bg-muted font-medium" : ""
                  } ${i > 0 ? "border-l" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rollout %</Label>
            <Input
              type="number"
              value={draft.rolloutPercent ?? 0}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  rolloutPercent: Number(e.target.value),
                }))
              }
              min={0}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch
              checked={Boolean(draft.enabled)}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
            />
            <Label>Enabled globally</Label>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Target plan IDs (comma separated)</Label>
            <Input
              value={draft.planIds ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, planIds: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Target regions</Label>
            <Input
              value={draft.regions ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, regions: e.target.value }))}
              placeholder="US, EU"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Override for user IDs</Label>
            <Input
              value={draft.userIds ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, userIds: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(EMPTY);
              setEditingId(null);
            }}
          >
            Reset
          </Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>
            <IconCircleDot className="mr-1.5 size-4" />
            {editingId ? "Save changes" : "Create flag"}
          </Button>
        </div>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
        title={`Delete "${confirmDelete?.key ?? ""}"?`}
        description="This flag will be removed and clients will fall back to defaults."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await del.mutateAsync();
            toast.success("Flag deleted.");
            setConfirmDelete(null);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed.");
          }
        }}
      />
    </div>
  );
}

function useUpdateFlagHook(id: string, payload: Partial<FeatureFlag>) {
  const m = useUpdateFlag(id);
  return payload ? m.mutateAsync(payload) : Promise.resolve(null);
}
