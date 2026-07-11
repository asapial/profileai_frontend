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

type Draft = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  environment: FlagEnvironment;
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
  planIds: "",
  regions: "",
  userIds: "",
};

function parseCSV(s: string) {
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function FlagCard({
  flag,
  onEdit,
  onDelete,
  onToggle,
}: {
  flag: FeatureFlag;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconFlag className="size-4" />
            <span className="font-mono text-xs">{flag.key}</span>
            <Badge variant={flag.enabled ? "default" : "outline"}>
              {flag.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant="secondary">{flag.environment}</Badge>
          </div>
          <span className="text-sm font-medium">{flag.name}</span>
          <span className="text-muted-foreground text-xs">
            {flag.description}
          </span>
        </div>
        <Switch checked={flag.enabled} onCheckedChange={onToggle} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rollout</span>
          <span>{flag.rolloutPercent}%</span>
        </div>
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full"
            style={{ width: `${flag.rolloutPercent}%` }}
          />
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        {flag.targeting.planIds.length > 0 ? (
          <span>plans: {flag.targeting.planIds.join(", ")}</span>
        ) : null}
        {flag.targeting.regions.length > 0 ? (
          <span>regions: {flag.targeting.regions.join(", ")}</span>
        ) : null}
        {flag.targeting.userIds.length > 0 ? (
          <span>{flag.targeting.userIds.length} users</span>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          updated {new Date(flag.updatedAt).toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AdminFeatureFlagsClient() {
  const { data, isLoading } = useAdminFeatureFlags();
  const flags = useMemo(() => data ?? [], [data]);

  const [env, setEnv] = useState<FlagEnvironment | "ALL">("ALL");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeatureFlag | null>(null);

  const create = useCreateFlag();
  const update = useUpdateFlag(editingId ?? "");

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
      planIds: f.targeting.planIds.join(", "),
      regions: f.targeting.regions.join(", "),
      userIds: f.targeting.userIds.join(", "),
    });
  }

  async function save() {
    if (!draft.key || !draft.name) {
      toast.error("Key and name are required.");
      return;
    }
    const payload = {
      key: draft.key,
      name: draft.name,
      description: draft.description,
      enabled: draft.enabled,
      rolloutPercent: Math.min(100, Math.max(0, draft.rolloutPercent)),
      environment: draft.environment,
      targeting: {
        planIds: parseCSV(draft.planIds),
        regions: parseCSV(draft.regions),
        userIds: parseCSV(draft.userIds),
      },
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
            <FlagRow
              key={f.id}
              flag={f}
              onEdit={() => populateDraft(f)}
              onDelete={() => setConfirmDelete(f)}
            />
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
              value={draft.key}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
              placeholder="new_ats_v2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="ATS scoring v2"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Description</Label>
            <Input
              value={draft.description}
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
              value={draft.rolloutPercent}
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
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
            />
            <Label>Enabled globally</Label>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Target plan IDs (comma separated)</Label>
            <Input
              value={draft.planIds}
              onChange={(e) => setDraft((d) => ({ ...d, planIds: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Target regions</Label>
            <Input
              value={draft.regions}
              onChange={(e) => setDraft((d) => ({ ...d, regions: e.target.value }))}
              placeholder="US, EU"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Override for user IDs</Label>
            <Input
              value={draft.userIds}
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
            await useDeleteFlagHook(confirmDelete.id)();
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

function FlagRow({
  flag,
  onEdit,
  onDelete,
}: {
  flag: FeatureFlag;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Local update hook for the row so toggling flags can call mutateAsync
  // without violating hook rules.
  const updater = useUpdateFlag(flag.id);
  async function toggle(enabled: boolean) {
    try {
      await updater.mutateAsync({ enabled });
      toast.success(`Flag ${enabled ? "enabled" : "disabled"}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    }
  }
  return <FlagCard flag={flag} onEdit={onEdit} onDelete={onDelete} onToggle={toggle} />;
}

function useDeleteFlagHook(id: string) {
  const m = useDeleteFlag(id);
  return m.mutateAsync;
}
