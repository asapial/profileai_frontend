"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordStyleEditor } from "@/components/resume/editor/WordStyleEditor";
import {
  useAtsCheck,
  useAiModify,
  useDeleteResume,
  useDuplicateResume,
  useExportResume,
  useResume,
  useResumeAnalytics,
  useResumeHistory,
  useShareResume,
  useUpdateResume,
  useUpdateResumeTemplate,
  type AtsResult,
  type ResumeContentData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumePersonalInfo,
} from "@/lib/hooks/useResumes";
import { useTemplates } from "@/lib/hooks/useTemplates";
import {
  normalizeContentData,
  sanitizeForApi,
} from "@/lib/resume/normalize";
import { downloadResumeExport } from "@/lib/resume/download";

const DEBOUNCE_MS = 1500;

function contentSignature(content: ResumeContentData): string {
  return JSON.stringify(sanitizeForApi(normalizeContentData(content)));
}

export default function EditResumePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;

  const { data: resume, isLoading, isError, error } = useResume(id);
  const { data: templates = [], isLoading: templatesLoading } = useTemplates({});

  const updateMutation = useUpdateResume(id ?? "");
  const updateTemplateMutation = useUpdateResumeTemplate(id ?? "");
  const atsMutation = useAtsCheck(id ?? "");
  const aiMutation = useAiModify(id ?? "");
  const shareMutation = useShareResume(id ?? "");
  const exportMutation = useExportResume();
  const duplicateMutation = useDuplicateResume();
  const deleteMutation = useDeleteResume();
  const { data: historyEntries = [], isLoading: historyLoading } =
    useResumeHistory(id);
  const { data: analytics, isLoading: analyticsLoading } = useResumeAnalytics(
    id,
    Boolean(resume?.isPublic)
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [atsData, setAtsData] = useState<AtsResult | null>(null);
  const [draft, setDraft] = useState<ResumeContentData>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const draftRef = useRef<ResumeContentData>({});
  const lastSavedRef = useRef("");
  const loadedResumeIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!resume) return;

    const normalized = normalizeContentData(resume.contentData);
    const incomingSignature = contentSignature(normalized);
    const draftSignature = contentSignature(draftRef.current);

    if (loadedResumeIdRef.current !== resume.id) {
      loadedResumeIdRef.current = resume.id;
      draftRef.current = normalized;
      lastSavedRef.current = incomingSignature;
      setDraft(normalized);
      setSaveError(null);
      setHasConflict(false);
      return;
    }

    if (incomingSignature === lastSavedRef.current) return;

    if (draftSignature !== lastSavedRef.current) {
      setHasConflict(true);
      return;
    }

    draftRef.current = normalized;
    lastSavedRef.current = incomingSignature;
    setDraft(normalized);
    setSaveError(null);
  }, [resume]);

  const flushSave = useCallback(
    async (next: ResumeContentData): Promise<boolean> => {
      if (!id) return false;

      const signature = contentSignature(next);
      if (signature === lastSavedRef.current) return true;

      setSaving(true);
      try {
        const saved = await updateMutation.mutateAsync({
          contentData: sanitizeForApi(normalizeContentData(next)),
        });
        lastSavedRef.current = contentSignature(saved.contentData);
        setSaveError(null);
        return true;
      } catch (cause) {
        setSaveError(
          cause instanceof Error ? cause.message : "Failed to save changes."
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id, updateMutation]
  );

  useEffect(() => {
    if (!id || !resume || saving || saveError || hasConflict) return;
    if (contentSignature(draft) === lastSavedRef.current) return;

    saveTimerRef.current = setTimeout(() => {
      void flushSave(draft);
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, flushSave, hasConflict, id, resume, saveError, saving]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateDraft = useCallback(
    (updater: (current: ResumeContentData) => ResumeContentData) => {
      setDraft((current) => {
        const next = updater(current);
        draftRef.current = next;
        return next;
      });
      setSaveError(null);
    },
    []
  );

  function patchPersonalInfo(patch: Partial<ResumePersonalInfo>) {
    updateDraft((current) => ({
      ...current,
      personalInfo: { ...(current.personalInfo ?? {}), ...patch },
    }));
  }

  function patchSummary(value: string) {
    updateDraft((current) => ({ ...current, summary: value }));
  }

  function patchExperience(next: ResumeExperience[]) {
    updateDraft((current) => ({ ...current, experience: next }));
  }

  function patchEducation(next: ResumeEducation[]) {
    updateDraft((current) => ({ ...current, education: next }));
  }

  function patchSkills(next: string[]) {
    updateDraft((current) => ({ ...current, skills: next }));
  }

  function patchLanguages(next: string[]) {
    updateDraft((current) => ({ ...current, languages: next }));
  }

  function patchCertifications(next: string[]) {
    updateDraft((current) => ({
      ...current,
      certifications: next.map((name) => ({ name })),
    }));
  }

  async function ensureDraftSaved(): Promise<boolean> {
    if (hasConflict) {
      toast.error("Reload the latest version before continuing.");
      return false;
    }
    return flushSave(draftRef.current);
  }

  async function handleAiRewriteExperience(
    _experienceId: string,
    instruction: string
  ) {
    if (!id || !(await ensureDraftSaved())) return;
    try {
      const data = await aiMutation.mutateAsync({
        section: "experience",
        instruction,
      });
      const normalized = normalizeContentData(data.contentData);
      draftRef.current = normalized;
      lastSavedRef.current = contentSignature(normalized);
      setDraft(normalized);
      toast.success("Experience rewritten with AI.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "AI rewrite failed."
      );
    }
  }

  async function handleAiRewriteSummary(instruction: string) {
    if (!id || !(await ensureDraftSaved())) return;
    try {
      const data = await aiMutation.mutateAsync({
        section: "summary",
        instruction,
      });
      const normalized = normalizeContentData(data.contentData);
      draftRef.current = normalized;
      lastSavedRef.current = contentSignature(normalized);
      setDraft(normalized);
      toast.success("Summary rewritten with AI.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "AI rewrite failed."
      );
    }
  }

  async function handleRunAts() {
    if (!id) return;
    if (!resume?.jobDescription) {
      toast.error("Add a job description on the resume to run ATS.");
      return;
    }
    try {
      const data = await atsMutation.mutateAsync({
        jobDescription: resume.jobDescription,
      });
      setAtsData(data.atsData);
      toast.success("ATS check complete.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "ATS check failed.");
    }
  }

  async function handleExport(fileType: "PDF" | "DOCX" = "PDF") {
    if (!id || !(await ensureDraftSaved())) return;
    try {
      const result = await exportMutation.mutateAsync({ id, fileType });
      if (
        downloadResumeExport(
          result,
          `${resume?.title ?? "resume"}.${fileType.toLowerCase()}`
        )
      ) {
        toast.success(`${fileType} export ready.`);
        return;
      }
      if (result.jobId) {
        toast.success("Export queued. You'll be notified when it's ready.");
        return;
      }
      toast.error("Export did not return a file.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Export failed.");
    }
  }

  async function handleTemplateChange(templateId: string) {
    if (!id || templateId === resume?.templateId || !(await ensureDraftSaved())) {
      return;
    }
    try {
      await updateTemplateMutation.mutateAsync(templateId);
      toast.success("Template switched. Your content is unchanged.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not switch template."
      );
    }
  }

  async function handleShare(enabled: boolean) {
    if (!id || (enabled && !(await ensureDraftSaved()))) return;
    try {
      await shareMutation.mutateAsync(enabled);
      toast.success(enabled ? "Public link enabled." : "Resume is now private.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not update sharing."
      );
    }
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Public link copied.");
    } catch {
      toast.error("Could not copy the link. Please copy it manually.");
    }
  }

  function handleDuplicate() {
    if (!id) return;
    duplicateMutation.mutate(id, {
      onSuccess: (data) => {
        toast.success("Duplicated. Opening the copy…");
        router.push(`/dashboard/resume/${data.id}/edit`);
      },
      onError: (cause) =>
        toast.error(cause instanceof Error ? cause.message : "Duplicate failed."),
    });
  }

  function handleDelete() {
    if (!id) return;
    if (!window.confirm("Delete this resume? This cannot be undone.")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Resume deleted.");
        router.push("/dashboard/resumes");
      },
      onError: (cause) =>
        toast.error(cause instanceof Error ? cause.message : "Delete failed."),
    });
  }

  function reloadLatestVersion() {
    if (!resume) return;
    const normalized = normalizeContentData(resume.contentData);
    draftRef.current = normalized;
    lastSavedRef.current = contentSignature(normalized);
    setDraft(normalized);
    setSaveError(null);
    setHasConflict(false);
  }

  const personalInfo = draft.personalInfo ?? {};
  const currentAtsData = atsData ?? resume?.aiSuggestions ?? null;
  const shareUrl =
    resume?.isPublic && resume.slug && typeof window !== "undefined"
      ? `${window.location.origin}/r/${resume.slug}`
      : null;
  const fullName = useMemo(
    () =>
      [personalInfo.firstName, personalInfo.lastName]
        .filter(Boolean)
        .join(" "),
    [personalInfo.firstName, personalInfo.lastName]
  );

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-6">
        <div className="min-h-[34rem] animate-pulse rounded-2xl border border-border bg-muted/40" />
        <div className="min-h-[34rem] animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    );
  }

  if (isError || !resume) {
    const isNotFound =
      isError &&
      "status" in (error as object) &&
      (error as { status?: number }).status === 404;
    return (
      <div className="space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">
          {isNotFound ? "Resume not found" : "Could not load resume"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isNotFound
            ? "This resume may have been deleted or never existed."
            : (error as { message?: string })?.message ??
              "An unexpected error occurred."}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/resumes" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to resumes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {hasConflict ? (
        <div className="mx-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:mx-4 lg:mx-6">
          <span>
            A newer version was saved elsewhere. Reload it to avoid overwriting
            changes from another tab or device.
          </span>
          <Button size="sm" variant="outline" onClick={reloadLatestVersion}>
            <RefreshCw className="h-3.5 w-3.5" /> Reload latest
          </Button>
        </div>
      ) : null}

      {saveError ? (
        <div className="mx-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:mx-4 lg:mx-6">
          <span>Changes could not be saved: {saveError}</span>
          <Button size="sm" variant="outline" onClick={() => void flushSave(draftRef.current)}>
            Retry save
          </Button>
        </div>
      ) : null}

      <WordStyleEditor
        key={resume.id}
        resume={resume}
        draft={draft}
        saving={saving}
        templates={templates}
        templatesLoading={templatesLoading}
        templateChanging={updateTemplateMutation.isPending}
        exporting={exportMutation.isPending}
        duplicatePending={duplicateMutation.isPending}
        deletePending={deleteMutation.isPending}
        atsData={currentAtsData}
        atsLoading={atsMutation.isPending}
        historyOpen={historyOpen}
        historyEntries={historyEntries}
        historyLoading={historyLoading}
        sharePending={shareMutation.isPending}
        shareUrl={shareUrl}
        analytics={analytics ?? null}
        analyticsLoading={analyticsLoading}
        fullName={fullName}
        patchPersonalInfo={patchPersonalInfo}
        patchSummary={patchSummary}
        patchExperience={patchExperience}
        patchEducation={patchEducation}
        patchSkills={patchSkills}
        patchLanguages={patchLanguages}
        patchCertifications={patchCertifications}
        handleAiRewriteSummary={handleAiRewriteSummary}
        handleAiRewriteExperience={handleAiRewriteExperience}
        handleRunAts={handleRunAts}
        handleExport={handleExport}
        handleDuplicate={handleDuplicate}
        handleDelete={handleDelete}
        handleTemplateChange={handleTemplateChange}
        handleShare={handleShare}
        handleCopyShareLink={handleCopyShareLink}
        setHistoryOpen={setHistoryOpen}
      />
    </div>
  );
}
