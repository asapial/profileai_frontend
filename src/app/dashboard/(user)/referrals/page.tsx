"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Award,
  Copy,
  Crown,
  Gift,
  Loader2,
  Mail,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGenerateLink,
  useLeaderboard,
  useReferralOverview,
  useRewards,
  type LeaderboardEntry,
  type ReferralRecentItem,
  type ReferralStatus,
  type RewardLedgerItem,
} from "@/lib/hooks/useReferrals";

const STATUS_TONE: Record<ReferralStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  REWARDED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const STATUS_LABEL: Record<ReferralStatus, string> = {
  PENDING: "Awaiting verification",
  REWARDED: "Rewarded",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
};

const REASON_LABEL: Record<string, string> = {
  REFERRAL_BONUS: "Referral bonus",
  REFERRED_SIGNUP: "Welcome bonus",
};

export default function ReferralsPage() {
  const overview = useReferralOverview();
  const rewards = useRewards();
  const leaderboard = useLeaderboard();
  const generate = useGenerateLink();

  const [shareMethod, setShareMethod] = useState<"copy" | "email" | null>(null);

  const data = overview.data;

  async function copyLink() {
    if (!data?.shareUrl) return;
    setShareMethod("copy");
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not access clipboard. Select and copy manually.");
    } finally {
      setShareMethod(null);
    }
  }

  async function shareEmail() {
    if (!data?.shareUrl) return;
    setShareMethod("email");
    const subject = encodeURIComponent("Try ProfileAI with my referral");
    const body = encodeURIComponent(
      `I thought you'd like ProfileAI — sign up with my link to get a bonus: ${data.shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setTimeout(() => setShareMethod(null), 500);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Referrals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite friends to ProfileAI — they get {data?.summary.refereeReward ?? "—"} AI credits, you get {data?.summary.referrerReward ?? "—"} for every verified signup.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-violet-500" />
              Your referral link
            </CardTitle>
            <CardDescription>
              Share this link — rewards unlock when your friend verifies their email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.isLoading ? (
              <div className="h-12 animate-pulse rounded-md bg-muted/50" />
            ) : data ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground">
                    {data.shareUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    disabled={shareMethod === "copy"}
                    className="gap-1.5"
                  >
                    {shareMethod === "copy" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareEmail}
                    disabled={shareMethod === "email"}
                    className="gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending}
                    className="gap-1.5"
                  >
                    {generate.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Regenerate
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Code:</span>
                  <code className="rounded bg-violet-50 px-2 py-0.5 font-mono font-semibold text-violet-700">
                    {data.code}
                  </code>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load your referral code.</p>
            )}
          </CardContent>
        </Card>

        <SummaryCard
          isLoading={overview.isLoading}
          totalInvites={data?.summary.totalInvites ?? 0}
          rewarded={data?.summary.rewarded ?? 0}
          pending={data?.summary.pending ?? 0}
          totalCredits={data?.summary.totalCredits ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RecentReferrals
          isLoading={overview.isLoading}
          items={data?.recent ?? []}
        />

        <RewardsLedger
          isLoading={rewards.isLoading}
          items={rewards.data ?? []}
        />
      </div>

      <Leaderboard
        isLoading={leaderboard.isLoading}
        entries={leaderboard.data ?? []}
      />
    </div>
  );
}

function SummaryCard({
  isLoading,
  totalInvites,
  rewarded,
  pending,
  totalCredits,
}: {
  isLoading: boolean;
  totalInvites: number;
  rewarded: number;
  pending: number;
  totalCredits: number;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-muted/50" />
          <div className="h-10 w-32 animate-pulse rounded bg-muted/50" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-violet-500" />
          Your rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Stat
          label="AI credits earned"
          value={totalCredits.toLocaleString()}
          tone="violet"
        />
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <MiniStat label="Invites" value={totalInvites} />
          <MiniStat label="Rewarded" value={rewarded} tone="emerald" />
          <MiniStat label="Pending" value={pending} tone="amber" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "violet";
}) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-violet-900">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-foreground";
  return (
    <div className="rounded-md bg-muted/40 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function RecentReferrals({
  isLoading,
  items,
}: {
  isLoading: boolean;
  items: ReferralRecentItem[];
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-violet-500" />
          People you invited
        </CardTitle>
        <CardDescription>
          Status updates as soon as they verify their email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyRecent />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {r.refereeName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.refereeEmail} · {formatRelative(r.createdAt)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_TONE[r.status]
                  }`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyRecent() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <Gift className="h-7 w-7 text-violet-500" />
      <h3 className="mt-2 text-sm font-semibold">No invites yet</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Share your link to start earning credits. Your first invite could land you 50 AI credits.
      </p>
    </div>
  );
}

function RewardsLedger({
  isLoading,
  items,
}: {
  isLoading: boolean;
  items: RewardLedgerItem[];
}) {
  const total = useMemo(
    () =>
      items
        .filter((i) => i.status === "GRANTED")
        .reduce((acc, i) => acc + i.amount, 0),
    [items]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          Reward history
        </CardTitle>
        <CardDescription>
          Total granted: {total.toLocaleString()} credits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rewards you earn will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {REASON_LABEL[r.reason] ?? r.reason}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatRelative(r.createdAt)}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    r.status === "GRANTED"
                      ? "text-emerald-700"
                      : r.status === "REVOKED"
                        ? "text-rose-700"
                        : "text-amber-700"
                  }`}
                >
                  {r.status === "REVOKED" ? "−" : "+"}
                  {r.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Leaderboard({
  isLoading,
  entries,
}: {
  isLoading: boolean;
  entries: LeaderboardEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-amber-500" />
          Top referrers · last 90 days
        </CardTitle>
        <CardDescription>
          Compete for the monthly bonus pool.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No leaderboard data yet.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {entries.map((e) => (
              <li
                key={e.userId}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  e.isYou
                    ? "border border-violet-200 bg-violet-50"
                    : "border border-border bg-background"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                      e.rank === 1
                        ? "bg-amber-400 text-amber-900"
                        : e.rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : e.rank === 3
                            ? "bg-orange-300 text-orange-900"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {e.rank}
                  </span>
                  <span className="font-medium">
                    {e.name}
                    {e.isYou ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-violet-700">
                        you
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {e.referralCount}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.round(diff / minute)}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}