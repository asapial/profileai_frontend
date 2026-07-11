"use client";

// Content moderation queue hooks.
// Covers A-P10 (resume/share reports) and the inline reports queue.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";

export type ModerationItemKind = "RESUME" | "SHARE_LINK" | "COMMENT";

export type ModerationItemStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REMOVED";

export type ModerationItem = {
  id: string;
  kind: ModerationItemKind;
  status: ModerationItemStatus;
  reason: string | null;
  reportedBy: { id: string; name: string | null } | null;
  author: { id: string; name: string | null };
  title: string;
  preview: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  reportCount: number;
};

export type ModerationFilters = {
  status?: ModerationItemStatus | "ALL";
  kind?: ModerationItemKind | "ALL";
  q?: string;
};

export const ADMIN_MODERATION_QUERY_KEY = ["admin-moderation"] as const;

export function useAdminModeration(filters: ModerationFilters = {}) {
  return useQuery({
    queryKey: [...ADMIN_MODERATION_QUERY_KEY, filters],
    queryFn: async () => {
      try {
        const qs = new URLSearchParams();
        if (filters.status && filters.status !== "ALL")
          qs.set("status", filters.status);
        if (filters.kind && filters.kind !== "ALL") qs.set("kind", filters.kind);
        if (filters.q) qs.set("q", filters.q);
        const path =
          qs.toString().length > 0
            ? `/admin/moderation?${qs.toString()}`
            : "/admin/moderation";
        const r = await api.get<ModerationItem[]>(path);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404)
          return [] as ModerationItem[];
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useResolveModerationItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      action: ModerationItemStatus;
      note?: string;
    }) =>
      api.post<ModerationItem>(`/admin/moderation/${input.id}/resolve`, {
        action: input.action,
        note: input.note,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ADMIN_MODERATION_QUERY_KEY }),
  });
}