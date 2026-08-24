"use client";

import { CopyPlus, Eye, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Template, TemplateCategory } from "@/lib/hooks/useTemplates";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";

const categoryTone: Record<TemplateCategory, string> = {
  MODERN: "bg-violet-100 text-violet-700",
  CLASSIC: "bg-slate-100 text-slate-700",
  CREATIVE: "bg-fuchsia-100 text-fuchsia-700",
  ATS: "bg-emerald-100 text-emerald-700",
};

const atsScore: Record<TemplateCategory, number> = {
  ATS: 98,
  MODERN: 88,
  CLASSIC: 92,
  CREATIVE: 76,
};

export function TemplateGalleryCard({
  template,
  onPreview,
  onUse,
  onCustomize,
}: {
  template: Template;
  onPreview: () => void;
  onUse: () => void;
  onCustomize?: () => void;
}) {
  const ats = atsScore[template.category];
  const atsTone =
    ats >= 90 ? "bg-emerald-500" : ats >= 80 ? "bg-amber-500" : "bg-rose-500";

  return (
    <Card className="glass-panel group flex h-full flex-col overflow-hidden border-white/55 transition duration-300 hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-white/10">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-100/70 via-white to-sky-100/70 p-3 dark:from-violet-950/40 dark:via-slate-950 dark:to-sky-950/40">
        {template.htmlLayout && template.cssStyles ? (
          <TemplateDesignPreview
            template={template}
            className="rounded-lg shadow-[0_18px_50px_-24px_rgba(15,23,42,.5)] transition duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex aspect-[210/297] items-center justify-center rounded-lg bg-white">
            <Sparkles className="h-10 w-10 text-violet-400" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryTone[template.category]}`}
          >
            {template.category}
          </span>
          {template.isDefault ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Default
            </span>
          ) : null}
          <span className="rounded-full bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {template.documentType}
          </span>
        </div>
        <div
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full ${atsTone} px-2 py-0.5 text-[10px] font-semibold uppercase text-white`}
        >
          ATS {ats}
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1 text-base">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description ?? "A clean, modern resume layout."}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-violet-500" />Fully editable</span>
        <span className="mx-2">·</span>
        Used by {template._count.resumes}{" "}
        {template._count.resumes === 1 ? "resume" : "resumes"}
      </CardContent>

      <CardFooter className="mt-auto grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="flex-1 gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>
        <Button size="sm" onClick={onUse} className="flex-1">
          Use
        </Button>
        {onCustomize ? (
          <Button size="sm" variant="secondary" onClick={onCustomize} className="col-span-2 gap-1.5">
            <CopyPlus className="h-3.5 w-3.5" />
            Customize & save a copy
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
