"use client";

// Subscription plan management hooks (A-P13).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type BillingInterval = "MONTHLY" | "YEARLY";

export type PlanFeature = {
  key: string;
  label: string;
  included: boolean;
  limit?: number | null;
};

export type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: PlanFeature[];
  isDefault: boolean;
  isArchived: boolean;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  trialDays: number;
  activeSubscribers: number;
};

export const ADMIN_PLANS_QUERY_KEY = ["admin-plans"] as const;

export function useAdminPlans() {
  return useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: async () => {
      try {
        const r = await api.get<Plan[]>("/admin/plans");
        return r;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404)
          return [] as Plan[];
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Plan>) => api.post<Plan>("/admin/plans", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY }),
  });
}

export function useUpdatePlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Plan>) =>
      api.put<Plan>(`/admin/plans/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY }),
  });
}

export function useArchivePlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<Plan>(`/admin/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY }),
  });
}
