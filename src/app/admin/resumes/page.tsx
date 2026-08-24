"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminResume = {
  id: string;
  title: string;
  type: string;
  status: string;
  atsScore: number | null;
  updatedAt: string;
  user: { name: string | null; email: string };
  template: { name: string };
};

export default function AdminResumesPage() {
  const query = useQuery({
    queryKey: ["admin-resumes"],
    queryFn: () => api.get<AdminResume[]>("/admin/resumes"),
  });
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Resumes</h1><p className="text-sm text-muted-foreground">Operational visibility into resume activity and template usage.</p></div>
      <Card><CardHeader><CardTitle className="text-base">{query.data?.length ?? 0} resumes</CardTitle></CardHeader><CardContent className="space-y-2">
        {query.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : query.data?.length ? query.data.map((resume) => (
          <div key={resume.id} className="grid gap-2 rounded-lg border p-4 text-sm sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
            <div><p className="font-medium">{resume.title}</p><p className="text-xs text-muted-foreground">{resume.template.name}</p></div>
            <div><p>{resume.user.name || resume.user.email}</p><p className="text-xs text-muted-foreground">{resume.user.email}</p></div>
            <Badge variant="outline">{resume.status}</Badge>
            <span className="text-xs text-muted-foreground">{resume.atsScore === null ? "Not scored" : `ATS ${resume.atsScore}`}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">No resumes have been created yet.</p>}
      </CardContent></Card>
    </div>
  );
}
