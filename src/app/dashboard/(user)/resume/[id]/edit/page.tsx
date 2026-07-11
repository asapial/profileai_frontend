"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordStyleEditor } from "@/components/resume/editor/WordStyleEditor";
import {
  useAtsCheck,
  useAiModify,
  useDeleteResume,
  useDuplicateResume,
  useExportResume,
  useResume,
  useResumeHistory,
  useUpdateResume,
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

const DEBOUNCE_MS = 1000;

export default function EditResumePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;

  const {
    data: resume,
    isLoading,
    isError,
    error,
  } = useResume(id);
  const { data: templates = [], isLoading: templatesLoading } = useTemplates({});

  const updateMutation = useUpdateResume(id ?? "");
  const atsMutation = useAtsCheck(id ?? "");
  const aiMutation = useAiModify(id ?? "");
  const exportMutation = useExportResume();
  const duplicateMutation = useDuplicateResume();
  const deleteMutation = useDeleteResume();
  const { data: historyEntries = [], isLoading: historyLoading } =
    useResumeHistory(id);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [atsData, setAtsData] = useState<AtsResult | null>(null);

  // Local draft of contentData (with stable `id` fields for React keys).
  const [draft, setDraft] = useState<ResumeContentData>({});
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft whenever the server data changes (initial load, restore, AI).
  useEffect(() => {
    if (!resume) return;
    const normalized = normalizeContentData(resume.contentData);
    setDraft(normalized);
    lastSavedRef.current = JSON.stringify(normalized);
  }, [resume?.id, resume?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resume?.aiSuggestions && !atsData) {
      // Surface the server-stored atsScore as a fallback when no fresh check.
      setAtsData(resume.aiSuggestions);
    }
  }, [resume?.aiSuggestions, atsData]);

  const flushSave = useCallback(
    (next: ResumeContentData) => {
      if (!id) return;
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      setSaving(true);
      updateMutation.mutate(
        { contentData: sanitizeForApi(next) },
        {
          onSuccess: (data) => {
            const normalized = normalizeContentData(data.contentData);
            lastSavedRef.current = JSON.stringify(normalized);
            setSaving(false);
          },
          onError: (err) => {
            setSaving(false);
            toast.error(err.message ?? "Failed to save changes.");
          },
        }
      );
    },
    [id, updateMutation]
  );

  // Debounced auto-save: every change to `draft` schedules a save 1s later.
  useEffect(() => {
    if (!id || !resume) return;
    const serialized = JSON.stringify(draft);
    if (serialized === lastSavedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushSave(draft);
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, flushSave, id, resume]);

  // Flush pending changes on unmount.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  function patchPersonalInfo(patch: Partial<ResumePersonalInfo>) {
    setDraft((d) => ({
      ...d,
      personalInfo: { ...(d.personalInfo ?? {}), ...patch },
    }));
  }

  function patchSummary(value: string) {
    setDraft((d) => ({ ...d, summary: value }));
  }

  function patchExperience(next: ResumeExperience[]) {
    setDraft((d) => ({ ...d, experience: next }));
  }

  function patchEducation(next: ResumeEducation[]) {
    setDraft((d) => ({ ...d, education: next }));
  }

  function patchSkills(next: string[]) {
    setDraft((d) => ({ ...d, skills: next }));
  }

  function patchLanguages(next: string[]) {
    setDraft((d) => ({ ...d, languages: next }));
  }

  function patchCertifications(next: string[]) {
    setDraft((d) => ({
      ...d,
      certifications: next.map((name) => ({ name })),
    }));
  }

  async function handleAiRewriteExperience(
    _experienceId: string,
    instruction: string
  ) {
    if (!id) return;
    try {
      const data = await aiMutation.mutateAsync({
        section: "experience",
        instruction,
      });
      const normalized = normalizeContentData(data.contentData);
      setDraft(normalized);
      lastSavedRef.current = JSON.stringify(normalized);
      toast.success("Experience rewritten with AI.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI rewrite failed."
      );
    }
  }

  async function handleAiRewriteSummary(instruction: string) {
    if (!id) return;
    try {
      const data = await aiMutation.mutateAsync({
        section: "summary",
        instruction,
      });
      const normalized = normalizeContentData(data.contentData);
      setDraft(normalized);
      lastSavedRef.current = JSON.stringify(normalized);
      toast.success("Summary rewritten with AI.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "AI rewrite failed."
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ATS check failed.");
    }
  }

  async function handleExport(fileType: "PDF" | "DOCX" = "PDF") {
    if (!id) return;
    try {
      // Export the exact document currently visible in the editor, including
      // changes that are still inside the one-second autosave window.
      const serialized = JSON.stringify(draft);
      if (serialized !== lastSavedRef.current) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaving(true);
        const saved = await updateMutation.mutateAsync({
          contentData: sanitizeForApi(draft),
        });
        const normalized = normalizeContentData(saved.contentData);
        lastSavedRef.current = JSON.stringify(normalized);
        setSaving(false);
      }

      const res = await exportMutation.mutateAsync({ id, fileType });
      if (downloadResumeExport(res, `${resume?.title ?? "resume"}.${fileType.toLowerCase()}`)) {
        toast.success(`${fileType} export ready.`);
        return;
      }
      if (res.jobId) {
        toast.success("Export queued. You'll be notified when it's ready.");
        return;
      }
      toast.error("Export did not return a URL.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    }
  }

  function handleDuplicate() {
    if (!id) return;
    duplicateMutation.mutate(id, {
      onSuccess: (data) => {
        toast.success("Duplicated. Opening the copy…");
        router.push(`/dashboard/resume/${data.id}/edit`);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Duplicate failed."),
    });
  }

  function handleDelete() {
    if (!id) return;
    const ok = window.confirm(
      "Delete this resume? This cannot be undone."
    );
    if (!ok) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Resume deleted.");
        router.push("/dashboard/resumes");
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed."),
    });
  }

  const personalInfo = draft.personalInfo ?? {};
  const fullName = useMemo(
    () =>
      [personalInfo.firstName, personalInfo.lastName]
        .filter(Boolean)
        .join(" "),
    [personalInfo.firstName, personalInfo.lastName]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading resume…
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
        <div className="flex items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/resumes" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to resumes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <WordStyleEditor
        resume={resume}
        draft={draft}
        saving={saving}
        templates={templates}
        templatesLoading={templatesLoading}
        exporting={exportMutation.isPending}
        duplicatePending={duplicateMutation.isPending}
        deletePending={deleteMutation.isPending}
        atsData={atsData}
        atsLoading={atsMutation.isPending}
        historyOpen={historyOpen}
        historyEntries={historyEntries}
        historyLoading={historyLoading}
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
        setHistoryOpen={setHistoryOpen}
      />
    </div>
  );
}
