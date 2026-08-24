"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Files, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import type { FeaturedTemplate } from "@/lib/api";
import type { ManagedHomepageSection } from "@/lib/homepage";

export function TemplateGallerySection({
  content,
  templates,
}: {
  content?: ManagedHomepageSection;
  templates: FeaturedTemplate[];
}) {
  const [documentType, setDocumentType] = useState<"RESUME" | "CV">("RESUME");
  const visible = useMemo(
    () => templates.filter((template) => template.documentType === documentType).slice(0, 6),
    [documentType, templates],
  );
  const totals = useMemo(
    () => ({
      RESUME: templates.filter((template) => template.documentType === "RESUME").length,
      CV: templates.filter((template) => template.documentType === "CV").length,
    }),
    [templates],
  );

  return (
    <section id="templates" className="relative py-20 sm:py-28">
      <div aria-hidden className="absolute inset-x-0 top-24 mx-auto h-96 max-w-5xl rounded-full bg-gradient-to-r from-violet-500/12 via-fuchsia-400/8 to-cyan-400/12 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden rounded-[2rem] border-white/60 p-5 shadow-[0_35px_100px_-55px_rgba(76,29,149,.55)] sm:p-8 lg:p-10 dark:border-white/10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <SectionHeader
              align="left"
              eyebrow={content?.eyebrow || "Template studio"}
              title={<>{content?.title || "Original designs. Your story, beautifully structured."}</>}
              description={content?.description || "Explore 30 professional résumés and 30 detailed CVs. Every preview below is the actual editable document—not a decorative thumbnail."}
            />
            <div className="grid grid-cols-3 gap-2">
              <Metric value="60" label="editable designs" icon={Files} />
              <Metric value="100%" label="live previews" icon={Palette} />
              <Metric value="Admin" label="reviewed" icon={ShieldCheck} />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-y border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-xl border border-border/70 bg-background/55 p-1 shadow-sm backdrop-blur-xl">
              {(["RESUME", "CV"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocumentType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${documentType === type ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {type === "RESUME" ? "Résumé templates" : "CV templates"}
                  <span className="ml-2 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">{totals[type] || 30}</span>
                </button>
              ))}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-4 w-4 text-emerald-500" />
              Customize colors, typography and spacing, then save to your gallery.
            </p>
          </div>

          {visible.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((template, index) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={`group overflow-hidden rounded-2xl border border-white/60 bg-background/50 p-3 shadow-lg shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-white/10 ${index === 0 ? "sm:row-span-1" : ""}`}
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 via-white to-cyan-100 p-2 dark:from-violet-950/60 dark:via-slate-950 dark:to-cyan-950/50">
                    <TemplateDesignPreview template={template} className="rounded-lg shadow-xl transition duration-500 group-hover:scale-[1.015]" />
                    <span className="absolute right-4 top-4 rounded-full bg-slate-950/85 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                      {template.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-4">
                    <div>
                      <h3 className="font-semibold tracking-tight">{template.name}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-background/35 text-sm text-muted-foreground">
              Template previews are being prepared.
            </div>
          )}

          <div className="mt-9 flex flex-col items-center justify-between gap-4 rounded-2xl border border-violet-500/15 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/5 to-cyan-500/8 p-5 sm:flex-row">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Create your own gallery edition</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Save a private variation, use it for your documents, or submit it for admin-approved publication.</p>
              </div>
            </div>
            <CtaButton
              href={content?.primaryCta?.href ?? "/templates"}
              label={content?.primaryCta?.label ?? "Explore all 60 templates"}
              variant="secondary"
              eventName="gallery_browse_all"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Files }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/45 p-3 text-center backdrop-blur-xl">
      <Icon className="mx-auto h-4 w-4 text-violet-500" />
      <p className="mt-2 text-sm font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
