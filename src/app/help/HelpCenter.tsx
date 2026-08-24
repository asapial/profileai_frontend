"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  FileText,
  LifeBuoy,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
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

const QUICK_PATHS = [
  { slug: "create-your-first-resume", label: "Start here", description: "Build, review, and export your first résumé.", icon: FileText },
  { slug: "ats-score-explained", label: "Understand ATS", description: "See what the score measures and what it cannot.", icon: Compass },
  { slug: "enable-two-factor-auth", label: "Protect your account", description: "Add two-factor authentication and recovery codes.", icon: ShieldCheck },
] as const;

export function HelpCenter({ articles, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (activeCategory !== "all" && article.category !== activeCategory) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.body.toLowerCase().includes(q) ||
        (article.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [articles, query, activeCategory]);

  const selectedCategory = categories.find((category) => category.id === activeCategory);
  const quickPaths = QUICK_PATHS.map((path) => ({
    ...path,
    article: articles.find((article) => article.slug === path.slug),
  })).filter((path) => path.article);

  return (
    <div className="relative isolate overflow-hidden pb-20 sm:pb-28">
      <div className="premium-grid-mask pointer-events-none absolute inset-x-0 top-0 -z-20 h-[44rem] opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-28 -z-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl motion-safe:animate-pulse" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-72 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl motion-safe:animate-pulse" aria-hidden="true" />

      <section className="premium-section px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
        <div className="glass-panel premium-ring relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/14 via-cyan-500/6 to-transparent" aria-hidden="true" />
          <div className="grid items-center gap-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
            <div>
              <span className="premium-kicker"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Product support</span>
              <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">Find a useful answer without losing your momentum.</h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">Search practical walkthroughs for résumé building, responsible AI writing, ATS scoring, exports, billing, and account protection.</p>

              <div className="mt-8 max-w-2xl">
                <label htmlFor="help-search" className="sr-only">Search help articles</label>
                <div className="glass-subtle relative rounded-2xl p-1.5 shadow-xl shadow-violet-500/10">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-600 dark:text-violet-300" aria-hidden="true" />
                  <input
                    id="help-search"
                    type="search"
                    value={query}
                    onChange={(event) => {
                      const next = event.target.value;
                      setQuery(next);
                      if (next.length >= 3) track({ name: "help_search", properties: { q: next } });
                    }}
                    placeholder="Try ‘ATS score’, ‘refund’, or ‘PDF export’"
                    className="min-h-12 w-full rounded-xl border-0 bg-background/75 py-3 pl-12 pr-4 text-sm shadow-inner outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-violet-500 sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="glass-subtle relative overflow-hidden rounded-[1.75rem] p-6 sm:p-7">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"><LifeBuoy className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Support promise</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Clear steps, honest limits, human escalation.</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Every guide tells you what to do, what changes, and when account verification or a specialist is required.</p>
              <ul className="mt-5 space-y-3">
                {["Self-service guidance for core workflows", "Weekday support for account and billing questions", "Continuous intake for responsible security reports"].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-foreground/85"><Check className="mt-1 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden="true" />{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-3 border-t border-border/60 pt-7 lg:grid-cols-4">
            <Metric value={String(articles.length)} label="practical guides" />
            <Metric value={String(categories.length - 1)} label="support topics" />
            <Metric value="<4h" label="typical weekday reply" />
            <Metric value="24/7" label="security report intake" />
          </dl>
        </div>
      </section>

      <section aria-labelledby="quick-paths-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Popular paths</p>
            <h2 id="quick-paths-heading" className="mt-2 text-2xl font-semibold tracking-tight">Solve the most common tasks first.</h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">Focused, step-by-step, and editable at your pace.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {quickPaths.map(({ article, label, description, icon: Icon }) => article && (
            <Link key={article.slug} href={`/help/${article.slug}`} className="glass-panel group rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/45 hover:shadow-xl hover:shadow-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-violet-600" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">{label}</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{article.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <p className="mt-4 text-xs font-medium text-muted-foreground">{article.readTime} min read</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="all-articles-heading" className="mx-auto mt-16 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
        <aside aria-label="Help categories" className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-subtle rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Browse by topic</p>
            <ul className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
              {categories.map((category) => {
                const active = activeCategory === category.id;
                const count = category.id === "all" ? articles.length : articles.filter((article) => article.category === category.id).length;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(category.id);
                        track({ name: "help_filter_category", properties: { category: category.id } });
                      }}
                      className={cn("flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500", active ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}
                    >
                      <span className="line-clamp-2">{category.label}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px]", active ? "bg-background/15 text-background" : "bg-background/70 text-muted-foreground")}>{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 border-t border-border/60 pt-4 text-xs leading-5 text-muted-foreground">{selectedCategory?.description}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Knowledge base</p>
              <h2 id="all-articles-heading" className="mt-2 text-2xl font-semibold tracking-tight">
                {query.trim() ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${query.trim()}”` : selectedCategory?.label ?? "All articles"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} article{filtered.length === 1 ? "" : "s"}</p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState query={query} onReset={() => { setQuery(""); setActiveCategory("all"); }} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">{filtered.map((article) => <li key={article.slug}><ArticleCard article={article} /></li>)}</ul>
          )}

          <div className="glass-panel premium-ring relative mt-12 overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/14 via-cyan-500/7 to-transparent" aria-hidden="true" />
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex max-w-2xl items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"><LifeBuoy className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Human support</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Still need help? Bring us the context.</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Include your account email, the affected feature, and what you expected. Never send passwords, one-time codes, or full payment-card details.</p>
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                <Link href="mailto:support@profileai.app" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2.5 text-sm font-semibold transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Mail className="h-4 w-4" aria-hidden="true" />Email support</Link>
                <Link href="/dashboard/support" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Open a ticket<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="glass-subtle rounded-2xl p-4"><dt className="text-xs leading-5 text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{value}</dd></div>;
}

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link href={`/help/${article.slug}`} className="glass-panel group flex h-full flex-col rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/45 hover:shadow-xl hover:shadow-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex rounded-full border border-violet-500/15 bg-violet-500/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">{article.category.replace("-", " ")}</span>
        <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground transition group-hover:text-violet-700 dark:group-hover:text-violet-300">{article.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{article.readTime} min</span>
        <span className="inline-flex items-center gap-1 font-semibold text-violet-700 dark:text-violet-300">Read guide<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="glass-panel rounded-[1.75rem] p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><Search className="h-5 w-5" aria-hidden="true" /></span>
      <h3 className="mt-4 text-lg font-semibold">No matching guides</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">We could not find an article matching “{query.trim()}”. Try a broader phrase or reset the filters.</p>
      <button type="button" onClick={onReset} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Reset search</button>
    </div>
  );
}
