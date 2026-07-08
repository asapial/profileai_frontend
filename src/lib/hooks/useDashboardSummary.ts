"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  completionPercentage: number;
  missingFields: string[];
};

export type LimitUsage = {
  resumeLimit: number;
  apiLimit: number;
  resumeUsed: number;
  apiUsed: number;
  resetAt: string;
  resumePercent: number;
  apiPercent: number;
};

export type DashboardStats = {
  resumesCreated: number;
  activeApplications: number;
  averageAtsScore: number;
  unreadNotifications: number;
};

export type RecentResume = {
  id: string;
  title: string;
  status: "DRAFT" | "GENERATED" | "EXPORTED";
  updatedAt: string;
};

export type RecentApplication = {
  id: string;
  company: string;
  role: string;
  status:
    | "APPLIED"
    | "INTERVIEW"
    | "OFFER"
    | "REJECTED"
    | "WITHDRAWN";
  appliedAt: string;
};

export type NotificationItem = {
  id: string;
  type: "SYSTEM" | "RESUME" | "APPLICATION" | "BILLING" | "SECURITY";
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type DashboardSummary = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  profile: Profile;
  limits: LimitUsage;
  stats: DashboardStats;
  recentResumes: RecentResume[];
  recentApplications: RecentApplication[];
  notifications: NotificationItem[];
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () =>
      api.get<DashboardSummary>("/user/dashboard/summary"),
    staleTime: 60 * 1000,
  });
}
