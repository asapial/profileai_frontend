"use client";

// Platform-config hook.
//
// Backend `getSettings` returns `{ key, value, description, updatedBy, updatedAt }[]`
// stored as opaque strings; the frontend classifies each key (numeric vs
// boolean vs text) using `SETTINGS_META` below and provides the typed
// shape the form expects.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type SettingKind = "number" | "boolean" | "text";

export type PlatformSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedBy: string;
  updatedAt: string;
};

export type SettingField = {
  key: string;
  label: string;
  kind: SettingKind;
  description: string;
  min?: number;
  max?: number;
  /** When kind === "number", the unit shown next to the input. */
  suffix?: string;
};

export const SETTINGS_FIELDS: SettingField[] = [
  {
    key: "default_resume_limit",
    label: "Default resume limit",
    kind: "number",
    description:
      "Number of resumes new users can create per billing cycle before being asked to upgrade.",
    min: 1,
    max: 500,
    suffix: "resumes",
  },
  {
    key: "default_api_limit",
    label: "Default API limit",
    kind: "number",
    description:
      "Monthly AI actions (rewrite, jd match) bundled with the free plan.",
    min: 0,
    max: 100000,
    suffix: "calls / month",
  },
  {
    key: "max_devices_per_user",
    label: "Max devices per user",
    kind: "number",
    description:
      "Hard cap on concurrent signed-in devices. Users with more will be forced to revoke one.",
    min: 1,
    max: 10,
    suffix: "devices",
  },
  {
    key: "otp_expiry_minutes",
    label: "OTP expiry",
    kind: "number",
    description: "How long a one-time password remains valid before expiring.",
    min: 1,
    max: 60,
    suffix: "minutes",
  },
  {
    key: "session_ttl_days",
    label: "Session TTL",
    kind: "number",
    description:
      "Refresh token lifetime. Sessions older than this require re-authentication.",
    min: 1,
    max: 90,
    suffix: "days",
  },
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    kind: "boolean",
    description:
      "When enabled, the app shows a maintenance banner and write actions are paused.",
  },
];

export const SETTINGS_FIELD_BY_KEY: Record<string, SettingField> =
  Object.fromEntries(SETTINGS_FIELDS.map((f) => [f.key, f]));

export const SETTINGS_QUERY_KEY = ["admin-settings"] as const;

export function useAdminSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => api.get<PlatformSetting[]>("/admin/settings"),
    staleTime: 30 * 1000,
  });
}

type UpdateVariables = Array<{
  key: string;
  value: string;
}>;

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: UpdateVariables) =>
      api.put<PlatformSetting[]>("/admin/settings", { settings }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
  });
}

export function coerceField(kind: SettingKind, raw: string): number | boolean | string {
  switch (kind) {
    case "number":
      return Number(raw);
    case "boolean":
      return raw === "true" || raw === "1";
    case "text":
      return raw;
  }
}

export function parseValueAsString(
  kind: SettingKind,
  value: unknown,
): string {
  switch (kind) {
    case "number":
      return typeof value === "number" ? String(value) : "0";
    case "boolean":
      return value === true || value === "true" ? "true" : "false";
    case "text":
      return typeof value === "string" ? value : "";
  }
}
