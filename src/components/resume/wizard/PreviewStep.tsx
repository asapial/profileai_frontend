"use client";

import { useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, CheckCircle2, Download, FileEdit, FileText, FileType2, Loader2, Palette, RefreshCcw, ShieldCheck, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TemplateRenderedPreview } from "@/components/resume/TemplateRenderedPreview";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useExportResume, type ResumeDetail } from "@/lib/hooks/useResumes";
import { downloadResumeExport } from "@/lib/resume/download";

export function PreviewStep({
  resume,
  onEdit,
  onRegenerate,
}: {
  resume: ResumeDetail;
  onEdit: () => void;
  onRegenerate: () => void;
}) {
  const { data, refetch } = useDashboardSummary();
  const limits = data?.limits;
  const exportMutation = useExportResume();

  // After a successful generation, the dashboard summary resumeUsed was bumped
  // server-side. Refetch once on mount so the user sees fresh usage.
  useEffect(() => {
    refetch();
  }, [refetch]);

  const resumePercent = limits?.resumePercent ?? 0;

  async function exportFile(fileType: "PDF" | "DOCX") {
    try {
      const result = await exportMutation.mutateAsync({ id: resume.id, fileType });
      if (!downloadResumeExport(result, `${resume.title}.${fileType.toLowerCase()}`)) {
        throw new Error("The export did not return a download URL.");
      }
      toast.success(`${fileType} export ready.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${fileType} export failed.`);
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,.13),rgba(139,92,246,.09),rgba(255,255,255,.62))] p-5 shadow-[0_24px_70px_-34px_rgba(16,185,129,.45)] backdrop-blur-xl dark:bg-[linear-gradient(135deg,rgba(6,78,59,.38),rgba(76,29,149,.2),rgba(15,23,42,.62))] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"><CheckCircle2 className="size-5" /></span>
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Ready to review</p><h2 className="mt-1 break-words text-lg font-semibold tracking-tight text-foreground">{resume.title}</h2><p className="mt-1 text-xs text-muted-foreground">Version {resume.version} · Saved automatically in My Documents</p></div>
          </div>
          <Button onClick={onEdit} className="h-10 w-full gap-2 rounded-xl bg-slate-950 px-5 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"><FileEdit className="size-4" />Open editor<ArrowRight className="size-4" /></Button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-white/50 bg-white/58 shadow-[0_28px_80px_-42px_rgba(30,20,60,.5)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
          <CardHeader className="border-b border-border/60 bg-background/35 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><CardTitle className="text-base">Document preview</CardTitle><CardDescription className="mt-1">The same canonical design is used for preview and export.</CardDescription></div><div className="flex max-w-full flex-wrap items-center gap-2"><span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-violet-500/20 bg-violet-500/8 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300"><Palette className="size-3 shrink-0" />{resume.template?.name ?? "Selected template"}</span><span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-bold">{resume.type}</span></div></div>
          </CardHeader>
          <CardContent className="bg-slate-200/55 p-3 sm:p-6 dark:bg-slate-900/55"><div className="mx-auto max-w-[794px] overflow-hidden rounded-xl shadow-2xl shadow-slate-900/15"><TemplateRenderedPreview resume={resume} scale={1} className="!rounded-xl" /></div></CardContent>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <Card className="border-violet-500/20 bg-white/62 shadow-xl shadow-violet-950/5 backdrop-blur-2xl dark:bg-slate-950/55">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Download className="size-4 text-violet-500" />Export document</CardTitle><CardDescription>Choose the format you need.</CardDescription></CardHeader>
            <CardContent className="space-y-2.5">
              <button type="button" onClick={() => void exportFile("PDF")} disabled={exportMutation.isPending} className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/75 p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-400/40 hover:shadow-lg disabled:opacity-60"><span className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600"><FileText className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">PDF</span><span className="block text-[11px] text-muted-foreground">Best for sharing and printing</span></span>{exportMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4 text-muted-foreground transition group-hover:text-rose-500" />}</button>
              <button type="button" onClick={() => void exportFile("DOCX")} disabled={exportMutation.isPending} className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/75 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-lg disabled:opacity-60"><span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600"><FileType2 className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Word DOCX</span><span className="block text-[11px] text-muted-foreground">Design-matched Word file</span></span><Download className="size-4 text-muted-foreground transition group-hover:text-blue-500" /></button>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-800 dark:text-emerald-300"><ShieldCheck className="size-3.5 shrink-0" />Your selected template remains the design source.</div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-white/55 backdrop-blur-xl dark:bg-slate-950/45"><CardContent className="space-y-2 p-4"><Button variant="outline" onClick={onRegenerate} className="w-full justify-start gap-2 rounded-xl"><RefreshCcw className="size-4" />Regenerate content</Button><Button asChild variant="ghost" className="w-full justify-start rounded-xl"><Link href="/dashboard/documents">Back to My Documents</Link></Button></CardContent></Card>

          {limits ? <Card className="border-border/60 bg-white/48 backdrop-blur-xl dark:bg-slate-950/40"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold"><Wand2 className="size-3.5 text-fuchsia-500" />Monthly usage</span><span className="text-[11px] text-muted-foreground">{limits.resumeUsed}/{limits.resumeLimit} documents</span></div><Progress value={resumePercent} tone={resumePercent >= 90 ? "rose" : resumePercent >= 70 ? "amber" : "violet"} /><div className="flex justify-between text-[11px] text-muted-foreground"><span>AI credits</span><span>{limits.apiUsed}/{limits.apiLimit}</span></div><Progress value={limits.apiPercent} tone="emerald" /></CardContent></Card> : null}
        </aside>
      </div>
    </div>
  );
}
