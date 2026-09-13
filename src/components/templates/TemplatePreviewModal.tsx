"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template, TemplateCategory } from "@/lib/hooks/useTemplates";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";

const atsScore: Record<TemplateCategory, number> = {
  ATS: 98,
  MODERN: 88,
  CLASSIC: 92,
  CREATIVE: 76,
};

export function TemplatePreviewModal({
  template,
  onClose,
  onUse,
  onCustomize,
}: {
  template: Template | null;
  onClose: () => void;
  onUse: () => void;
  onCustomize?: () => void;
}) {
  useEffect(() => {
    if (!template) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [template, onClose]);

  if (!template || typeof document === "undefined") return null;

  const ats = atsScore[template.category];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl sm:max-h-[94dvh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
              {template.category}
            </p>
            <h2 id="template-preview-title" className="text-xl font-semibold">
              {template.name}
            </h2>
            {template.description ? (
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-5 md:grid-cols-[minmax(0,1fr)_220px] md:gap-5">
          <div className="relative aspect-[210/297] w-full overflow-hidden rounded-xl border border-border bg-white shadow-inner">
            {template.htmlLayout && template.cssStyles ? (
              <TemplateDesignPreview template={template} priority />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Sparkles className="h-12 w-12 text-violet-400" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Tile label="ATS score" value={`${ats} / 100`} />
            <Tile label="Style" value={template.category} />
            <Tile label="Document design" value={template.documentType === "CV" ? "Curriculum Vitae (CV)" : "Professional Résumé"} />
            <Tile
              label="Used by"
              value={`${template._count.resumes} resumes`}
            />
            <div className="rounded-xl border border-border p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">About this template</p>
              <p>
                Optimized for readability and recruiter scanning. Each section
                renders with your live profile data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          {onCustomize ? (
            <Button variant="secondary" onClick={onCustomize} className="w-full sm:w-auto">
              Save an editable copy
            </Button>
          ) : null}
          <Button onClick={onUse} className="w-full gap-2 sm:w-auto">
            Use this template
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
