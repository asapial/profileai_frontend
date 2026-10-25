"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  workplaceType: "REMOTE" | "HYBRID" | "ON_SITE" | "UNSPECIFIED";
  employmentType: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  salaryIsEstimated: boolean;
  canonicalUrl: string | null;
  sourceName: string;
  sourceType: string;
  lifecycle: "ACTIVE" | "POSSIBLY_EXPIRED" | "EXPIRED" | "REMOVED" | "UNKNOWN";
  disposition: "NEW" | "SHORTLISTED" | "DISMISSED";
  publishedAt: string | null;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  freshness?: "closed" | "unverified" | "stale" | "recent";
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number; listings: number };
  applications?: Array<{ id: string; status: string; appliedAt: string }>;
};

export type CreateJob = Pick<Job, "title" | "company" | "description"> &
  Partial<Pick<Job, "location" | "workplaceType" | "employmentType" | "canonicalUrl" | "sourceName">>;

export function useJobs(query = "") {
  return useQuery({
    queryKey: ["jobs", "list", query],
    queryFn: () => api.get<Job[]>(`/jobs${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  });
}

export function useJob(id: string) {
  return useQuery({ queryKey: ["jobs", "detail", id], queryFn: () => api.get<Job>(`/jobs/${id}`), enabled: Boolean(id) });
}

export function useCreateJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateJob) => api.post<Job>("/jobs", body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useCreateApplicationFromJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status = "SAVED" }: { id: string; status?: "SAVED" | "PREPARING" | "APPLIED" }) =>
      api.post<{ id: string }>(`/jobs/${id}/application`, { status }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["jobs"] });
      client.invalidateQueries({ queryKey: ["applications"] });
      client.invalidateQueries({ queryKey: ["career"] });
      client.invalidateQueries({ queryKey: ["harness"] });
      client.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useSetJobDisposition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, disposition }: { id: string; disposition: Job["disposition"] }) =>
      api.patch<Job>(`/jobs/${id}/disposition`, { disposition }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["jobs"] }),
  });
}
