"use client";

// Admin stat cards — pulled out of the static `AdminSectionCards`
// placeholders so the dashboard view can hydrate from real data. The
// visual language (gradient + tabular numerals) matches the user
// `SectionCards` so the chrome stays consistent across roles.

import {
  IconTrendingDown,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminStat } from "@/lib/hooks/useAdminDashboard";

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function trendIcon(trend?: AdminStat["trend"]): Icon | null {
  if (trend === "down") return IconTrendingDown;
  if (trend === "up") return IconTrendingUp;
  return null;
}

export function AdminStatCards({ stats }: { stats: AdminStat[] }) {
  if (!stats.length) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="@container/card opacity-60">
            <CardHeader>
              <CardDescription>—</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                —
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-violet-500/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((stat) => {
        const Icon = trendIcon(stat.trend);
        const trendLabel =
          stat.trend === "up"
            ? "Trending up"
            : stat.trend === "down"
              ? "Trending down"
              : "No change";
        const tone =
          stat.trend === "down"
            ? "text-rose-600 dark:text-rose-400"
            : stat.trend === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground";
        return (
          <Card key={stat.label} className="@container/card">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {formatValue(stat.value)}
              </CardTitle>
              {stat.hint ? (
                <CardAction>
                  <Badge variant="outline" className={tone}>
                    {Icon ? <Icon /> : null}
                    {stat.hint}
                  </Badge>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {trendLabel}
                {Icon ? <Icon className="size-4" /> : null}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
