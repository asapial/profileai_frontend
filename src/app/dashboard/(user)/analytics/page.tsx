"use client";

import { BarChart3, Briefcase, FileText, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useApplications } from "@/lib/hooks/useApplications";

export default function UserAnalyticsPage() {
  const summary = useDashboardSummary();
  const applications = useApplications({ limit: 100 });
  const stats = summary.data?.stats;
  const cards = [
    { label: "Resumes", value: stats?.resumesCreated ?? 0, icon: FileText },
    { label: "Active applications", value: stats?.activeApplications ?? 0, icon: Briefcase },
    { label: "Average ATS score", value: stats?.averageAtsScore ?? 0, icon: Gauge },
    { label: "Tracked opportunities", value: applications.data?.items.length ?? 0, icon: BarChart3 },
  ];
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Analytics</h1><p className="text-sm text-muted-foreground">Live performance indicators from your resumes and application tracker.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardContent className="flex items-center gap-4 p-5"><Icon className="size-5 text-violet-600" /><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="text-base">Application pipeline</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-5">
        {(applications.data?.counts ?? []).map((count) => <div key={count.status} className="rounded-lg border p-4"><p className="text-xl font-semibold">{count._count._all}</p><p className="text-xs text-muted-foreground">{count.status}</p></div>)}
      </CardContent></Card>
    </div>
  );
}
