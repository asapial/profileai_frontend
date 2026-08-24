"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AdminDashboardSummary } from "@/lib/hooks/useAdminDashboard";

const config = {
  users: { label: "New users", color: "#8b5cf6" },
  resumes: { label: "Resumes", color: "#06b6d4" },
  aiCalls: { label: "AI calls", color: "#f59e0b" },
} satisfies ChartConfig;

export function AdminTrendChart({ data }: { data: AdminDashboardSummary["trends"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="size-4 text-violet-500" />Seven-day platform trend</CardTitle>
        <CardDescription>New users, resume creation, and successful AI operations.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Trend data is unavailable.</p>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full aspect-auto">
            <AreaChart data={data} accessibilityLayer margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} width={34} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="users" type="monotone" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.14} />
              <Area dataKey="resumes" type="monotone" stroke="var(--color-resumes)" fill="var(--color-resumes)" fillOpacity={0.12} />
              <Area dataKey="aiCalls" type="monotone" stroke="var(--color-aiCalls)" fill="var(--color-aiCalls)" fillOpacity={0.1} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
