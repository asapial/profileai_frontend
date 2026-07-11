"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, api } from "@/lib/api";

export type CouponDiscountType = "PERCENT" | "FIXED";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  // Either `percentOff` or `amountOff` is populated based on `discountType`.
  percentOff: number;
  amountOff: number;
  currency: string;
  startsAt: string;
  expiresAt: string | null;
  maxRedemptions: number;
  redemptions: number;
  isActive: boolean;
  // IDs of plans this coupon applies to. Empty array = all plans.
  planIds: string[];
};

export type AdminCouponsFilters = {
  status?: "active" | "expired" | "scheduled" | "exhausted" | "all";
  search?: string;
};

export const ADMIN_COUPONS_QUERY_KEY = ["admin-coupons"] as const;

export function adminCouponsKey(filters: AdminCouponsFilters = {}) {
  return [...ADMIN_COUPONS_QUERY_KEY, filters] as const;
}

export function useAdminCoupons(filters: AdminCouponsFilters = {}) {
  return useQuery<Coupon[]>({
    queryKey: adminCouponsKey(filters),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.search) qs.set("search", filters.search);
      const path = qs.toString()
        ? `/admin/coupons?${qs.toString()}`
        : "/admin/coupons";
      try {
        const res = await api.get<Coupon[]>(path);
        return res.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
  });
}

type CouponPayload = Omit<Coupon, "id" | "redemptions">;

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CouponPayload) => {
      const res = await api.post<Coupon>("/admin/coupons", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
    },
  });
}

export function useUpdateCoupon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CouponPayload>) => {
      const res = await api.patch<Coupon>(`/admin/coupons/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
    },
  });
}

export function useDeactivateCoupon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<Coupon>(`/admin/coupons/${id}/deactivate`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
    },
  });
}