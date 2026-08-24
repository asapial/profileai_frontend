"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

type Report = {
  users: number;
  resumes: number;
  applications: number;
  exports: number;
  revenue: number;
  generatedAt: string;
};

export default function AdminReportsPage() {
  const report = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<Report>("/admin/reports"),
  });
  const values = report.data
    ? [
        ["Users", report.data.users],
        ["Resumes", report.data.resumes],
        ["Applications", report.data.applications],
        ["Exports", report.data.exports],
        ["Revenue", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(report.data.revenue)],
      ]
    : [];
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Reports</h1><p className="text-sm text-muted-foreground">A live operational snapshot generated from the application database.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {values.map(([label, value]) => <Card key={String(label)}><CardContent className="p-5"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
      {!report.isLoading && !report.data && <p className="text-sm text-destructive">Report data is unavailable.</p>}
    </div>
  );
}
