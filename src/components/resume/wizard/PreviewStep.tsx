"use client";

import { useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, Download, FileEdit, Loader2, RefreshCcw, Wand2 } from "lucide-react";
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
      <Card className="border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Resume generated
          </CardTitle>
          <CardDescription>
            {resume.title} · v{resume.version}. Saved automatically to My
            resumes; ATS checks and edits live in the editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button onClick={onEdit} className="gap-1">
            <FileEdit className="h-4 w-4" />
            Open in editor
          </Button>
          <Button variant="outline" onClick={onRegenerate} className="gap-1">
            <RefreshCcw className="h-4 w-4" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            onClick={() => void exportFile("PDF")}
            disabled={exportMutation.isPending}
            className="gap-1"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => void exportFile("DOCX")}
            disabled={exportMutation.isPending}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            DOCX
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/resumes">My resumes</Link>
          </Button>
        </CardContent>
      </Card>

      {limits ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wand2 className="h-4 w-4 text-fuchsia-500" />
              Usage this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>Resumes</span>
                <span className="tabular-nums text-muted-foreground">
                  {limits.resumeUsed}/{limits.resumeLimit}
                </span>
              </div>
              <Progress
                value={resumePercent}
                tone={resumePercent >= 90 ? "rose" : resumePercent >= 70 ? "amber" : "violet"}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>AI credits</span>
                <span className="tabular-nums text-muted-foreground">
                  {limits.apiUsed}/{limits.apiLimit}
                </span>
              </div>
              <Progress value={limits.apiPercent} tone="emerald" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated preview</CardTitle>
            <CardDescription>
              Rendered with the {resume.template?.name ?? "selected"} template.
              Run an ATS score and refine inside the editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateRenderedPreview resume={resume} scale={0.85} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What&apos;s next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Edit any field — auto-saves after 1s idle.</p>
            <p>2. Run an ATS check against your pasted job description.</p>
            <p>3. Apply AI suggestions section by section.</p>
            <p>4. Export to PDF or DOCX, or share a public link.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
