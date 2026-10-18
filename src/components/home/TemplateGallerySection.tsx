"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Grid2X2,
  Heart,
  List,
  Search,
} from "lucide-react";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import type { FeaturedTemplate, TemplateCategory } from "@/lib/api";
import type { ManagedHomepageSection } from "@/lib/homepage";

const CATEGORIES: Array<"ALL" | TemplateCategory> = ["ALL", "MODERN", "CREATIVE", "CLASSIC", "ATS"];
const SHORTLIST_KEY = "profileai:template-shortlist";

function categoryLabel(category: "ALL" | TemplateCategory) {
  if (category === "ALL") return "All templates";
  return category === "ATS" ? "ATS friendly" : category.charAt(0) + category.slice(1).toLowerCase();
}

function templateMeta(template: FeaturedTemplate, documentType: "RESUME" | "CV") {
  const kind = documentType === "CV" ? "Curriculum vitae" : "Resume";
  return `${categoryLabel(template.category)} · ${kind}`;
}

/** Lightweight shortlist kept on the device — no account required to compare designs. */
function useShortlist() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHORTLIST_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        const stored = parsed.filter((id): id is string => typeof id === "string");
        queueMicrotask(() => setSaved(stored));
      }
    } catch {
      /* A blocked or corrupted store just means an empty shortlist. */
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try {
        window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next));
      } catch {
        /* Persisting is best-effort. */
      }
      return next;
    });
  }, []);

  return { saved, toggle };
}

/** Mounts the document renderer only once a card is near the viewport. */
function CardPreview({ template, eager }: { template: FeaturedTemplate; eager: boolean }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible) return;
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <span ref={hostRef} className="template-showcase__card-face" data-pending={!visible || undefined}>
      {visible ? (
        <TemplateDesignPreview template={template} priority={eager} as="span" />
      ) : (
        <span className="template-showcase__card-skeleton" aria-hidden="true" />
      )}
    </span>
  );
}

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
  const [category, setCategory] = useState<"ALL" | TemplateCategory>("ALL");
  const [sort, setSort] = useState<"popular" | "name">("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeIndex, setActiveIndex] = useState(0);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const { saved, toggle: toggleSaved } = useShortlist();
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = templates.filter(
      (template) =>
        (template.documentType || "RESUME") === documentType &&
        (category === "ALL" || template.category === category) &&
        (!shortlistOnly || saved.includes(template.id)) &&
        `${template.name} ${template.description || ""} ${template.category}`.toLowerCase().includes(query),
    );

    if (full) {
      filtered.sort((first, second) =>
        sort === "name"
          ? first.name.localeCompare(second.name)
          : second._count.resumes - first._count.resumes || first.displayOrder - second.displayOrder,
      );
      return filtered;
    }

    return filtered.slice(0, 3);
  }, [category, documentType, full, saved, search, shortlistOnly, sort, templates]);

  if (!full) {
    return (
      <section id="templates" className="py-16 sm:py-24">
        <div className="studio-container">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="studio-eyebrow mb-5 text-primary">THE COLLECTION</p>
              <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
                {content?.title || "A good story deserves a good layout."}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Choose a starting point. Make the type, color and every word your own.
              </p>
            </div>
            <Link href="/templates" className="studio-text-link shrink-0">
              View the collection <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="my-8 flex gap-2 border-y py-4" aria-label="Document type">
            {(["RESUME", "CV"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={documentType === type}
                onClick={() => { setDocumentType(type); setActiveIndex(0); }}
                className={`rounded-md px-4 py-2 text-sm transition-colors ${documentType === type ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {type === "RESUME" ? "Resumes" : "CVs"}
                <span className="ml-2 text-xs opacity-70">
                  {totals?.[type] ?? templates.filter((item) => (item.documentType || "RESUME") === type).length}
                </span>
              </button>
            ))}
          </div>
          {visible.length ? (
            <div className="template-3d-grid grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((template) => (
                <Link key={template.id} href={`/templates/${template.id}`} className="template-3d-card group">
                  <div className="template-3d-stage overflow-hidden rounded-md border bg-muted p-5 transition-colors group-hover:bg-accent">
                    <TemplateDesignPreview template={template} className="template-3d-sheet shadow-sm" />
                  </div>
                  <div className="flex items-center justify-between gap-3 py-5">
                    <div>
                      <h3 className="text-base font-semibold">{template.name}</h3>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {template.category.toLowerCase()} · {documentType === "CV" ? "Curriculum vitae" : "Resume"}
                      </p>
                    </div>
                    <ArrowUpRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <TemplateEmpty search={search} onClear={() => setSearch("")} />
          )}
        </div>
      </section>
    );
  }

  const active = visible.length ? visible[activeIndex % visible.length] : null;
  const stageCount = Math.min(5, visible.length);
  const stageStart = -Math.floor(stageCount / 2);
  const stageTemplates = Array.from({ length: stageCount }, (_, position) => {
    const offset = stageStart + position;
    const index = (activeIndex + offset + visible.length) % visible.length;
    return { template: visible[index], offset, index };
  });

  const mostUsedId = visible.length
    ? visible.reduce((leader, item) => (item._count.resumes > leader._count.resumes ? item : leader), visible[0]).id
    : null;
  const showPopularFlag = Boolean(
    active && active.id === mostUsedId && active._count.resumes > 0 && visible.length > 1,
  );

  const moveCarousel = (direction: number) => {
    if (!visible.length) return;
    setActiveIndex((current) => (current + direction + visible.length) % visible.length);
  };

  const resetStage = () => setActiveIndex(0);

  return (
    <section id="templates" className="template-showcase">
      <div className="template-showcase__shell">
        <header className="template-showcase__intro">
          <div className="template-showcase__heading">
            <p className="template-showcase__eyebrow">Resume templates</p>
            <h1>Find your kind of first impression.</h1>
            <p className="template-showcase__lede">
              Professionally designed layouts for every industry, story and career stage.
            </p>
          </div>
          <div className="template-showcase__controls">
            <label className="template-showcase__search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search templates</span>
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); resetStage(); }}
                placeholder="Search templates, e.g. Product Manager"
              />
            </label>
            <div className="template-showcase__chip-row" role="group" aria-label="Filter by style">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="template-showcase__chip"
                  aria-pressed={category === item}
                  onClick={() => { setCategory(item); resetStage(); }}
                >
                  {categoryLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      {active ? (
        <div
          className="template-showcase__hall"
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Template showroom. ${active.name} is on display.`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") { event.preventDefault(); moveCarousel(1); }
            if (event.key === "ArrowLeft") { event.preventDefault(); moveCarousel(-1); }
          }}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("a, button, input")) return;
            dragRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = dragRef.current;
            dragRef.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) moveCarousel(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          <div className="template-showcase__stage">
            <span className="template-showcase__stage-backdrop" aria-hidden="true" />
            <span className="template-showcase__stage-floor" aria-hidden="true" />
            <span className="template-showcase__stage-podiums" aria-hidden="true" />
            <span className="template-showcase__stage-scrim" aria-hidden="true" />
            <span className="template-showcase__stage-dais" aria-hidden="true" />

            {stageTemplates.map(({ template, offset, index }) => (
              <button
                key={template.id}
                type="button"
                className="template-showcase__exhibit"
                data-offset={offset}
                aria-label={`Show ${template.name}`}
                aria-current={offset === 0 ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
              >
                <span className="template-showcase__exhibit-face">
                  <span className="template-showcase__exhibit-stack" aria-hidden="true" />
                  <TemplateDesignPreview template={template} priority={offset === 0} as="span" />
                </span>
                <span className="template-showcase__plaque" aria-hidden="true">
                  <strong>{template.name}</strong>
                  <small>{templateMeta(template, documentType)}</small>
                </span>
              </button>
            ))}

            {showPopularFlag && (
              <p className="template-showcase__flag">
                <Crown size={13} aria-hidden="true" /> Most popular
              </p>
            )}

            <button
              type="button"
              className="template-showcase__arrow template-showcase__arrow--prev"
              onClick={() => moveCarousel(-1)}
              aria-label="Previous template"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="template-showcase__arrow template-showcase__arrow--next"
              onClick={() => moveCarousel(1)}
              aria-label="Next template"
            >
              <ChevronRight aria-hidden="true" />
            </button>

            <div className="template-showcase__spotlight" aria-live="polite">
              <h2>{active.name}</h2>
              <p>{templateMeta(active, documentType)}</p>
              <Link href={`/templates/${active.id}`} className="template-showcase__cta">
                Use this template <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <small className="template-showcase__hint">Drag sideways or use the arrow keys</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="template-showcase__shell">
          <TemplateEmpty
            search={search}
            shortlisted={shortlistOnly}
            onClear={() => setSearch("")}
            onClearShortlist={() => { setShortlistOnly(false); resetStage(); }}
          />
        </div>
      )}

      {visible.length > 0 && (
        <div className="template-showcase__shell">
          <div className="template-showcase__collection">
            <div className="template-showcase__toolbar">
              <div>
                <p>{shortlistOnly ? "Your shortlist" : "Curated collection"}</p>
                <h2>
                  {shortlistOnly ? "Saved templates" : "All templates"} <span>({visible.length})</span>
                </h2>
              </div>
              <div className="template-showcase__toolbar-actions">
                <div role="group" aria-label="Document type" className="template-showcase__document-switch">
                  {(["RESUME", "CV"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={documentType === type}
                      onClick={() => { setDocumentType(type); resetStage(); }}
                    >
                      {type === "RESUME" ? "Resumes" : "CVs"}
                      <span>{totals?.[type] ?? templates.filter((item) => (item.documentType || "RESUME") === type).length}</span>
                    </button>
                  ))}
                </div>
                {(saved.length > 0 || shortlistOnly) && (
                  <button
                    type="button"
                    className="template-showcase__toolbar-saved"
                    aria-pressed={shortlistOnly}
                    onClick={() => { setShortlistOnly((value) => !value); resetStage(); }}
                  >
                    <Heart size={14} aria-hidden="true" fill={shortlistOnly ? "currentColor" : "none"} />
                    Saved <span>{saved.length}</span>
                  </button>
                )}
                <label className="template-showcase__sort">
                  <span className="sr-only">Sort templates</span>
                  <select value={sort} onChange={(event) => { setSort(event.target.value as "popular" | "name"); resetStage(); }}>
                    <option value="popular">Sort: Most used</option>
                    <option value="name">Sort: Name</option>
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </label>
                <div className="template-showcase__view" role="group" aria-label="View options">
                  <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                    <Grid2X2 size={16} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>
                    <List size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="template-showcase__grid" data-view={view}>
              {visible.map((template, index) => (
                <article key={template.id} className="template-showcase__card">
                  <div className="template-showcase__card-stage">
                    <span className="template-showcase__card-dais" aria-hidden="true" />
                    <CardPreview template={template} eager={index < 4} />
                    {template.id === mostUsedId && template._count.resumes > 0 && (
                      <span className="template-showcase__card-badge">
                        <Crown size={11} aria-hidden="true" /> Most popular
                      </span>
                    )}
                    <button
                      type="button"
                      className="template-showcase__save"
                      aria-pressed={saved.includes(template.id)}
                      aria-label={
                        saved.includes(template.id)
                          ? `Remove ${template.name} from your saved templates`
                          : `Save ${template.name} to your list`
                      }
                      onClick={() => toggleSaved(template.id)}
                    >
                      <Heart size={16} aria-hidden="true" fill={saved.includes(template.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="template-showcase__card-copy">
                    <div>
                      <h3>{template.name}</h3>
                      <p>{templateMeta(template, documentType)}</p>
                    </div>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </div>
                  <Link
                    href={`/templates/${template.id}`}
                    className="template-showcase__card-link"
                    aria-label={`Open the ${template.name} template`}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TemplateEmpty({
  search,
  shortlisted = false,
  onClear,
  onClearShortlist,
}: {
  search: string;
  shortlisted?: boolean;
  onClear: () => void;
  onClearShortlist?: () => void;
}) {
  return (
    <div role="status" className="template-showcase__empty">
      <p>
        {search
          ? "No templates match that search."
          : shortlisted
            ? "Your shortlist is empty."
            : "No templates are available right now."}
      </p>
      <span>
        {search
          ? "Try another name, style or document type."
          : shortlisted
            ? "Save designs with the heart on any card and they will collect here."
            : "Try another document type or check back shortly."}
      </span>
      <div className="template-showcase__empty-actions">
        {search && <button type="button" onClick={onClear}>Clear search</button>}
        {shortlisted && onClearShortlist && <button type="button" onClick={onClearShortlist}>Show every template</button>}
      </div>
    </div>
  );
}
