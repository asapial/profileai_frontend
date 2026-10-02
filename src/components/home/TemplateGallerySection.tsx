"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import type { FeaturedTemplate } from "@/lib/api";
import type { ManagedHomepageSection } from "@/lib/homepage";
export function TemplateGallerySection({
  content,
  templates,
  full = false,
  totals,
}: {
  content?: ManagedHomepageSection;
  templates: FeaturedTemplate[];
  full?: boolean;
  totals?: Record<"RESUME" | "CV", number>;
}) {
  const [documentType, setDocumentType] = useState<"RESUME" | "CV">("RESUME");
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () =>
      templates
        .filter(
          (template) =>
            (template.documentType || "RESUME") === documentType &&
            `${template.name} ${template.description || ""} ${template.category}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .slice(0, full ? undefined : 3),
    [documentType, templates, search, full],
  );
  const Heading = full ? "h1" : "h2";
  return (
    <section id="templates" className="py-16 sm:py-24">
      <div className="studio-container">
        <div
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
          suppressHydrationWarning
        >
          <div>
            <p className="studio-eyebrow mb-5 text-primary">
              THE COLLECTION
            </p>
            <Heading className="font-serif text-4xl tracking-tight sm:text-5xl">
              {full
                ? "Find your kind of first impression."
                : content?.title || "A good story deserves a good layout."}
            </Heading>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Choose a starting point. Make the type, color and every word your
              own.
            </p>
          </div>
          {!full && (
            <Link href="/templates" className="studio-text-link shrink-0">
              View the collection <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
        <div className="my-8 flex flex-wrap items-center justify-between gap-4 border-y py-4">
          <div className="flex gap-2" aria-label="Document type">
            {(["RESUME", "CV"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={documentType === type}
                onClick={() => setDocumentType(type)}
                className={`rounded-md px-4 py-2 text-sm transition-colors ${documentType === type ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {type === "RESUME" ? "Resumes" : "CVs"}
                <span className="ml-2 text-xs opacity-70">
                  {
                    totals?.[type] ?? templates.filter(
                      (t) => (t.documentType || "RESUME") === type,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          {full && (
            <label className="flex items-center gap-2 rounded-md border bg-card px-3">
              <Search size={16} className="text-muted-foreground" />
              <input
                aria-label="Search templates"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or style"
                className="h-10 w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>
          )}
        </div>
        {visible.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group"
                      suppressHydrationWarning
              >
                <div className="overflow-hidden rounded-md border bg-muted p-5 transition-colors group-hover:bg-accent">
                  <TemplateDesignPreview
                    template={template}
                    className="shadow-sm transition-transform duration-300 group-hover:-translate-y-1"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 py-5">
                  <div>
                    <h3 className="text-base font-semibold">{template.name}</h3>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {template.category.toLowerCase()} ·{" "}
                      {documentType === "CV" ? "Curriculum vitae" : "Resume"}
                    </p>
                  </div>
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            role="status"
            className="rounded-md border border-dashed px-6 py-16 text-center"
          >
            <p className="font-medium">
              {search
                ? "No templates match that search."
                : "No templates are available right now."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "Try another name or style, or switch document type."
                : "Try another document type or check back shortly."}
            </p>
            {search && (
              <button
                className="studio-text-link mt-5"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
