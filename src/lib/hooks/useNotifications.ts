"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotificationItem } from "./useDashboardSummary";

export type NotificationsList = {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
};

export function useNotifications(params?: { limit?: number; unreadOnly?: boolean }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.unreadOnly) search.set("unread", "true");
  const qs = search.toString();
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () =>
      api.get<NotificationsList>(`/notifications${qs ? `?${qs}` : ""}`),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<NotificationItem>(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<{ updated: number }>(`/notifications/read-all`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
