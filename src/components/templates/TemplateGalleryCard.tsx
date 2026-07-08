"use client";

import Image from "next/image";
import { Eye, Sparkles } from "lucide-react";
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
}: {
  template: Template;
  onPreview: () => void;
  onUse: () => void;
}) {
  const ats = atsScore[template.category];
  const atsTone =
    ats >= 90 ? "bg-emerald-500" : ats >= 80 ? "bg-amber-500" : "bg-rose-500";

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:shadow-lg hover:border-violet-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        {template.thumbnailUrl ? (
          <Image
            src={template.thumbnailUrl}
            alt={template.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
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
        Used by {template._count.resumes}{" "}
        {template._count.resumes === 1 ? "resume" : "resumes"}
      </CardContent>

      <CardFooter className="mt-auto gap-2">
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
      </CardFooter>
    </Card>
  );
}