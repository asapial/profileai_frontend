"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type AuditActor = {
  id: string;
  email: string;
  name: string | null;
};

export type AuditEntry = {
  id: string;
  createdAt: string;
  actor: AuditActor | null;
  action: string;
  category:
    | "AUTH"
    | "USER"
    | "BILLING"
    | "TEMPLATE"
    | "CONTENT"
    | "SETTINGS"
    | "SECURITY"
    | "OTHER";
  target: { type: string; id: string; label?: string | null } | null;
  ip: string | null;
  userAgent: string | null;
  payload: Record<string, unknown>;
};

export type AdminAuditFilters = {
  category?: AuditEntry["category"] | "ALL";
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
};

export const ADMIN_AUDIT_QUERY_KEY = ["admin-audit-log"] as const;

export function adminAuditKey(filters: AdminAuditFilters = {}) {
  return [...ADMIN_AUDIT_QUERY_KEY, filters] as const;
}

export function useAdminAuditLog(filters: AdminAuditFilters = {}) {
  return useQuery<AuditEntry[]>({
    queryKey: adminAuditKey(filters),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (filters.category) qs.set("category", filters.category);
      if (filters.actorId) qs.set("actorId", filters.actorId);
      if (filters.action) qs.set("action", filters.action);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);
      if (filters.search) qs.set("search", filters.search);
      const path = qs.toString()
        ? `/admin/audit-log?${qs.toString()}`
        : "/admin/audit-log";
      try {
        const res = await api.get<AuditEntry[]>(path);
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
  });
}

export type AuditDetail = AuditEntry & {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export function useAdminAuditEntry(id: string) {
  return useQuery<AuditDetail | null>({
    queryKey: ["admin-audit-entry", id],
    queryFn: async () => {
      try {
        const res = await api.get<AuditDetail>(`/admin/audit-log/${id}`);
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(id),
  });
}

export function useExportAuditLog() {
  return useMutation({
    mutationFn: async (filters: AdminAuditFilters) => {
      const qs = new URLSearchParams();
      if (filters.category) qs.set("category", filters.category);
      if (filters.actorId) qs.set("actorId", filters.actorId);
      if (filters.action) qs.set("action", filters.action);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);
      const path = qs.toString()
        ? `/admin/audit-log/export?${qs.toString()}`
        : "/admin/audit-log/export";
      const res = await api.get<{ url: string }>(path);
      return res.data;
    },
  });
}