"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";

// ─── Shared types ────────────────────────────────────────────────────────────

export type BillingInterval = "MONTH" | "YEAR";

export type Plan = {
  id: string;
  slug: "free" | "pro" | "business" | string;
  name: string;
  description: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  /** Amount in the smallest currency unit (cents for USD). */
  amount: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  apiLimit: number;
  resumeLimit: number;
};

export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "UNPAID";

export type Subscription = {
  id: string;
  status: SubscriptionStatus;
  /** ISO 8601 timestamp. */
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  couponCode: string | null;
} | null;

export type CurrentSubscription = {
  plan: Plan;
  subscription: Subscription;
};

export type Invoice = {
  id: string;
  stripeInvoiceId: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: "PAID" | "OPEN" | "DRAFT" | string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  /** ISO 8601 timestamp. */
  issuedAt: string;
  paidAt: string | null;
};

export type CouponPreview = {
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  currency: string;
  duration: string | null;
  /** Plan amount before the coupon, in cents. */
  baseAmount: number;
  /** Plan amount after the coupon, in cents. */
  finalAmount: number;
  currencyCode: string;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.get<Plan[]>("/billing/plans"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => api.get<CurrentSubscription>("/billing/subscription"),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation<
    { url: string },
    ApiError,
    { planSlug: string; couponCode?: string }
  >({
    mutationFn: (body) => api.post<{ url: string }>("/billing/checkout", body),
    onSuccess: () => {
      // Subscription state changes once the webhook lands; pre-emptively
      // invalidate so the success page shows fresh data without a refresh.
      qc.invalidateQueries({ queryKey: ["billing"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useBillingPortal() {
  return useMutation<{ url: string }, ApiError, void>({
    mutationFn: () => api.post<{ url: string }>("/billing/portal", {}),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation<{ id: string; cancelAtPeriodEnd: true }, ApiError, void>({
    mutationFn: () => api.post<{ id: string; cancelAtPeriodEnd: true }>(
      "/billing/cancel",
      {}
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => api.get<Invoice[]>("/billing/invoices"),
  });
}

export function useCouponPreview() {
  return useMutation<
    CouponPreview,
    ApiError,
    { code: string; planSlug: string }
  >({
    mutationFn: (body) =>
      api.post<CouponPreview>("/billing/coupons/preview", body),
  });
}