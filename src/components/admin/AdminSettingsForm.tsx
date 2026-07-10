"use client";

// Platform-config settings form.
//
// Displays the schema-driven field list, lets an admin edit values
// in-place, validates ranges, and batches all dirty fields into a
// single PUT /admin/settings call. Maintenance-mode flips force a
// second confirmation step before the request fires.

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  IconAlertTriangle,
  IconExternalLink,
  IconLoader2,
  IconRestore,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  SETTINGS_FIELDS,
  useAdminSettings,
  useUpdateSettings,
  type PlatformSetting,
} from "@/lib/hooks/useAdminSettings";

type Props = {
  initial?: PlatformSetting[];
};

type FieldState = {
  value: string;
  /** Original stored value — used to detect dirty state + revert. */
  original: string;
  error?: string;
};

const KNOWN_KEYS = new Set(SETTINGS_FIELDS.map((f) => f.key));

function defaultFor(kind: "number" | "boolean" | "text") {
  if (kind === "number") return "";
  if (kind === "boolean") return "false";
  return "";
}

function seedFromData(
  data: PlatformSetting[] | undefined,
): Record<string, FieldState> {
  const next: Record<string, FieldState> = {};
  if (!data) return next;
  // Seed known fields with their stored value or a kind-appropriate default.
  for (const f of SETTINGS_FIELDS) {
    const found = data.find((r) => r.key === f.key);
    const current = found?.value ?? defaultFor(f.kind);
    next[f.key] = { value: current, original: current };
  }
  // Surface any unknown keys coming back from the backend so admins can
  // see (and edit) settings the frontend doesn't classify yet.
  for (const row of data) {
    if (KNOWN_KEYS.has(row.key)) continue;
    next[row.key] = { value: row.value, original: row.value };
  }
  return next;
}

export function AdminSettingsForm({ initial }: Props) {
  const query = useAdminSettings();
  const data = query.data ?? initial;
  const update = useUpdateSettings();

  // Track the most recently observed data + the original values so
  // dirty-state detection works even before the lazy initializer runs.
  const [lastData, setLastData] = useState(data);
  if (data !== undefined && lastData !== data) {
    setLastData(data);
  }

  const [state, setState] = useState<Record<string, FieldState>>(() =>
    seedFromData(data),
  );
  const [pendingMaintenance, setPendingMaintenance] = useState<{
    enabled: boolean;
  } | null>(null);

  if (!data && query.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const dirtyKeys = Object.entries(state)
    .filter(([, s]) => s.value !== s.original)
    .map(([k]) => k);

  const canSave = dirtyKeys.length > 0 && !update.isPending;

  const updateField = (key: string, raw: string) => {
    setState((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: raw, error: undefined },
    }));
  };

  const validate = (): boolean => {
    const next: Record<string, FieldState> = { ...state };
    let ok = true;
    for (const f of SETTINGS_FIELDS) {
      const current = state[f.key]?.value ?? "";
      if (f.kind === "number") {
        const n = Number(current);
        if (!Number.isFinite(n)) {
          next[f.key] = { ...next[f.key], error: "Must be a number." };
          ok = false;
          continue;
        }
        if (f.min !== undefined && n < f.min) {
          next[f.key] = {
            ...next[f.key],
            error: `Must be at least ${f.min}.`,
          };
          ok = false;
          continue;
        }
        if (f.max !== undefined && n > f.max) {
          next[f.key] = {
            ...next[f.key],
            error: `Must be at most ${f.max}.`,
          };
          ok = false;
        }
      }
    }
    setState(next);
    return ok;
  };

  const buildPayload = () =>
    dirtyKeys.map((key) => ({ key, value: state[key]?.value ?? "" }));

  const performSave = async () => {
    if (!validate()) return;
    try {
      await update.mutateAsync(buildPayload());
      toast.success("Settings saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    }
  };

  const onSaveClick = () => {
    // Maintenance-mode requires a confirmation step before firing the
    // request. Admins disable it less often than they enable it, but
    // we gate both directions since either one is platform-visible.
    const current = state.maintenance_mode?.value ?? "false";
    const wasMaintenance = state.maintenance_mode?.original ?? "false";
    const nextMaintenance = current === "true";
    const flipped = nextMaintenance !== (wasMaintenance === "true");
    if (flipped) {
      setPendingMaintenance({ enabled: nextMaintenance });
      return;
    }
    void performSave();
  };

  const onConfirmMaintenance = async () => {
    setPendingMaintenance(null);
    await performSave();
  };

  const onRevert = (key: string) => {
    setState((prev) => {
      const original = prev[key]?.original ?? "";
      const restored: FieldState = { value: original, original };
      return { ...prev, [key]: restored };
    });
  };

  const unknownRows = (data ?? []).filter((r) => !KNOWN_KEYS.has(r.key));

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Platform limits</h2>
          <p className="text-muted-foreground text-sm">
            Defaults applied to users without a per-user override.
          </p>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col gap-5">
          {SETTINGS_FIELDS.map((f) => {
            const row = state[f.key];
            if (!row) return null;

            if (f.key === "maintenance_mode") {
              const enabled = row.value === "true";
              const isDirty = row.value !== row.original;
              return (
                <div key={f.key} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{f.label}</span>
                        {enabled ? (
                          <Badge variant="destructive">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Off</Badge>
                        )}
                        {isDirty ? (
                          <Badge variant="outline">Changed</Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {f.description}
                      </p>
                    </div>
                    <div
                      role="group"
                      aria-label={f.label}
                      className="inline-flex overflow-hidden rounded-md border"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={enabled ? "default" : "ghost"}
                        aria-pressed={enabled}
                        onClick={() => updateField(f.key, "true")}
                      >
                        On
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!enabled ? "default" : "ghost"}
                        aria-pressed={!enabled}
                        onClick={() => updateField(f.key, "false")}
                      >
                        Off
                      </Button>
                    </div>
                  </div>
                  {enabled ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <IconAlertTriangle className="size-3.5" />
                      Writes and login will be paused while this is on.
                    </div>
                  ) : null}
                </div>
              );
            }

            const num = Number(row.value);
            const isDirty = row.value !== row.original;
            return (
              <div key={f.key} className="flex flex-col gap-2">
                <div className="flex items-end justify-between gap-3">
                  <Label htmlFor={`field-${f.key}`} className="text-sm">
                    {f.label}
                  </Label>
                  {isDirty ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onRevert(f.key)}
                      className="gap-1"
                    >
                      <IconRestore className="size-3" />
                      Revert
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id={`field-${f.key}`}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    value={row.value}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    aria-invalid={Boolean(row.error)}
                    className="max-w-xs"
                  />
                  {f.suffix ? (
                    <span className="text-muted-foreground text-xs">
                      {f.suffix}
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {f.description}
                </p>
                {f.min !== undefined || f.max !== undefined ? (
                  <p className="text-muted-foreground text-[11px]">
                    Allowed range: {f.min ?? "—"} to {f.max ?? "—"} {f.suffix ?? ""}
                  </p>
                ) : null}
                {row.error ? (
                  <p className="text-destructive text-xs">{row.error}</p>
                ) : null}
                {isDirty && !row.error ? (
                  <p className="text-[11px] text-amber-600">
                    Current value is {row.original}. Saving will change it to{" "}
                    {Number.isFinite(num) ? num : row.value}.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      {unknownRows.length > 0 ? (
        <Card className="p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Additional settings</h2>
            <p className="text-muted-foreground text-sm">
              Rows stored on the server that the UI doesn&apos;t yet
              classify. Edited values are sent back to the server as-is.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-4">
            {unknownRows.map((row) => {
              const field = state[row.key];
              if (!field) return null;
              return (
                <div key={row.key} className="flex flex-col gap-2">
                  <Label htmlFor={`field-${row.key}`} className="text-xs font-mono">
                    {row.key}
                  </Label>
                  <Input
                    id={`field-${row.key}`}
                    value={field.value}
                    onChange={(e) => updateField(row.key, e.target.value)}
                  />
                  {row.description ? (
                    <p className="text-muted-foreground text-xs">
                      {row.description}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {dirtyKeys.length === 0
            ? "No pending changes."
            : `${dirtyKeys.length} pending change${
                dirtyKeys.length === 1 ? "" : "s"
              }.`}
        </span>
        <Link
          href="/admin/audit-log"
          className="inline-flex shrink-0 items-center gap-1 hover:text-foreground"
        >
          View audit log
          <IconExternalLink className="size-3" />
        </Link>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur md:mx-0 md:rounded-md md:border md:bg-background md:px-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground hidden items-center gap-2 text-xs sm:inline-flex">
            <IconShieldCheck className="size-3.5" />
            Changes are recorded in the audit log.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!canSave}
              onClick={() => {
                if (!data) return;
                setState(seedFromData(data));
              }}
            >
              Cancel
            </Button>
            <Button onClick={onSaveClick} disabled={!canSave}>
              {update.isPending ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingMaintenance)}
        onOpenChange={(o) => {
          if (!o) setPendingMaintenance(null);
        }}
        title={
          pendingMaintenance?.enabled
            ? "Enable maintenance mode?"
            : "Disable maintenance mode?"
        }
        description={
          pendingMaintenance?.enabled ? (
            <>
              <p>
                Sign-in and write actions across the platform will be
                paused. Users will see a maintenance banner.
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                The setting change is logged to the audit log against
                your admin account.
              </p>
            </>
          ) : (
            <>
              <p>
                Maintenance mode will be lifted and the platform will
                resume normal operation on the next page load.
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                The setting change is logged to the audit log.
              </p>
            </>
          )
        }
        confirmLabel={
          pendingMaintenance?.enabled
            ? "Enable maintenance"
            : "Resume platform"
        }
        busy={update.isPending}
        onConfirm={onConfirmMaintenance}
      />
    </div>
  );
}
