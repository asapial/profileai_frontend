"use client";

// Admin Platform Analytics (A-P9).
//
// Renders the four major sections of the analytics spec:
//   1. KPI strip    (signups / DAU / MRR / ARPU / trial conversion)
//   2. Growth       (signups spark)
//   3. Funnel       (signup → first resume → first export → paid)
//   4. Revenue      (mrr spark + plan mix)
//
// Charts are inline SVG so we don't add a chart library.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconChartBar,
  IconChartLine,
  IconDownload,
  IconReportAnalytics,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAnalytics,
  type AdminAnalyticsSummary,
  type AnalyticsSeries,
} from "@/lib/hooks/useAdminAnalytics";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export function AdminAnalyticsClient() {
  const router = useRouter();
  const [days, setDays] = useState<number>(30);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);
  const to = useMemo(() => new Date().toISOString(), []);

  const { data, isLoading } = useAdminAnalytics({ from, to });

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Growth, retention, funnel conversion, and revenue — last{" "}
            {days} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border">
            {RANGES.map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant={days === r.days ? "default" : "ghost"}
                onClick={() => setDays(r.days)}
                className="rounded-none"
              >
                {r.label}
              </Button>
            ))}
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/admin/reports?range=${days}d`}>
              <IconDownload className="mr-1.5 size-4" />
              Export PDF
            </a>
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <KpiStrip totals={data.totals} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Daily signups</h2>
                <IconChartLine className="text-muted-foreground size-4" />
              </div>
              <Separator className="my-3" />
              {data.signups.length === 0 ? (
                <Empty />
              ) : (
                <Sparkline series={data.signups} />
              )}
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Active users</h2>
                <Badge variant="secondary">{data.totals.activeUsers}</Badge>
              </div>
              <Separator className="my-3" />
              {data.activeUsers.length === 0 ? (
                <Empty />
              ) : (
                <Sparkline series={data.activeUsers} />
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-base font-semibold">Funnel</h2>
              <Separator className="my-3" />
              <Funnel data={data.funnel} />
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Plan mix</h2>
                <IconChartBar className="text-muted-foreground size-4" />
              </div>
              <Separator className="my-3" />
              <PlanMix data={data.planMix} />
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-base font-semibold">Revenue (USD)</h2>
            <Separator className="my-3" />
            {data.revenue.length === 0 ? <Empty /> : <Sparkline series={data.revenue} tall />}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold">ATS score distribution</h2>
            <Separator className="my-3" />
            <AtsDistribution
              rows={data.atsDistribution}
              onDrill={() => router.push("/admin/reports?section=ats")}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function KpiStrip({ totals }: { totals: AdminAnalyticsSummary["totals"] }) {
  const cards = [
    { label: "Signups", value: totals.signups.toLocaleString() },
    { label: "Active users", value: totals.activeUsers.toLocaleString() },
    { label: "MRR", value: `$${totals.mrr.toLocaleString()}` },
    { label: "ARPU", value: `$${totals.arpu.toFixed(2)}` },
    {
      label: "Trial → Paid",
      value: `${(totals.trialConversion * 100).toFixed(1)}%`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            {c.label}
          </div>
          <div className="mt-2 text-2xl font-semibold">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

function Sparkline({
  series,
  tall = false,
}: {
  series: AnalyticsSeries[];
  tall?: boolean;
}) {
  const w = 600;
  const h = tall ? 160 : 120;
  const max = Math.max(1, ...series.map((s) => s.count));
  const min = Math.min(0, ...series.map((s) => s.count));
  const stepX = series.length <= 1 ? w : w / (series.length - 1);
  const points = series.map((s, i) => {
    const x = i * stepX;
    const yNorm = (s.count - min) / (max - min || 1);
    const y = h - yNorm * (h - 20) - 10;
    return { x, y };
  });
  const d = points.length
    ? "M " + points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")
    : "";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w},${h} L 0,${h} Z`} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="hsl(var(--primary))" />
      ))}
    </svg>
  );
}

function Funnel({ data }: { data: AdminAnalyticsSummary["funnel"] }) {
  if (data.length === 0) return <Empty />;
  const max = Math.max(1, ...data.map((s) => s.count));
  return (
    <div className="flex flex-col gap-3">
      {data.map((stage, i) => {
        const pct = (stage.count / max) * 100;
        const prev = i > 0 ? data[i - 1].count : stage.count;
        const stepDrop =
          i > 0 && prev > 0
            ? ((1 - stage.count / prev) * 100).toFixed(0)
            : null;
        return (
          <div key={stage.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span>{stage.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-medium">{stage.count.toLocaleString()}</span>
                {stepDrop !== null ? (
                  <Badge variant="secondary" className="text-[10px]">
                    −{stepDrop}%
                  </Badge>
                ) : null}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlanMix({ data }: { data: AdminAnalyticsSummary["planMix"] }) {
  if (data.length === 0) return <Empty />;
  const total = data.reduce((sum, p) => sum + p.users, 0) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {data.map((p) => {
        const pct = (p.users / total) * 100;
        return (
          <li key={p.plan} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{p.plan}</span>
              <span>
                {p.users.toLocaleString()} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AtsDistribution({
  rows,
  onDrill,
}: {
  rows: AdminAnalyticsSummary["atsDistribution"];
  onDrill: () => void;
}) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => {
        const pct = (r.count / max) * 100;
        return (
          <button
            key={r.bucket}
            onClick={onDrill}
            className="flex flex-col gap-1 rounded-md p-2 text-left transition hover:bg-muted/60"
          >
            <div className="flex items-center justify-between text-xs">
              <span>{r.bucket}</span>
              <span className="font-medium">{r.count.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Empty() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
      <IconReportAnalytics className="size-4" />
      No data in this window yet — try a wider range.
    </div>
  );
}
