"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ReferralStatus = "PENDING" | "REWARDED" | "EXPIRED" | "REJECTED";

export type ReferralRecentItem = {
  id: string;
  refereeName: string;
  refereeEmail: string;
  status: ReferralStatus;
  createdAt: string;
  rewardedAt: string | null;
};

export type ReferralSummary = {
  totalInvites: number;
  rewarded: number;
  pending: number;
  totalCredits: number;
  referrerReward: number;
  refereeReward: number;
};

export type ReferralOverview = {
  code: string;
  shareUrl: string;
  summary: ReferralSummary;
  recent: ReferralRecentItem[];
  firstName: string | null;
};

export type RewardLedgerItem = {
  id: string;
  amount: number;
  reason: string;
  type: "API_CREDIT" | "RESUME_CREDIT";
  status: "PENDING" | "GRANTED" | "REVOKED";
  createdAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  referralCode: string | null;
  referralCount: number;
  isYou: boolean;
};

export function useReferralOverview() {
  return useQuery({
    queryKey: ["referrals", "overview"],
    queryFn: () => api.get<ReferralOverview>("/referrals/me"),
  });
}

export function useGenerateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ code: string; shareUrl: string }>("/referrals/generate-link", {}),
    onSuccess: (data) => {
      // The server idempotently returns the same code; merge into the
      // overview cache so the UI updates without a refetch.
      qc.setQueryData<ReferralOverview | undefined>(
        ["referrals", "overview"],
        (prev) =>
          prev
            ? { ...prev, code: data.code, shareUrl: data.shareUrl }
            : prev
      );
      qc.invalidateQueries({ queryKey: ["referrals", "overview"] });
    },
  });
}

export function useRewards() {
  return useQuery({
    queryKey: ["referrals", "rewards"],
    queryFn: () => api.get<RewardLedgerItem[]>("/referrals/rewards"),
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["referrals", "leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/referrals/leaderboard"),
  });
}
