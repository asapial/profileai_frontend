"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ──────────────────────────────────────────────────────────
 * Types — mirror backend ExportJob.
 * ────────────────────────────────────────────────────────── */

export type ExportJobKind = "USER_DATA" | "RESUME_PDF" | "COVER_LETTER_PDF";
export type ExportJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export type ExportJob = {
  id: string;
  userId: string;
  kind: ExportJobKind;
  status: ExportJobStatus;
  resultUrl: string | null;
  errorMsg: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

/* ──────────────────────────────────────────────────────────
 * List (no cursor, plain `take`)
 * ────────────────────────────────────────────────────────── */

function buildListQuery(params: { limit?: number; status?: ExportJobStatus }): string {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.status) sp.set("status", params.status);
  const qs = sp.toString();
  return qs ? `/user/export-jobs?${qs}` : "/user/export-jobs";
}

export function useExportJobList(params?: {
  limit?: number;
  status?: ExportJobStatus;
}) {
  const limit = params?.limit ?? 50;
  const status = params?.status;
  return useQuery({
    queryKey: ["export-jobs", "list", { limit, status: status ?? null }],
    queryFn: () =>
      api.get<ExportJob[]>(buildListQuery({ limit, status })),
    // PENDING / RUNNING jobs can flip to DONE quickly — refresh aggressively.
    refetchInterval: (query) => {
      const data = query.state.data as ExportJob[] | undefined;
      if (!data) return false;
      const hasInflight = data.some(
        (j) => j.status === "PENDING" || j.status === "RUNNING"
      );
      return hasInflight ? 3000 : false;
    },
  });
}

/* ──────────────────────────────────────────────────────────
 * Detail
 * ────────────────────────────────────────────────────────── */

export function useExportJob(id: string | null) {
  return useQuery({
    queryKey: ["export-jobs", "detail", id ?? ""],
    enabled: Boolean(id),
    queryFn: () => api.get<ExportJob>(`/user/export-jobs/${id}`),
    // Poll while a single job is still in flight.
    refetchInterval: (query) => {
      const data = query.state.data as ExportJob | undefined;
      if (!data) return false;
      return data.status === "PENDING" || data.status === "RUNNING"
        ? 2500
        : false;
    },
  });
}

/* ──────────────────────────────────────────────────────────
 * Mutations
 * ────────────────────────────────────────────────────────── */

export function useRequestUserExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ExportJob>("/user/export", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-jobs"] });
    },
  });
}
