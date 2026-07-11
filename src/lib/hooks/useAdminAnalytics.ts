"use client";

// Admin platform analytics.
//
// The `/admin/analytics` endpoint is expected to return a small bundle of
// time series + counters. We render sparklines + a funnel table directly
// from the response so the page works even if a heavy chart lib isn't
// installed.

import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type AnalyticsSeries = {
  /** ISO date string for each bucket. */
  date: string;
  count: number;
};

export type AnalyticsFunnelStage = {
  label: string;
  count: number;
};

export type AnalyticsPlanMix = {
  plan: string;
  users: number;
};

export type AdminAnalyticsSummary = {
  range: { from: string; to: string };
  signups: AnalyticsSeries[];
  activeUsers: AnalyticsSeries[];
  funnel: AnalyticsFunnelStage[];
  planMix: AnalyticsPlanMix[];
  totals: {
    signups: number;
    activeUsers: number;
    mrr: number;
    arpu: number;
    trialConversion: number;
  };
  revenue: AnalyticsSeries[];
  atsDistribution: Array<{ bucket: string; count: number }>;
};

export const ADMIN_ANALYTICS_QUERY_KEY = ["admin-analytics"] as const;

export function useAdminAnalytics(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [
      ...ADMIN_ANALYTICS_QUERY_KEY,
      range?.from ?? "",
      range?.to ?? "",
    ],
    queryFn: async () => {
      try {
        const qs =
          range && (range.from || range.to)
            ? `?${new URLSearchParams({
                ...(range.from ? { from: range.from } : {}),
                ...(range.to ? { to: range.to } : {}),
              }).toString()}`
            : "";
        const r = await api.get<AdminAnalyticsSummary>(
          `/admin/analytics${qs}`,
        );
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}
