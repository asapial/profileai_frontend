"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { track } from "@/lib/analytics";
import type { HelpArticle, HelpCategory } from "@/app/help/data";
import { PublicEnvironment } from "./PublicPageShell";
import styles from "./PublicPages.module.css";

type Category = { id: HelpCategory | "all"; label: string; description: string };
const paths = [
  { slug: "create-your-first-resume", title: "Build your first resume", description: "Create a professional resume step by step." },
  { slug: "ats-score-explained", title: "Understand ATS scoring", description: "Learn what the score measures and what it cannot." },
  { slug: "enable-two-factor-auth", title: "Protect your account", description: "Keep your account secure and in control." },
];

export function PublicHelpCenter({ articles, categories }: { articles: HelpArticle[]; categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");
  const resultsRef = useRef<HTMLElement>(null);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return articles.filter(article => (category === "all" || article.category === category) &&
      (!search || [article.title, article.excerpt, article.body, ...(article.tags ?? [])].some(text => text.toLowerCase().includes(search))));
  }, [articles, category, query]);
  const activeCategory = categories.find(item => item.id === category);
  const chooseCategory = (next: HelpCategory | "all") => {
    setCategory(next); track({ name: "help_filter_category", properties: { category: next } });
  };

  return <>
    <section className={`${styles.hero} ${styles.helpHero}`}>
      <PublicEnvironment kind="help" />
      <div className={styles.container}><div className={styles.heroCopy}>
        <h1>Find your next<br />answer.</h1>
        <p className={styles.lede}>Guides for resumes, AI writing, exports and your account.</p>
        <form className={styles.helpSearch} role="search" onSubmit={event => {
          event.preventDefault();
          if (query.trim()) track({ name: "help_search", properties: { q: query.trim() } });
          resultsRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        }}>
          <Search size={21} aria-hidden="true" />
          <label htmlFor="help-search" className={styles.srOnly}>Search guides and answers</label>
          <input id="help-search" type="search" placeholder="Search guides and answers" value={query} onChange={event => setQuery(event.target.value)} />
          <button type="submit" className={styles.button}>Search</button>
        </form>
      </div></div>
    </section>
    <div className={`${styles.container} ${styles.quickPaths}`}>
      {paths.filter(path => articles.some(article => article.slug === path.slug)).map(path => <Link key={path.slug} href={`/help/${path.slug}`}>
        <span>{path.title}<ArrowRight size={18} aria-hidden="true" /></span><p>{path.description}</p>
      </Link>)}
    </div>
    <section className={`${styles.container} ${styles.helpLayout}`} ref={resultsRef} aria-labelledby="all-articles-heading">
      <aside className={styles.helpSidebar} aria-label="Help categories">
        <div className={styles.stickySidebar}><h2>Browse topics</h2><nav aria-label="Article topics">{categories.map(item => <button type="button" key={item.id} onClick={() => chooseCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>)}</nav></div>
      </aside>
      <div className={styles.helpResults}>
        <div className={styles.listHeading}><h2 id="all-articles-heading">{query.trim() ? "Search results" : category === "all" ? "Popular guides" : activeCategory?.label}</h2><p aria-live="polite">{filtered.length} {filtered.length === 1 ? "guide" : "guides"}</p></div>
        <div className={styles.mobileTopics}><label htmlFor="help-topic">Browse topics</label><select id="help-topic" value={category} onChange={event => chooseCategory(event.target.value as HelpCategory | "all")}>{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        {filtered.length ? <ul className={styles.articleList}>{filtered.map(article => <li key={article.slug} data-public-reveal><Link href={`/help/${article.slug}`}>
          <div><h3>{article.title}</h3><p>{article.excerpt}</p></div><span className={styles.readTime}>{article.readTime} min read<span aria-hidden="true">›</span></span>
        </Link></li>)}</ul> : <div className={styles.empty}>
          <h3>No matching guides</h3><p>Try a broader phrase or reset the filters.</p><button type="button" className={styles.secondaryButton} onClick={() => { setQuery(""); setCategory("all"); }}>Reset search</button>
        </div>}
        <div className={styles.supportCta} data-public-reveal>
          <PublicEnvironment kind="help" />
          <div><h2>Still need a hand?</h2><p>Tell us the feature and what you expected. Keep passwords and one-time codes private.</p><div className={styles.heroActions}><a className={styles.button} href="mailto:support@profileai.app">Contact support<ArrowRight size={17} aria-hidden="true" /></a><Link href="/contact" className={styles.textLink}>Open a ticket</Link></div></div>
        </div>
      </div>
    </section>
  </>;
}
