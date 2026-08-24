"use client";

// Admin dashboard data shape + TanStack Query hook.
//
// The server fetcher (`lib/adminApi.ts`) is used inside the page's
// server component; this client hook is what powers the live "refresh"
// button and any future interactive widgets (alerts panel, quick-link
// toggles, etc.).

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AdminStat = {
  key: string;
  label: string;
  value: number;
  /** Pre-formatted helper text (e.g. "+8.2% this month"). */
  hint?: string;
  /** Trending up = positive, down = negative. */
  trend?: "up" | "down" | "flat";
  format?: "number" | "currency";
  currency?: string;
};

export type AdminActivityItem = {
  id: string;
  actor: { id: string; name: string | null; role: "USER" | "ADMIN" };
  action: string;
  target: string | null;
  createdAt: string;
};

export type AdminAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  body: string | null;
  createdAt: string;
};

export type AdminQuickLink = {
  label: string;
  href: string;
  description: string;
};

export type AdminDashboardSummary = {
  totalUsers: number;
  activeUsersToday: number;
  totalResumes: number;
  aiCallsToday: number;
  openSecurityAlerts: number;
  stats: AdminStat[];
  trends: Array<{
    date: string;
    label: string;
    users: number;
    resumes: number;
    aiCalls: number;
  }>;
  activity: AdminActivityItem[];
  alerts: AdminAlert[];
  quickLinks: AdminQuickLink[];
  errors: Array<{ section: "metrics" | "trends" | "activity" | "alerts"; message: string }>;
  generatedAt: string;
};

export const ADMIN_DASHBOARD_QUERY_KEY = ["admin-dashboard"] as const;

export function useAdminDashboard(initialData?: AdminDashboardSummary) {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: () => api.get<AdminDashboardSummary>("/admin/dashboard"),
    staleTime: 60 * 1000,
    initialData,
  });
}
