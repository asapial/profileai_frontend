"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template, TemplateCategory } from "@/lib/hooks/useTemplates";

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
}: {
  template: Template | null;
  onClose: () => void;
  onUse: () => void;
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

  if (!template) return null;

  const ats = atsScore[template.category];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
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

        <div className="grid flex-1 gap-4 overflow-y-auto p-3 sm:p-5 md:grid-cols-[minmax(0,1fr)_220px] md:gap-5">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted">
            {template.thumbnailUrl ? (
              <Image
                src={template.thumbnailUrl}
                alt={template.name}
                fill
                className="object-contain"
                sizes="(min-width: 768px) 60vw, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Sparkles className="h-12 w-12 text-violet-400" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Tile label="ATS score" value={`${ats} / 100`} />
            <Tile label="Style" value={template.category} />
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

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 p-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUse} className="gap-2">
            Use this template
          </Button>
        </div>
      </div>
    </div>
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
