"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "EXPIRED";

export type AnnouncementAudience = {
  planIds: string[];
  regions: string[];
  // Signup age in days; e.g. { min: 0, max: 30 } for new users.
  signupAgeDays: { min: number; max: number } | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  status: AnnouncementStatus;
  publishAt: string | null;
  expiresAt: string | null;
  audience: AnnouncementAudience;
  // Severity affects banner color: INFO | SUCCESS | WARNING | DANGER.
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  impressions: number;
  clicks: number;
};

export const ADMIN_ANNOUNCEMENTS_QUERY_KEY = ["admin-announcements"] as const;

export function useAdminAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ADMIN_ANNOUNCEMENTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await api.get<Announcement[]>(
          "/admin/announcements",
        );
        return res;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Announcement, "id" | "impressions" | "clicks">) => {
      const res = await api.post<Announcement>(
        "/admin/announcements",
        payload,
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAnnouncement(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<Announcement, "id" | "impressions" | "clicks">>,
    ) => {
      const res = await api.patch<Announcement>(
        `/admin/announcements/${id}`,
        payload,
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}

export function usePublishAnnouncement(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<Announcement>(
        `/admin/announcements/${id}/publish`,
        {},
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}

export function useRetireAnnouncement(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<Announcement>(
        `/admin/announcements/${id}/retire`,
        {},
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}