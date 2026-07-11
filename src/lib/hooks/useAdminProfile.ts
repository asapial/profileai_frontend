"use client";

// Admin profile hooks.
//
// Mirrors `useMyProfile` / `useSecurity` but scoped to the
// admin-scoped endpoints (`/admin/profile/*`, `/admin/devices/*`).
// Kept as one file because the Personal / Security / Devices tabs
// all invalidate overlapping query keys when something changes
// (e.g. revoke device → invalidate both `admin-profile-sessions`
// and `admin-profile-devices`).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";

export type AdminProfile = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  twoFactorEnabled: boolean;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
  } | null;
};

export type AdminSession = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
};

export type AdminDevice = {
  id: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastLoginAt: string;
  isTrusted: boolean;
};

export const ADMIN_PROFILE_KEYS = {
  me: ["admin-profile", "me"] as const,
  sessions: ["admin-profile", "sessions"] as const,
  devices: ["admin-profile", "devices"] as const,
};

export function useAdminProfile() {
  return useQuery({
    queryKey: ADMIN_PROFILE_KEYS.me,
    queryFn: () => api.get<AdminProfile>("/admin/profile"),
  });
}

export function useAdminSessions() {
  return useQuery({
    queryKey: ADMIN_PROFILE_KEYS.sessions,
    queryFn: () => api.get<AdminSession[]>("/admin/profile/sessions"),
  });
}

export function useAdminDevices() {
  return useQuery({
    queryKey: ADMIN_PROFILE_KEYS.devices,
    queryFn: () => api.get<AdminDevice[]>("/admin/profile/devices"),
  });
}

type MutationOptions<TData, TVariables> = UseMutationOptions<
  TData,
  ApiError,
  TVariables
>;

function profileMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  invalidate: ReadonlyArray<readonly unknown[]> = [],
  options?: MutationOptions<TData, TVariables>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (...args) => {
      for (const key of invalidate) {
        qc.invalidateQueries({ queryKey: key as readonly unknown[] });
      }
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args,
      );
    },
  });
}

export function useUpdateAdminProfile() {
  return profileMutation(
    (vars: {
      firstName: string;
      lastName: string;
      phone?: string | null;
    }) =>
      api.patch<AdminProfile>("/admin/profile", {
        firstName: vars.firstName,
        lastName: vars.lastName,
        phone: vars.phone ?? null,
      }),
    [ADMIN_PROFILE_KEYS.me],
  );
}

export function useChangeAdminPassword() {
  return profileMutation(
    (vars: { currentPassword: string; newPassword: string }) =>
      api.post<{ ok: true; revokedOtherSessions: number }>(
        "/admin/profile/change-password",
        vars,
      ),
  );
}

export function useToggleAdminTwoFactor() {
  return profileMutation(
    (vars: { enabled: boolean }) =>
      api.post<{ ok: true; enabled: boolean }>(
        "/admin/profile/2fa/toggle",
        vars,
      ),
    [ADMIN_PROFILE_KEYS.me],
  );
}

export function useRevokeAdminSession() {
  return profileMutation(
    (id: string) =>
      api.delete<{ status: "revoked"; auditLogId: string }>(
        `/admin/profile/sessions/${id}`,
      ),
    [ADMIN_PROFILE_KEYS.sessions],
  );
}

export function useRevokeAllAdminSessions() {
  return profileMutation(
    () =>
      api.delete<{ revoked: number }>("/admin/profile/sessions", {
        all: true,
      }),
    [ADMIN_PROFILE_KEYS.sessions],
  );
}

export function useRevokeAdminDevice() {
  return profileMutation(
    (id: string) =>
      api.delete<{ status: "revoked"; auditLogId: string }>(
        `/admin/devices/${id}`,
      ),
    [ADMIN_PROFILE_KEYS.devices],
  );
}

export function useTrustAdminDevice() {
  return profileMutation(
    (vars: { id: string; trusted: boolean }) =>
      api.patch<AdminDevice>(`/admin/devices/${vars.id}/trust`, {
        trusted: vars.trusted,
      }),
    [ADMIN_PROFILE_KEYS.devices],
  );
}
