"use client";

// Admin template management hooks (A-P5, A-P6, A-P7).
//
// Drives the list / create / edit views. Mirrors the user-facing
// `useTemplates` data shape but exposes admin-only mutations:
// status toggle, default toggle, delete (blocked when in use),
// and version-history snapshots.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type {
  Template as PublicTemplate,
  TemplateCategory,
} from "@/lib/hooks/useTemplates";

export type AdminTemplateFilters = {
  category?: TemplateCategory | "ALL";
  status?: "all" | "active" | "inactive";
  documentType?: "ALL" | "RESUME" | "CV";
  reviewStatus?: "ALL" | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

export type TemplateLayoutConfig = {
  fontFamily?: string;
  accentColor?: string;
  spacing?: "compact" | "comfortable" | "airy";
  sectionOrder?: string[];
};

export type Template = PublicTemplate & {
  isAtsFriendly: boolean;
  layoutConfig: TemplateLayoutConfig;
};

export type TemplateHistorySnapshot = {
  id: string;
  savedAt: string;
  savedBy: string;
  configSnapshot: TemplateLayoutConfig & { name?: string };
};

const ADMIN_KEY = ["admin-templates"] as const;

export const adminTemplateKeys = {
  all: ADMIN_KEY,
  detail: (id: string) => ["admin-templates", "detail", id] as const,
  history: (id: string) => ["admin-templates", "history", id] as const,
};

export function useAdminTemplates(filters: AdminTemplateFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "ALL") {
    params.set("category", filters.category);
  }
  if (filters.documentType && filters.documentType !== "ALL") params.set("documentType", filters.documentType);
  if (filters.reviewStatus && filters.reviewStatus !== "ALL") params.set("reviewStatus", filters.reviewStatus);
  const qs = params.toString();
  return useQuery({
    queryKey: [...ADMIN_KEY, filters],
    queryFn: () =>
      api.get<Template[]>(`/admin/templates${qs ? `?${qs}` : ""}`).then((items) =>
        filters.status === "active" ? items.filter((item) => item.isActive) : filters.status === "inactive" ? items.filter((item) => !item.isActive) : items,
      ),
  });
}

export function useAdminTemplate(id: string | null) {
  return useQuery({
    queryKey: adminTemplateKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => api.get<Template>(`/admin/templates/${id}`),
  });
}

export function useAdminTemplateHistory(id: string | null) {
  return useQuery({
    queryKey: adminTemplateKeys.history(id ?? ""),
    enabled: Boolean(id),
    queryFn: () =>
      api.get<TemplateHistorySnapshot[]>(
        `/admin/templates/${id}/history`,
      ),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      name: string;
      description?: string | null;
      category: TemplateCategory;
      documentType: "RESUME" | "CV";
      isAtsFriendly?: boolean;
      layoutConfig: TemplateLayoutConfig;
      thumbnailUrl?: string | null;
      activateImmediately?: boolean;
    }) =>
      api.post<{ id: string; isActive: boolean }>("/admin/templates", {
        ...vars,
        isActive: vars.activateImmediately ?? false,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      name?: string;
      description?: string | null;
      category?: TemplateCategory;
      documentType?: "RESUME" | "CV";
      isAtsFriendly?: boolean;
      thumbnailUrl?: string | null;
      layoutConfig?: TemplateLayoutConfig;
    }) =>
      api.put<{ id: string; historySnapshotId: string }>(
        `/admin/templates/${id}`,
        vars,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: adminTemplateKeys.detail(id) });
      qc.invalidateQueries({ queryKey: adminTemplateKeys.history(id) });
    },
  });
}

export function useToggleTemplateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) =>
      api.patch<{ id: string; isActive: boolean }>(
        `/admin/templates/${vars.id}/status`,
        { isActive: vars.isActive },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export function useSetDefaultTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{
        id: string;
        isDefault: true;
        previousDefaultId: string | null;
      }>(`/admin/templates/${id}/default`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ status: "deleted"; id: string }>(
        `/admin/templates/${id}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export function useReviewTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: "APPROVED" | "REJECTED"; reason?: string }) =>
      api.patch<Template>(`/admin/templates/${id}/review`, { decision, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export type { ApiError, TemplateCategory };
