"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setAiChatPageContext } from "@/lib/aiChatContextBridge";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Copy,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Hash,
  History,
  Languages as LanguagesIcon,
  List,
  Loader2,
  MoreHorizontal,
  Palette,
  Save,
  Share2,
  Sparkles,
  Trash2,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditablePreview } from "@/components/resume/editor/InlineEditablePreview";
import { PersonalInfoSection } from "@/components/resume/editor/PersonalInfoSection";
import { SummarySection } from "@/components/resume/editor/SummarySection";
import { ExperienceSection } from "@/components/resume/editor/ExperienceSection";
import { EducationSection } from "@/components/resume/editor/EducationSection";
import { ChipListSection } from "@/components/resume/editor/ChipListSection";
import { AtsPanel } from "@/components/resume/editor/AtsPanel";
import { HistoryDrawer } from "@/components/resume/editor/HistoryDrawer";
import type {
  AtsResult,
  ResumeContentData,
  ResumeEducation,
  ResumeExperience,
  ResumeHistoryEntry,
  ResumeAnalytics,
  ResumePersonalInfo,
  ResumeDetail,
} from "@/lib/hooks/useResumes";
import type { Template } from "@/lib/hooks/useTemplates";
import { normalizeContentData } from "@/lib/resume/normalize";

/**
 * Microsoft Word-style editor chrome:
 *  - file bar (back / title / status)
 *  - ribbon with tabs (Home / Insert / Design / Review)
 *  - "page" column on the left showing the actual template design (locked)
 *  - "side panel" on the right with the editable section components
 *  - status bar at the bottom (save indicator, zoom slider, page count, word count)
 *
 * The template design is locked — only the editable fields in the side panel
 * flow into the `draft` state. The page preview always reflects `draft` via
 * `TemplateRenderedPreview`.
 */

type SectionId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications";

type RibbonId = "home" | "insert" | "design" | "review";

type Props = {
  resume: ResumeDetail;
  draft: ResumeContentData;
  saving: boolean;
  templates: Template[];
  templatesLoading: boolean;
  templateChanging: boolean;
  exporting: boolean;
  duplicatePending: boolean;
  deletePending: boolean;
  atsData: AtsResult | null;
  atsLoading: boolean;
  aiWriting: boolean;
  historyOpen: boolean;
  historyEntries: ResumeHistoryEntry[];
  historyLoading: boolean;
  sharePending: boolean;
  shareUrl: string | null;
  analytics: ResumeAnalytics | null;
  analyticsLoading: boolean;
  // patchers
  patchPersonalInfo: (patch: Partial<ResumePersonalInfo>) => void;
  patchSummary: (value: string) => void;
  patchExperience: (next: ResumeExperience[]) => void;
  patchEducation: (next: ResumeEducation[]) => void;
  patchSkills: (next: string[]) => void;
  patchLanguages: (next: string[]) => void;
  patchCertifications: (next: string[]) => void;
  // async handlers
  handleAiRewriteSummary: (instruction: string) => Promise<void> | void;
  handleAiRewriteExperience: (
    experienceId: string,
    instruction: string
  ) => Promise<void> | void;
  handleAiRewriteSection: (
    section: "education" | "skills" | "languages" | "certifications",
    instruction: string
  ) => Promise<void> | void;
  handleRunAts: () => Promise<void> | void;
  handleExport: (fileType?: "PDF" | "DOCX") => Promise<void> | void;
  handleDuplicate: () => void;
  handleDelete: () => void;
  handleTemplateChange: (templateId: string) => Promise<void> | void;
  handleShare: (enabled: boolean) => Promise<void> | void;
  handleCopyShareLink: () => Promise<void> | void;
  setHistoryOpen: (open: boolean) => void;
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

function PlusMark({ className }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-sm border border-current leading-none ${className ?? ""}`}
    >
      <span className="-mt-0.5 text-xs font-bold">+</span>
    </span>
  );
}

function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-transparent px-1 transition hover:border-border">
      <span className="hidden text-xs font-medium uppercase tracking-wide text-muted-foreground lg:inline">
        {label}
      </span>
      {children}
    </div>
  );
}

function RibbonSeparator() {
  return <span className="hidden h-6 w-px bg-border md:inline-block" />;
}

function sectionLabel(id: SectionId): string {
  switch (id) {
    case "personal":
      return "Personal info";
    case "summary":
      return "Summary";
    case "experience":
      return "Experience";
    case "education":
      return "Education";
    case "skills":
      return "Skills";
    case "languages":
      return "Languages";
    case "certifications":
      return "Certifications";
  }
}

function randomId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function WordStyleEditor({
  resume,
  draft,
  saving,
  templates,
  templatesLoading,
  templateChanging,
  exporting,
  duplicatePending,
  deletePending,
  atsData,
  atsLoading,
  aiWriting,
  historyOpen,
  historyEntries,
  historyLoading,
  sharePending,
  shareUrl,
  analytics,
  analyticsLoading,
  patchPersonalInfo,
  patchSummary,
  patchExperience,
  patchEducation,
  patchSkills,
  patchLanguages,
  patchCertifications,
  handleAiRewriteSummary,
  handleAiRewriteExperience,
  handleAiRewriteSection,
  handleRunAts,
  handleExport,
  handleDuplicate,
  handleDelete,
  handleTemplateChange,
  handleShare,
  handleCopyShareLink,
  setHistoryOpen,
}: Props) {
  const [section, setSection] = useState<SectionId>("personal");
  const [ribbon, setRibbon] = useState<RibbonId>("home");
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("edit");
  const [focusPreview, setFocusPreview] = useState(false);

  useEffect(() => {
    setAiChatPageContext({ selectedSection: section });
    return () => setAiChatPageContext({});
  }, [section]);

  const [zoom, setZoom] = useState(0.85);
  const [zoomMode, setZoomMode] = useState<"fit" | "manual">("fit");
  const previewHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoomMode !== "fit" || !previewHostRef.current) return;
    const host = previewHostRef.current;
    const fit = () => setZoom(Math.max(ZOOM_MIN, Math.min(1, (host.clientWidth - 48) / 794)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [zoomMode, mobilePane, focusPreview]);

  const normalizedDraft = useMemo(
    () => normalizeContentData(draft),
    [draft]
  );

  const completedSections = useMemo(() => {
    const personal = normalizedDraft.personalInfo ?? {};
    return new Set<SectionId>([
      ...(personal.firstName && personal.lastName && personal.email ? ["personal" as const] : []),
      ...(normalizedDraft.summary?.trim() ? ["summary" as const] : []),
      ...(normalizedDraft.experience?.length ? ["experience" as const] : []),
      ...(normalizedDraft.education?.length ? ["education" as const] : []),
      ...(normalizedDraft.skills?.length ? ["skills" as const] : []),
      ...(normalizedDraft.languages?.length ? ["languages" as const] : []),
      ...(normalizedDraft.certifications?.length ? ["certifications" as const] : []),
    ]);
  }, [normalizedDraft]);
  const completionPercentage = Math.round((completedSections.size / 7) * 100);

  const wordCount = useMemo(() => {
    const pieces: string[] = [];
    if (normalizedDraft.summary) pieces.push(normalizedDraft.summary);
    (normalizedDraft.experience ?? []).forEach((e) => {
      (e.bullets ?? []).forEach((b) => pieces.push(b));
      if (e.title) pieces.push(e.title);
      if (e.company) pieces.push(e.company);
    });
    (normalizedDraft.education ?? []).forEach((ed) => {
      if (ed.institution) pieces.push(ed.institution);
      if (ed.degree) pieces.push(ed.degree);
      if (ed.field) pieces.push(ed.field);
      if (ed.description) pieces.push(ed.description);
    });
    (normalizedDraft.skills ?? []).forEach((s) => pieces.push(s));
    (normalizedDraft.languages ?? []).forEach((l) => pieces.push(l));
    (normalizedDraft.certifications ?? []).forEach((c) =>
      pieces.push([c.name, c.issuer, c.year].filter(Boolean).join(" "))
    );
    const text = pieces.join(" ").trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [normalizedDraft]);

  const currentTemplate = templates.find((t) => t.id === resume.templateId);

  const previewResume: ResumeDetail = useMemo(
    () => ({ ...resume, contentData: normalizedDraft }),
    [resume, normalizedDraft]
  );

  // Track which inline variable is focused (clicked or side-panel selected)
  // so we can highlight it on the page and scroll it into view.
  const [focusedVarPath, setFocusedVarPath] = useState<string | null>(null);

  /**
   * Adapter: route a top-level scalar token (e.g. `summary`, `firstName`)
   * back to the right patcher. Token paths come straight from the
   * template, including legacy names like `bio`, `title`, `institution`
   * — we normalize them here before calling the canonical patcher.
   */
  const onPatchScalar = useCallback(
    (path: string, value: string) => {
      const normalized = path === "bio" ? "summary" : path;
      if (normalized === "summary") {
        patchSummary(value);
        return;
      }
      const personalKeys: Array<keyof ResumePersonalInfo> = [
        "firstName",
        "lastName",
        "headline",
        "email",
        "phone",
        "location",
        "website",
        "linkedIn",
        "github",
      ];
      if ((personalKeys as string[]).includes(normalized)) {
        patchPersonalInfo({ [normalized]: value } as Partial<ResumePersonalInfo>);
        return;
      }
      // Top-level arrays of strings: skills / languages / certifications.
      if (normalized === "skills") {
        const next = value
          .split(/[\n,•·|]+/g)
          .map((s) => s.trim())
          .filter(Boolean);
        patchSkills(next);
        return;
      }
      if (normalized === "languages") {
        const next = value
          .split(/[\n,•·|]+/g)
          .map((s) => s.trim())
          .filter(Boolean);
        patchLanguages(next);
        return;
      }
    },
    [patchPersonalInfo, patchSummary, patchSkills, patchLanguages]
  );

  /**
   * Adapter: route a per-row scalar token (e.g. `this.role`,
   * `this.company`) back to the row it belongs to. The listPath and row
   * are resolved by `InlineEditablePreview` from the surrounding each-block.
   */
  const onPatchArrayItem = useCallback(
    (listPath: string, row: number, field: string, value: string) => {
      // Strip the `this.` prefix the template emits and translate legacy names.
      const rawField = field.startsWith("this.") ? field.slice(5) : field;
      const f =
        rawField === "title"
          ? "role"
          : rawField === "institution"
            ? "school"
            : rawField === "startDate"
              ? "from"
              : rawField === "endDate"
                ? "to"
                : rawField;

      if (listPath === "experience") {
        const list = normalizedDraft.experience ?? [];
        if (row < 0 || row >= list.length) return;
        const updated = list.map((e, i) =>
          i === row
            ? {
                ...e,
                // desc writes back as bullets[] joined on newline
                [f === "desc" ? "bullets" : f]:
                  f === "desc" ? value.split(/\r?\n/).filter(Boolean) : value,
              }
            : e
        );
        patchExperience(updated);
        return;
      }
      if (listPath === "education") {
        const list = normalizedDraft.education ?? [];
        if (row < 0 || row >= list.length) return;
        const updated = list.map((e, i) =>
          i === row ? { ...e, [f]: value } : e
        );
        patchEducation(updated);
        return;
      }
    },
    [normalizedDraft.experience, normalizedDraft.education, patchExperience, patchEducation]
  );

  function goToRibbon(id: RibbonId, sectionHint?: SectionId) {
    setRibbon(id);
    if (sectionHint) setSection(sectionHint);
  }

  return (
    <div
      className="mx-2 flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-violet-200/70 bg-violet-50/40 shadow-[var(--shadow-3)] sm:mx-4 dark:border-violet-300/15 dark:bg-[#1a1724]"
    >
      {/* File bar */}
      <div className="relative z-40 flex items-center justify-between gap-2 border-b border-white/10 bg-violet-950 px-3 py-3 text-white sm:px-4 dark:bg-[#24132f]">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
          >
            <Link href="/dashboard/resumes">
              <ArrowLeft className="h-4 w-4" /> All resumes
            </Link>
          </Button>
          <span className="mx-1 hidden h-5 w-px bg-white/30 sm:block" />
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-700 shadow-sm sm:flex">
            <FileText className="h-4 w-4" />
          </div>
          <span className="min-w-0 max-w-[42vw] truncate text-sm font-semibold sm:max-w-[30rem] sm:text-base" title={`${resume.title}${currentTemplate ? ` · ${currentTemplate.name}` : ""}`}>
            <span className="block truncate">{resume.title}</span>
            {currentTemplate ? (
              <span className="block text-xs font-medium uppercase tracking-widest text-slate-400">
                Career Canvas · {currentTemplate.name} · {resume.type === "CV" ? "Curriculum Vitae" : "Professional Résumé"}
              </span>
            ) : null}
          </span>
        </div>
        <div className="relative flex flex-wrap items-center justify-end gap-1 overflow-visible">
          <div className="mr-1 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-1.5 md:flex" title={`${completionPercentage}% complete`}>
            <div className="relative grid h-7 w-7 place-items-center rounded-full" style={{ background: `conic-gradient(#a78bfa ${completionPercentage}%, rgba(255,255,255,.12) 0)` }}>
              <div className="grid h-5 w-5 place-items-center rounded-full bg-violet-950 text-xs font-bold">{completionPercentage}</div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">Profile strength</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={() => {
              setTemplateMenuOpen((open) => !open);
              setSharePanelOpen(false);
              setExportPanelOpen(false);
            }}
            disabled={templatesLoading || templateChanging}
          >
            {templateChanging ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Palette className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">Template</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={() => {
              setSharePanelOpen((open) => !open);
              setTemplateMenuOpen(false);
              setExportPanelOpen(false);
              if (!resume.isPublic) void handleShare(true);
            }}
            disabled={sharePending}
          >
            {sharePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">{resume.isPublic ? "Share" : "Enable share"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={handleDuplicate}
            disabled={duplicatePending}
          >
            {duplicatePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden xl:inline">Duplicate</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`hidden gap-1 lg:inline-flex ${focusPreview ? "bg-violet-500/20 text-violet-100" : "text-white hover:bg-white/15 hover:text-white"}`}
            onClick={() => setFocusPreview((value) => !value)}
          >
            <Eye className="h-3.5 w-3.5" />
            {focusPreview ? "Show editor" : "Focus preview"}
          </Button>
          <div className="flex items-stretch rounded-md bg-white text-slate-950 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 rounded-r-none text-slate-950 hover:bg-violet-50 hover:text-violet-700"
              onClick={() => {
                setExportPanelOpen(false);
                setTemplateMenuOpen(false);
                setSharePanelOpen(false);
                void handleExport("PDF");
              }}
              disabled={exporting}
              aria-label="Export resume as PDF"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <button
              type="button"
              className="grid w-8 place-items-center rounded-r-md border-l border-slate-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-60"
              onClick={() => {
                setExportPanelOpen((open) => !open);
                setTemplateMenuOpen(false);
                setSharePanelOpen(false);
              }}
              disabled={exporting}
              aria-label="Choose export format"
              aria-expanded={exportPanelOpen}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => {
              setActionMenuOpen((open) => !open);
              setTemplateMenuOpen(false);
              setSharePanelOpen(false);
              setExportPanelOpen(false);
            }}
            aria-label="More resume actions"
            aria-expanded={actionMenuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {actionMenuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 text-foreground shadow-2xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                onClick={() => { setActionMenuOpen(false); handleDelete(); }}
                disabled={deletePending}
              >
                {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete resume…
              </button>
            </div>
          ) : null}

          {templateMenuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-popover p-2 text-foreground shadow-2xl">
              <p className="px-2 py-1 text-xs text-muted-foreground">
                Switch templates without changing your resume content.
              </p>
              <div className="mt-1 max-h-64 space-y-1 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    disabled={template.id === resume.templateId || templateChanging}
                    onClick={() => {
                      setTemplateMenuOpen(false);
                      void handleTemplateChange(template.id);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition hover:bg-muted disabled:cursor-default disabled:opacity-70 ${
                      template.id === resume.templateId ? "bg-violet-50 text-violet-800" : ""
                    }`}
                  >
                    <span className="font-semibold">{template.name}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                      {template.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sharePanelOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-foreground shadow-2xl">
              {!resume.isPublic || !shareUrl ? (
                <div className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating secure public link…
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold">Public resume link</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Anyone with this link can view your resume.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={shareUrl}
                      readOnly
                      aria-label="Public resume link"
                      className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={() => void handleCopyShareLink()}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <Eye className="h-3 w-3" /> Views
                      </span>
                      <p className="mt-1 text-lg font-semibold">
                        {analyticsLoading ? "…" : analytics?.totalViews ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <Download className="h-3 w-3" /> Downloads
                      </span>
                      <p className="mt-1 text-lg font-semibold">
                        {analyticsLoading ? "…" : analytics?.totalDownloads ?? 0}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSharePanelOpen(false);
                      void handleShare(false);
                    }}
                    className="mt-3 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Make this resume private
                  </button>
                </>
              )}
            </div>
          ) : null}

          {exportPanelOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-border bg-popover p-2 text-foreground shadow-2xl">
              <p className="px-2 py-1 text-xs font-semibold">Export selected design</p>
              <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">Both formats use the active template and your latest auto-saved content.</p>
              <button type="button" onClick={() => { setExportPanelOpen(false); void handleExport("PDF"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted">
                <Download className="h-4 w-4 text-violet-500" />
                <span><span className="block text-xs font-semibold">Pixel-perfect PDF</span><span className="block text-xs text-muted-foreground">Best visual match for sharing</span></span>
              </button>
              <button type="button" onClick={() => { setExportPanelOpen(false); void handleExport("DOCX"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted">
                <FileText className="h-4 w-4 text-blue-500" />
                <span><span className="block text-xs font-semibold">Design-matched Word DOCX</span><span className="block text-xs text-muted-foreground">Best template fidelity in Microsoft Word</span></span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Ribbon: tabs */}
      <div className="flex items-end gap-1 overflow-x-auto border-b border-border bg-card/95 px-3 pt-2 backdrop-blur-xl">
        {(
          [
            { id: "home", label: "Content", Icon: User, IconClass: "h-3.5 w-3.5" },
            { id: "insert", label: "Add", Icon: null, IconClass: "" },
            {
              id: "design",
              label: "Look & feel",
              Icon: Palette,
              IconClass: "h-3.5 w-3.5",
            },
            {
              id: "review",
              label: "Improve",
              Icon: Sparkles,
              IconClass: "h-3.5 w-3.5",
            },
          ] as {
            id: RibbonId;
            label: string;
            Icon: React.ComponentType<{ className?: string }> | null;
            IconClass: string;
          }[]
        ).map(({ id, label, Icon, IconClass }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === "home") goToRibbon("home", "personal");
              else if (id === "insert") goToRibbon("insert", "experience");
              else if (id === "design") goToRibbon("design");
              else goToRibbon("review", "summary");
            }}
            className={`flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition ${
              ribbon === id
                ? "border-border bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {id === "insert" ? (
              <PlusMark className="h-3.5 w-3.5" />
            ) : Icon ? (
              <Icon className={IconClass} />
            ) : null}
            {label}
          </button>
        ))}
      </div>

      {/* Ribbon: contextual groups */}
      <div className="flex min-h-12 items-center gap-3 overflow-x-auto border-b border-border bg-background px-3 py-2 text-xs shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ribbon === "home" && (
          <>
            <RibbonGroup label="Your story">
              <div className="flex flex-nowrap gap-1.5">
                {(
                  [
                    ["personal", "Personal", User],
                    ["summary", "Summary", Sparkles],
                    ["experience", "Experience", Briefcase],
                    ["education", "Education", GraduationCap],
                    ["skills", "Skills", List],
                    ["languages", "Languages", LanguagesIcon],
                    ["certifications", "Credentials", GraduationCap],
                  ] as [
                    SectionId,
                    string,
                    React.ComponentType<{ className?: string }>
                  ][]
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-medium transition ${
                      section === id
                        ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/15"
                        : "border-transparent text-muted-foreground hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 dark:hover:bg-violet-950/30"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                    {completedSections.has(id) ? <Check className={`h-3 w-3 ${section === id ? "text-white" : "text-emerald-500"}`} /> : <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </button>
                ))}
              </div>
            </RibbonGroup>
            <RibbonSeparator />
            <RibbonGroup label="Quick style">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border bg-background shadow-sm transition hover:bg-muted" onClick={() => goToRibbon("design")} title="View template design" aria-label="View template design"><Palette className="h-3.5 w-3.5 text-violet-500" /></button>
              <span className="ml-1 text-xs text-muted-foreground">
                Tune your visual signature
              </span>
            </RibbonGroup>
          </>
        )}

        {ribbon === "insert" && (
          <>
            <RibbonGroup label="Add section">
              <button
                type="button"
                onClick={() => setSection("skills")}
                className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 hover:bg-muted"
              >
                <PlusMark className="h-3 w-3" /> Skills
              </button>
              <button
                type="button"
                onClick={() => setSection("languages")}
                className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 hover:bg-muted"
              >
                <PlusMark className="h-3 w-3" /> Languages
              </button>
              <button
                type="button"
                onClick={() => setSection("certifications")}
                className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 hover:bg-muted"
              >
                <PlusMark className="h-3 w-3" /> Certifications
              </button>
            </RibbonGroup>
            <RibbonSeparator />
            <RibbonGroup label="Quick add">
              <button
                type="button"
                onClick={() => {
                  setSection("experience");
                  const next: ResumeExperience[] = [
                    ...(normalizedDraft.experience ?? []),
                    {
                      id: randomId("exp"),
                      company: "",
                      title: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      bullets: [""],
                    },
                  ];
                  patchExperience(next);
                }}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 font-medium text-white shadow hover:bg-violet-700"
              >
                <PlusMark className="h-3 w-3" /> New role
              </button>
              <button
                type="button"
                onClick={() => {
                  setSection("education");
                  const next: ResumeEducation[] = [
                    ...(normalizedDraft.education ?? []),
                    {
                      id: randomId("edu"),
                      institution: "",
                      degree: "",
                      field: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                    },
                  ];
                  patchEducation(next);
                }}
                className="flex items-center gap-1 rounded-md border border-violet-300 px-2 py-1 font-medium text-violet-700 hover:bg-violet-50"
              >
                <PlusMark className="h-3 w-3" /> New school
              </button>
            </RibbonGroup>
          </>
        )}

        {ribbon === "design" && (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-violet-500" /><p className="text-xs"><span className="font-semibold">{currentTemplate?.name ?? "Selected template"}</span><span className="ml-2 text-muted-foreground">is the single design source for preview, PDF, and DOCX.</span></p></div>
            <button type="button" onClick={() => setTemplateMenuOpen(true)} className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">Switch template</button>
          </div>
        )}

        {ribbon === "review" && (
          <>
            <RibbonGroup label="AI assist">
              <button
                type="button"
                onClick={() => {
                  setSection("summary");
                  void handleAiRewriteSummary(
                    resume.targetJobTitle
                      ? `Make the summary sharper for the role of ${resume.targetJobTitle}. Keep voice professional.`
                      : "Make the summary more concise and outcome-driven."
                  );
                }}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 font-medium text-white shadow hover:bg-violet-700"
              >
                <Sparkles className="h-3 w-3" /> Rewrite summary
              </button>
            </RibbonGroup>
            <RibbonSeparator />
            <RibbonGroup label="ATS">
              <button
                type="button"
                onClick={() => void handleRunAts()}
                className="flex items-center gap-1 rounded-md border border-violet-300 px-2.5 py-1 font-medium text-violet-700 hover:bg-violet-50"
              >
                <Sparkles className="h-3 w-3" /> Run ATS check
              </button>
            </RibbonGroup>
            <RibbonSeparator />
            <RibbonGroup label="History">
              <button
                type="button"
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 font-medium hover:bg-muted"
              >
                <History className="h-3 w-3" /> Versions
              </button>
            </RibbonGroup>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 border-b border-border bg-background p-1.5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane("edit")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobilePane === "edit" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
        >
          <User className="h-4 w-4" /> Edit content
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("preview")}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobilePane === "preview" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1 bg-slate-200/40 dark:bg-slate-950/30">
        {/* Page column */}
        <div ref={previewHostRef} className={`${mobilePane === "preview" ? "flex" : "hidden"} relative flex-1 items-start justify-center overflow-auto bg-violet-100/35 p-3 sm:p-6 lg:flex dark:bg-[#17131f]`}>
          <div
            className="relative w-[210mm] max-w-full origin-top bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,.35)] ring-1 ring-black/5"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              marginBottom: `${(zoom - 1) * 60}vh`,
              minHeight: "297mm",
            }}
          >
            <div className="theme-paper relative bg-white text-[#111] [color-scheme:light]">
              <InlineEditablePreview
                resume={previewResume}
                scale={1}
                className="!border-0 !shadow-none !rounded-none"
                editable
                onPatchScalar={onPatchScalar}
                onPatchArrayItem={onPatchArrayItem}
                focusedPath={focusedVarPath}
                onFocusedPathChange={setFocusedVarPath}
              />
            </div>

          </div>
        </div>

        {/* Side panel: editable fields */}
        <aside className={`${mobilePane === "edit" ? "flex" : "hidden"} w-full shrink-0 flex-col gap-3 border-l border-border bg-card p-4 ${focusPreview ? "lg:hidden" : "lg:flex lg:max-w-[420px] xl:max-w-[460px]"}`}>
          <header className="flex items-center justify-between rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2.5 dark:bg-violet-400/[0.06]">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold">
                Edit {sectionLabel(section)}
              </h3>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Auto-saved
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="space-y-5">
              {section === "personal" && (
                <PersonalInfoSection
                  detail={{ ...resume, contentData: draft }}
                  saving={saving}
                  onChange={patchPersonalInfo}
                />
              )}
              {section === "summary" && (
                <SummarySection
                  value={draft.summary ?? ""}
                  targetJobTitle={resume.targetJobTitle}
                  onChange={patchSummary}
                  onAiRewrite={handleAiRewriteSummary}
                  aiWriting={aiWriting}
                />
              )}
              {section === "experience" && (
                <ExperienceSection
                  experiences={normalizedDraft.experience ?? []}
                  onChange={patchExperience}
                  onAiRewrite={handleAiRewriteExperience}
                />
              )}
              {section === "education" && (
                <EducationSection
                  educations={normalizedDraft.education ?? []}
                  onChange={patchEducation}
                  aiWriting={aiWriting}
                  onAiRewrite={() => handleAiRewriteSection("education", "Improve descriptions and presentation for relevance and clarity without changing any facts.")}
                />
              )}
              {section === "skills" && (
                <ChipListSection
                  title="Skills"
                  emoji="🛠️"
                  items={draft.skills ?? []}
                  onChange={patchSkills}
                  placeholder="e.g. React, Python, Figma"
                  aiWriting={aiWriting}
                  onAiRewrite={() => handleAiRewriteSection("skills", `Prioritize and organize these skills for ${resume.targetJobTitle || "the target role"}. Do not add skills that are not present.`)}
                />
              )}
              {section === "languages" && (
                <ChipListSection
                  title="Languages"
                  emoji="🌐"
                  items={draft.languages ?? []}
                  onChange={patchLanguages}
                  placeholder="e.g. English (Fluent)"
                  aiWriting={aiWriting}
                  onAiRewrite={() => handleAiRewriteSection("languages", "Standardize language names and proficiency wording without changing proficiency facts.")}
                />
              )}
              {section === "certifications" && (
                <ChipListSection
                  title="Certifications"
                  emoji="🏅"
                  items={(draft.certifications ?? []).map((c) =>
                    [c.name, c.issuer, c.year].filter(Boolean).join(" · ")
                  )}
                  onChange={patchCertifications}
                  placeholder="e.g. AWS Solutions Architect"
                  aiWriting={aiWriting}
                  onAiRewrite={() => handleAiRewriteSection("certifications", "Standardize credential wording and ordering without inventing or removing credentials.")}
                />
              )}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <AtsPanel
              atsData={atsData}
              loading={atsLoading}
              onRun={handleRunAts}
            />
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-violet-300/15 bg-violet-950 px-3 py-1.5 text-xs text-violet-100 dark:bg-[#24132f]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            {saving ? (
              <Cloud className="h-3 w-3" />
            ) : (
              <CloudOff className="h-3 w-3 opacity-70" />
            )}
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                All changes saved
              </>
            )}
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Save className="h-3 w-3" /> Auto-save on
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <FileText className="h-3 w-3" /> Page 1 of 1
          </span>
          <span className="hidden items-center gap-1 md:inline-flex">
            {wordCount.toLocaleString()} words
          </span>
          <span className="hidden items-center gap-1 md:inline-flex">
            v{resume.version}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex">
            Zoom {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => {
              setZoomMode("manual");
              setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
            }}
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/15"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <input
            type="range"
            min={ZOOM_MIN * 100}
            max={ZOOM_MAX * 100}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={(e) => { setZoomMode("manual"); setZoom(Number(e.target.value) / 100); }}
            className="hidden h-1 w-24 accent-white sm:block"
            aria-label="Zoom level"
          />
          <button
            type="button"
            onClick={() => {
              setZoomMode("manual");
              setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
            }}
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/15"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoomMode("fit")}
            className="rounded px-1.5 py-0.5 hover:bg-white/15"
          >
            Fit
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/15"
          >
            <History className="h-3 w-3" /> History
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/15"
          >
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      </div>

      <HistoryDrawer
        resumeId={resume.id}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={historyEntries}
        isLoading={historyLoading}
      />
    </div>
  );
}
