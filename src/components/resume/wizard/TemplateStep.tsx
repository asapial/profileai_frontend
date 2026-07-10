"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
import {
  useTemplate,
  useTemplates,
  type Template,
  type TemplateCategory,
} from "@/lib/hooks/useTemplates";

const CATEGORIES: Array<{ value: TemplateCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "MODERN", label: "Modern" },
  { value: "CLASSIC", label: "Classic" },
  { value: "CREATIVE", label: "Creative" },
  { value: "ATS", label: "ATS-first" },
];

const CATEGORY_TONE: Record<TemplateCategory, string> = {
  MODERN: "bg-violet-100 text-violet-700",
  CLASSIC: "bg-slate-100 text-slate-700",
  CREATIVE: "bg-fuchsia-100 text-fuchsia-700",
  ATS: "bg-emerald-100 text-emerald-700",
};

export function TemplateStep({
  templateId,
  onSelect,
}: {
  templateId: string;
  onSelect: (id: string) => void;
}) {
  const [category, setCategory] = useState<TemplateCategory | "ALL">("ALL");

  const { data: templates = [], isLoading, isError } = useTemplates({ category });

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Choose a template</h2>
        <p className="text-sm text-muted-foreground">
          Each layout is ATS-tested. You can switch later without losing data.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              category === c.value
                ? "border-violet-500 bg-violet-500 text-white"
                : "border-border bg-background hover:border-violet-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading templates…
        </p>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-rose-600">
          Failed to load templates.
        </p>
      ) : templates.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No templates match this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
          {templates.map((t) => (
            <TemplateTile
              key={t.id}
              template={t}
              selected={templateId === t.id}
              onSelect={() => onSelect(t.id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Prefer to browse the full gallery?{" "}
        <Link
          href="/templates"
          className="font-medium text-violet-600 hover:underline"
        >
          Open template library
        </Link>
        .
      </p>
    </div>
  );
}

function TemplateTile({
  template,
  selected,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/40"
          : "border-border bg-card hover:border-violet-300"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {template.thumbnailUrl ? (
          <Image
            src={template.thumbnailUrl}
            alt={template.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(min-width: 768px) 25vw, (min-width: 420px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            CATEGORY_TONE[template.category]
          }`}
        >
          {template.category}
        </span>
        {selected ? (
          <span className="absolute right-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            Selected
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{template.name}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {template.description ?? "ATS-tested layout."}
        </p>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
 * Sidebar card shown while user is on this step
 * ────────────────────────────────────────────────────────── */

export function TemplateStepSidebar({ templateId }: { templateId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Selected template</CardTitle>
        <CardDescription>
          Switch anytime from the editor without losing content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templateId ? (
          <SelectedTemplateDetails id={templateId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No template chosen yet.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href="/templates">
            <Eye className="h-3.5 w-3.5" />
            Browse gallery
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function SelectedTemplateDetails({ id }: { id: string }) {
  const { data, isLoading } = useTemplate(id);
  if (isLoading)
    return <p className="text-xs text-muted-foreground">Loading…</p>;
  if (!data) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{data.template.name}</p>
      <p className="text-xs text-muted-foreground">
        {data.template.description ?? "ATS-tested layout."}
      </p>
      <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
        {data.template.category}
      </span>
    </div>
  );
}
