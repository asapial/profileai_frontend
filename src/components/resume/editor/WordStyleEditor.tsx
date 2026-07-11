"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Briefcase,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Hash,
  History,
  Italic,
  Languages as LanguagesIcon,
  List,
  Loader2,
  Palette,
  Save,
  Sparkles,
  Trash2,
  Underline,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateRenderedPreview } from "@/components/resume/TemplateRenderedPreview";
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
  exporting: boolean;
  duplicatePending: boolean;
  deletePending: boolean;
  atsData: AtsResult | null;
  atsLoading: boolean;
  historyOpen: boolean;
  historyEntries: ResumeHistoryEntry[];
  historyLoading: boolean;
  fullName: string;
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
  handleRunAts: () => Promise<void> | void;
  handleExport: (fileType?: "PDF" | "DOCX") => Promise<void> | void;
  handleDuplicate: () => void;
  handleDelete: () => void;
  setHistoryOpen: (open: boolean) => void;
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

const ACCENT_PRESETS = [
  "#7c3aed", // violet
  "#4f46e5", // indigo
  "#2563eb", // blue
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // rose
  "#0f172a", // slate
];

const FONT_PRESETS = [
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia (serif)" },
  {
    value: "\"Source Serif Pro\", Georgia, serif",
    label: "Source Serif",
  },
  { value: "\"JetBrains Mono\", monospace", label: "JetBrains Mono" },
];

function DesignSettings({
  accent,
  setAccent,
  font,
  setFont,
  fontSize,
  setFontSize,
}: {
  accent: string;
  setAccent: (v: string) => void;
  font: string;
  setFont: (v: string) => void;
  fontSize: number;
  setFontSize: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-muted-foreground">
          Accent colour
        </span>
        <div className="flex items-center gap-1.5">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAccent(c)}
              className={`h-6 w-6 rounded-md border shadow-sm transition ${
                accent.toLowerCase() === c
                  ? "ring-2 ring-offset-2 ring-foreground scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Accent ${c}`}
            />
          ))}
          <label className="relative inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-dashed bg-background hover:bg-muted">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom accent colour"
            />
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-muted-foreground">
          Body font
        </span>
        <select
          value={font}
          onChange={(e) => setFont(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          style={{ fontFamily: font, minWidth: "12rem" }}
        >
          {FONT_PRESETS.map((f) => (
            <option
              key={f.value}
              value={f.value}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span>Type size</span>
          <span className="text-foreground">{fontSize}px</span>
        </span>
        <input
          type="range"
          min={9}
          max={14}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-32 accent-violet-600"
        />
      </div>
    </div>
  );
}

function PlusMark({ className }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-sm border border-current leading-none ${className ?? ""}`}
    >
      <span className="-mt-0.5 text-[10px] font-bold">+</span>
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
      <span className="hidden text-[9px] font-medium uppercase tracking-wide text-muted-foreground lg:inline">
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
  exporting,
  duplicatePending,
  deletePending,
  atsData,
  atsLoading,
  historyOpen,
  historyEntries,
  historyLoading,
  fullName,
  patchPersonalInfo,
  patchSummary,
  patchExperience,
  patchEducation,
  patchSkills,
  patchLanguages,
  patchCertifications,
  handleAiRewriteSummary,
  handleAiRewriteExperience,
  handleRunAts,
  handleExport,
  handleDuplicate,
  handleDelete,
  setHistoryOpen,
}: Props) {
  const [section, setSection] = useState<SectionId>("personal");
  const [ribbon, setRibbon] = useState<RibbonId>("home");

  // Local styling overrides applied to the preview, not the API.
  const storageKey = `word-style-editor:${resume.id}`;
  const [accent, setAccent] = useState("#7c3aed");
  const [font, setFont] = useState(FONT_PRESETS[0].value);
  const [fontSize, setFontSize] = useState(11);
  const [zoom, setZoom] = useState(0.7);

  // Load persisted style on first render / when resume changes.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const cfg = JSON.parse(raw) as {
          accent?: string;
          font?: string;
          fontSize?: number;
          zoom?: number;
        };
        if (cfg.accent) setAccent(cfg.accent);
        if (cfg.font) setFont(cfg.font);
        if (typeof cfg.fontSize === "number") setFontSize(cfg.fontSize);
        if (typeof cfg.zoom === "number") setZoom(cfg.zoom);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ accent, font, fontSize, zoom })
      );
    } catch {
      /* ignore */
    }
  }, [storageKey, accent, font, fontSize, zoom]);

  const normalizedDraft = useMemo(
    () => normalizeContentData(draft),
    [draft]
  );

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

  const previewStyleVars: React.CSSProperties = {
    ["--wse-accent" as string]: accent,
    ["--wse-font" as string]: font,
    ["--wse-font-size" as string]: `${fontSize}px`,
    ["--resume-accent" as string]: accent,
    ["--accent" as string]: accent,
    ["--base-font" as string]: font,
    ["--base-font-size" as string]: `${fontSize}px`,
  };

  function goToRibbon(id: RibbonId, sectionHint?: SectionId) {
    setRibbon(id);
    if (sectionHint) setSection(sectionHint);
  }

  return (
    <div
      className="flex min-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-muted/40"
      style={previewStyleVars}
    >
      {/* File bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-white">
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
          <FileText className="hidden h-4 w-4 shrink-0 sm:block" />
          <span className="min-w-0 truncate text-sm font-semibold">
            {resume.title}
            {currentTemplate ? (
              <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                {currentTemplate.name}
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex items-center gap-1">
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
            Duplicate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={() => void handleExport("PDF")}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-white hover:bg-white/15 hover:text-white"
            onClick={() => void handleExport("DOCX")}
            disabled={exporting}
          >
            <Download className="h-3.5 w-3.5" />
            Export DOCX
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-rose-100 hover:bg-white/15 hover:text-white"
            onClick={handleDelete}
            disabled={deletePending}
          >
            {deletePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Ribbon: tabs */}
      <div className="flex items-end gap-1 border-b border-border bg-card px-3 pt-2">
        {(
          [
            { id: "home", label: "Home", Icon: Bold, IconClass: "h-3.5 w-3.5" },
            { id: "insert", label: "Insert", Icon: null, IconClass: "" },
            {
              id: "design",
              label: "Design",
              Icon: Palette,
              IconClass: "h-3.5 w-3.5",
            },
            {
              id: "review",
              label: "Review",
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
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-3 py-2 text-xs">
        {ribbon === "home" && (
          <>
            <RibbonGroup label="Section">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ["personal", "Personal", User],
                    ["summary", "Summary", Sparkles],
                    ["experience", "Experience", Briefcase],
                    ["education", "Education", GraduationCap],
                    ["skills", "Skills", List],
                    ["languages", "Languages", LanguagesIcon],
                    ["certifications", "Certs", GraduationCap],
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
                    className={`flex items-center gap-1 rounded-md px-2 py-1 font-medium transition ${
                      section === id
                        ? "bg-violet-100 text-violet-800"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </RibbonGroup>

            <RibbonSeparator />
            <RibbonGroup label="Style">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background hover:bg-muted"
                title="Bold (template)"
                aria-label="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background hover:bg-muted"
                title="Italic (template)"
                aria-label="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background hover:bg-muted"
                title="Underline (template)"
                aria-label="Underline"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </RibbonGroup>
            <RibbonGroup label="Color">
              <button
                type="button"
                className="h-7 w-7 rounded border border-border"
                style={{ backgroundColor: accent }}
                onClick={() => goToRibbon("design")}
                title="Open Design tab"
                aria-label="Accent colour"
              />
              <span className="ml-1 text-[10px] text-muted-foreground">
                Use the Design tab to retune colours.
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
          <div className="flex flex-1 items-center">
            <DesignSettings
              accent={accent}
              setAccent={setAccent}
              font={font}
              setFont={setFont}
              fontSize={fontSize}
              setFontSize={setFontSize}
            />
            <p className="ml-4 rounded-md bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Visual tweaks only — they stay in your browser.
              <br />
              The exported PDF keeps the template&apos;s original look.
            </p>
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
                className="flex items-center gap-1 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 px-2.5 py-1 font-medium text-white shadow hover:from-violet-700 hover:to-fuchsia-600"
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

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Page column */}
        <div className="relative flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-6">
          <div
            className="relative w-[210mm] max-w-full origin-top bg-white shadow-2xl ring-1 ring-border"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              marginBottom: `${(zoom - 1) * 60}vh`,
              padding: "18mm 16mm",
              minHeight: "297mm",
              fontFamily: font,
              fontSize: `${fontSize}px`,
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/5 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/5 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/5 to-transparent" />

            <div className="relative text-[#111]">
              <TemplateRenderedPreview
                resume={previewResume}
                scale={1}
                className="!border-0 !shadow-none !rounded-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>
                {currentTemplate?.name ?? "Template"} · {resume.type}
              </span>
              <span>Page 1 of 1 · {fullName || "Untitled candidate"}</span>
            </div>
          </div>
        </div>

        {/* Side panel: editable fields */}
        <aside className="flex w-full max-w-[420px] shrink-0 flex-col gap-3 border-l border-border bg-card p-4 xl:max-w-[440px]">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold">
                {sectionLabel(section)}
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Variables · auto-saved
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                />
              )}
              {section === "skills" && (
                <ChipListSection
                  title="Skills"
                  emoji="🛠️"
                  items={draft.skills ?? []}
                  onChange={patchSkills}
                  placeholder="e.g. React, Python, Figma"
                />
              )}
              {section === "languages" && (
                <ChipListSection
                  title="Languages"
                  emoji="🌐"
                  items={draft.languages ?? []}
                  onChange={patchLanguages}
                  placeholder="e.g. English (Fluent)"
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1.5 text-[11px] text-white">
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
            onClick={() =>
              setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
            }
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
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="h-1 w-28 accent-white"
            aria-label="Zoom level"
          />
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
            }
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/15"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded px-1.5 py-0.5 hover:bg-white/15"
          >
            100%
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
            onClick={() => void handleExport("PDF")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/15"
          >
            <Download className="h-3 w-3" /> PDF
          </button>
          <button
            type="button"
            onClick={() => void handleExport("DOCX")}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/15"
          >
            <Download className="h-3 w-3" /> DOCX
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
