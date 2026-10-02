"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AdminSubscriptionRow = {
  user: { id: string; name: string | null; email: string; isActive: boolean };
  plan: { id: string | null; name: string; slug: string; interval: "MONTH" | "YEAR" | null };
  status: "FREE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "UNPAID";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    resumes: { used: number; limit: number };
    ai: { used: number; limit: number };
    resetAt: string | null;
    overrideByAdmin: boolean;
  };
};

export type AdminSubscriptionsResponse = {
  subscriptions: AdminSubscriptionRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const KEY = ["admin-subscriptions"] as const;

export function useAdminSubscriptions(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: [...KEY, page, search],
    queryFn: () => api.get<AdminSubscriptionsResponse>(`/admin/subscriptions?${params}`),
    placeholderData: (previous) => previous,
  });
}

export function useResetPlanUsage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post(`/admin/subscriptions/${userId}/reset-usage`, {}),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: KEY });
      client.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
