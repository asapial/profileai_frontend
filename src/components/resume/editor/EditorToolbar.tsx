"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  History,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import type { ResumeDetail, ResumeStatus } from "@/lib/hooks/useResumes";
import type { Template } from "@/lib/hooks/useTemplates";

const STATUS_BADGE: Record<ResumeStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  GENERATED: "bg-violet-100 text-violet-700",
  EXPORTED: "bg-emerald-100 text-emerald-700",
};

type Props = {
  resume: ResumeDetail;
  saving: boolean;
  templates: Template[];
  templatesLoading: boolean;
  exporting: boolean;
  onExport: () => Promise<void> | void;
  onToggleHistory: () => void;
  onRunAts: () => Promise<void> | void;
};

export function EditorToolbar({
  resume,
  saving,
  templates,
  templatesLoading,
  exporting,
  onExport,
  onToggleHistory,
  onRunAts,
}: Props) {
  const [open, setOpen] = useState(false);
  const current = templates.find((t) => t.id === resume.templateId);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            STATUS_BADGE[resume.status]
          }`}
        >
          {resume.status}
        </span>
        <span className="text-xs text-muted-foreground">{resume.type}</span>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={templatesLoading}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <span>
              Template:{" "}
              <span className="text-violet-700">
                {current?.name ?? "Pick one"}
              </span>
              {current ? (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {current.category}
                </span>
              ) : null}
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {open ? (
            <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-1 shadow-xl">
              {templates.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Loading…
                </p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    className={`flex w-full cursor-not-allowed items-start gap-2 rounded-lg px-3 py-2 text-left text-xs ${
                      t.id === resume.templateId ? "bg-violet-50" : ""
                    }`}
                  >
                    <span className="font-semibold">{t.name}</span>
                    <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {t.category}
                    </span>
                  </div>
                ))
              )}
              <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                Template switching is locked for this session. Use{" "}
                <span className="font-medium text-violet-600">Duplicate</span>{" "}
                on the dashboard to start a new resume in another layout.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {saving ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving changes…
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Save className="h-3 w-3" />
            All changes saved
          </span>
        )}

        <button
          type="button"
          onClick={() => void onRunAts()}
          className="flex items-center gap-1 rounded-md border border-violet-300 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          ATS check
        </button>
        <button
          type="button"
          onClick={onToggleHistory}
          className="flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={exporting}
          className="flex items-center gap-1 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:from-violet-700 hover:to-fuchsia-600 disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting…
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" /> Export PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
