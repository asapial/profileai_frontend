"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Search, SlidersHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TemplateGalleryCard } from "@/components/templates/TemplateGalleryCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import {
  useTemplates,
  TEMPLATE_SORTS,
  sortTemplates,
  type Template,
  type TemplateCategory,
  type TemplateSort,
} from "@/lib/hooks/useTemplates";

const categories: { value: TemplateCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "MODERN", label: "Modern" },
  { value: "CLASSIC", label: "Classic" },
  { value: "CREATIVE", label: "Creative" },
  { value: "ATS", label: "ATS-first" },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [category, setCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<TemplateSort>("featured");
  const [preview, setPreview] = useState<Template | null>(null);

  const { data, isLoading, isError } = useTemplates({
    category,
    featured: featuredOnly,
  });

  const filtered = sortTemplates(
    (data ?? []).filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      );
    }),
    sort
  );

  const goUseTemplate = (t: Template) => {
    router.push(`/resume/create?templateId=${encodeURIComponent(t.id)}`);
  };

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <LayoutGrid className="h-6 w-6 text-violet-500" />
            Template gallery
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a layout. Each template is ATS-tested and customizable.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/dashboard">Back to dashboard</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filter sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <SlidersHorizontal className="h-4 w-4 text-violet-500" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
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
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Featured only</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={featuredOnly}
                  onClick={() => setFeaturedOnly((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition ${
                    featuredOnly ? "bg-violet-600" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                      featuredOnly ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </label>

              <div className="text-xs text-muted-foreground">
                Showing {filtered.length} of {data?.length ?? 0} templates
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Grid */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templatesâ€¦"
                className="pl-9"
              />
            </div>
            <label className="flex items-center justify-between gap-2 text-xs sm:justify-start">
              <span className="font-medium text-muted-foreground">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TemplateSort)}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                aria-label="Sort templates"
              >
                {TEMPLATE_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading templates…
            </p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-rose-600">
              Failed to load templates.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No templates match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <TemplateGalleryCard
                  key={t.id}
                  template={t}
                  onPreview={() => setPreview(t)}
                  onUse={() => goUseTemplate(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TemplatePreviewModal
        template={preview}
        onClose={() => setPreview(null)}
        onUse={() => {
          if (preview) goUseTemplate(preview);
        }}
      />
    </div>
  );
}
