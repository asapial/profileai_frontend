"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type FlagEnvironment = "DEV" | "STAGING" | "PRODUCTION";

export type FlagTargeting = {
  planIds: string[];
  regions: string[];
  userIds: string[];
};

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  environment: FlagEnvironment;
  targeting: FlagTargeting;
  updatedAt: string;
};

export const ADMIN_FLAGS_QUERY_KEY = ["admin-flags"] as const;

export function useAdminFeatureFlags() {
  return useQuery<FeatureFlag[]>({
    queryKey: ADMIN_FLAGS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await api.get<FeatureFlag[]>("/admin/feature-flags");
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
  });
}

export function useUpdateFlag(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FeatureFlag>) => {
      const res = await api.patch<FeatureFlag>(`/admin/feature-flags/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_FLAGS_QUERY_KEY });
    },
  });
}

export function useCreateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<FeatureFlag, "id" | "updatedAt">) => {
      const res = await api.post<FeatureFlag>("/admin/feature-flags", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_FLAGS_QUERY_KEY });
    },
  });
}

export function useDeleteFlag(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ ok: true }>(`/admin/feature-flags/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_FLAGS_QUERY_KEY });
    },
  });
}