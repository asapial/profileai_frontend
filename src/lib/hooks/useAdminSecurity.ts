"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type FailedLoginBucket = {
  hour: string;
  count: number;
};

export type SuspiciousIp = {
  ip: string;
  attempts: number;
  countries: string[];
  lastSeen: string;
};

export type MfaCoverage = {
  enabledCount: number;
  disabledCount: number;
  enforcedRoles: string[];
};

export type SecuritySummary = {
  failedLogins24h: number;
  failedLoginsTrend: FailedLoginBucket[];
  suspiciousIps: SuspiciousIp[];
  mfa: MfaCoverage;
  bannedUsers: number;
  activeAdmins: number;
  highRiskSessions: number;
};

export const ADMIN_SECURITY_QUERY_KEY = ["admin-security"] as const;

export function useAdminSecurity() {
  return useQuery<SecuritySummary | null>({
    queryKey: ADMIN_SECURITY_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await api.get<SecuritySummary>("/admin/security");
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ ok: true }>(`/admin/users/${id}/ban`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_SECURITY_QUERY_KEY });
    },
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ ok: true }>(`/admin/users/${id}/unban`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_SECURITY_QUERY_KEY });
    },
  });
}