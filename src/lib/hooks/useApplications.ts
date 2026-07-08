"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Application = {
  id: string;
  company: string;
  role: string;
  status:
    | "APPLIED"
    | "INTERVIEW"
    | "OFFER"
    | "REJECTED"
    | "WITHDRAWN";
  jobUrl: string | null;
  location: string | null;
  appliedAt: string;
  notes: string | null;
  resume?: { id: string; title: string } | null;
};

export type ApplicationsList = {
  items: Application[];
  nextCursor: string | null;
  counts: { status: string; _count: { _all: number } }[];
};

export function useApplications(params?: { status?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return useQuery({
    queryKey: ["applications", params],
    queryFn: () => api.get<ApplicationsList>(`/applications${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Application>) =>
      api.post<Application>("/applications", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Application>;
    }) => api.put<Application>(`/applications/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
