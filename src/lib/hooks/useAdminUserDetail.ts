"use client";

// Admin user-detail data hook (A-P4).
//
// Single hook that loads everything `/admin/users/[id]` needs in one
// pass: profile, resumes, billing, sessions, and recent activity. We
// also expose the impersonation and deletion mutations here because
// the page is the only place they run from. Kept separate from
// `useAdminUsers` because the row-level directory mutations don't
// surface impersonation / GDPR deletion.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { Role } from "@/types";

export type AdminUserDetail = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
    headline: string | null;
  } | null;
  limits: {
    resumeLimit: number | null;
    apiLimit: number | null;
    overrideByAdmin: boolean;
    resetAt: string | null;
  } | null;
  plan: {
    id: string;
    name: string;
    interval: "month" | "year";
    renewsAt: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    resumeCount: number;
    aiCallsThisMonth: number;
    exportsThisMonth: number;
  };
  billing: {
    totalSpentMinor: number;
    currency: string;
    invoicesCount: number;
    hasActiveSubscription: boolean;
    subscriptionRenewsAt: string | null;
  };
  sessions: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceLabel: string | null;
    isCurrent: boolean;
    lastActiveAt: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    createdAt: string;
    meta: Record<string, unknown> | null;
  }>;
};

export type AdminImpersonationResponse = {
  impersonationToken: string;
  expiresAt: string;
};

export const adminUserDetailKey = (id: string) =>
  ["admin-user-detail", id] as const;

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminUserDetailKey(id),
    enabled: Boolean(id),
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`),
  });
}

export function useImpersonateAdminUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<AdminImpersonationResponse>(`/admin/users/${id}/impersonate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUserDetailKey(id) }),
  });
}

export function useDeleteAdminUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete<{ status: "deleted"; auditLogId: string }>(
        `/admin/users/${id}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.removeQueries({ queryKey: adminUserDetailKey(id) });
    },
  });
}

export function useRevokeUserSession(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete<{ status: "revoked"; auditLogId: string }>(
        `/admin/users/${userId}/sessions/${sessionId}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUserDetailKey(userId) }),
  });
}

export type { ApiError };
