"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExportJob = {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  user: { name: string | null; email: string };
};

export default function AdminExportsPage() {
  const jobs = useQuery({
    queryKey: ["admin-exports"],
    queryFn: () => api.get<ExportJob[]>("/admin/exports"),
  });
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Exports</h1><p className="text-sm text-muted-foreground">Monitor user-data, resume and cover-letter export jobs.</p></div>
      <Card><CardHeader><CardTitle className="text-base">Recent jobs</CardTitle></CardHeader><CardContent className="space-y-2">
        {jobs.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : jobs.data?.length ? jobs.data.map((job) => <div key={job.id} className="flex flex-col gap-2 rounded-lg border p-4 text-sm sm:flex-row sm:items-center"><div className="flex-1"><p className="font-medium">{job.kind}</p><p className="text-xs text-muted-foreground">{job.user.name || job.user.email} · {new Date(job.createdAt).toLocaleString()}</p></div><Badge variant="outline">{job.status}</Badge></div>) : <p className="text-sm text-muted-foreground">No export jobs yet.</p>}
      </CardContent></Card>
    </div>
  );
}
