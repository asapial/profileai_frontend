"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, ArrowRight, LifeBuoy, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { HelpArticle, HelpCategory } from "./data";

type CategoryDef = {
  id: HelpCategory | "all";
  label: string;
  description: string;
};

type Props = {
  articles: HelpArticle[];
  categories: CategoryDef[];
};

export function HelpCenter({ articles, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (activeCategory !== "all" && a.category !== activeCategory) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        (a.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, query, activeCategory]);

  const featured = useMemo(
    () => articles.filter((a) => a.category === "getting-started").slice(0, 3),
    [articles],
  );

  return (
    <>
      {/* Hero with search */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Help center"
            title={<>How can we help?</>}
            description="Search guides, walkthroughs, and answers. Most questions are answered in under a minute."
          />

          <div className="mt-10">
            <label htmlFor="help-search" className="sr-only">
              Search help articles
            </label>
            <div className="relative mx-auto max-w-2xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="help-search"
                type="search"
                value={query}
                onChange={(e) => {
                  const next = e.target.value;
                  setQuery(next);
                  if (next.length >= 3) {
                    track({ name: "help_search", properties: { q: next } });
                  }
                }}
                placeholder="Search for articles, e.g. 'ATS score' or 'refund'"
                className="w-full rounded-full border border-border bg-card py-4 pl-12 pr-5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar + list */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          {/* Category sidebar */}
          <aside aria-label="Help categories">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </h2>
            <ul className="mt-4 space-y-1">
              {categories.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        track({
                          name: "help_filter_category",
                          properties: { category: cat.id },
                        });
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span>{cat.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Article grid */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {query.trim()
                  ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for "${query.trim()}"`
                  : activeCategory === "all"
                    ? "All articles"
                    : categories.find((c) => c.id === activeCategory)?.label}
              </h2>
              {activeCategory !== "all" && !query.trim() && (
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {categories.find((c) => c.id === activeCategory)?.description}
                </p>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {filtered.map((article) => (
                  <li key={article.slug}>
                    <ArticleCard article={article} />
                  </li>
                ))}
              </ul>
            )}

            {/* Featured quick-starts (only when on "all" and no search) */}
            {activeCategory === "all" && !query.trim() && (
              <div className="mt-12">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick starts
                </h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  {featured.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/help/${a.slug}`}
                        className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition hover:border-violet-300 hover:shadow-md"
                      >
                        <BookOpen className="h-5 w-5 text-primary" />
                        <p className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary">
                          {a.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.readTime} min read
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* "Still need help?" escalation */}
            <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
                    <LifeBuoy className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                      Still need help?
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our support team typically replies in under 4 hours during
                      weekdays. Logged-in users can also open a support ticket.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="mailto:support@profileai.app"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <Mail className="h-4 w-4" />
                    Email support
                  </Link>
                  <Link
                    href="/dashboard/support"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
                  >
                    Open a ticket
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link
      href={`/help/${article.slug}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition hover:border-violet-300 hover:shadow-md"
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {article.category.replace("-", " ")}
      </span>
      <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {article.excerpt}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
        <span>{article.readTime} min read</span>
        <span className="inline-flex items-center gap-1 text-primary group-hover:underline">
          Read more <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Search className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-base font-semibold text-foreground">
        No articles found
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {query.trim()
          ? `We couldn't find anything matching "${query.trim()}".`
          : "No articles in this category yet."}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Try a different search term or{" "}
        <Link
          href="mailto:support@profileai.app"
          className="font-semibold text-primary hover:underline"
        >
          email our support team
        </Link>
        .
      </p>
    </div>
  );
}
