"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PublicPageDefinition } from "@/lib/public-page-content";
import { PublicEnvironment, PublicPageShell } from "./PublicPageShell";
import styles from "./PublicPages.module.css";

const sectionNames: Record<string, string> = {
  information: "What we process", uses: "Why information is used", "ai-processing": "AI-assisted processing",
  sharing: "Information sharing", retention: "Data retention", choices: "Your choices", security: "Security",
  acceptance: "Acceptance and eligibility", accounts: "Account security", "ai-content": "Your AI-assisted content",
  subscriptions: "Plans and billing", "acceptable-use": "Acceptable use", ownership: "Content ownership",
  termination: "Service access", accessibility: "Accessibility",
};

type PolicyContent = { title: string; body: string; description: string | null; updatedAt: string };

export function LegalPage({ page, definition }: { page: PolicyContent; definition: PublicPageDefinition }) {
  const kind = definition.slug === "privacy" ? "privacy" : "terms";
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-100px 0px -60% 0px" });
    document.querySelectorAll("[data-policy-section]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  const date = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(page.updatedAt));
  const links = [{ id: "overview", title: "Overview" }, ...definition.sections.map(section => ({ id: section.id, title: sectionNames[section.id] ?? section.title }))];
  const principles = kind === "privacy"
    ? ["Private unless you share", "Your data choices", "AI output stays a draft"]
    : ["Review AI drafts", "Keep your account secure", "Use the service responsibly"];

  return <PublicPageShell page={kind}>
    <section className={`${styles.hero} ${styles.policyHero}`}>
      <PublicEnvironment kind={kind} />
      <div className={styles.container}>
        <div className={styles.heroCopy}>
          <h1>{page.title}</h1>
          <p className={styles.lede}>{kind === "privacy" ? "Your career story stays yours." : "Clear responsibilities. Confident next steps."}</p>
          <p className={styles.updated}>Last updated <time dateTime={page.updatedAt}>{date}</time></p>
          <div className={styles.heroActions}>
            <Link className={styles.button} href={definition.primaryCta.href}>{definition.primaryCta.label}<ArrowUpRight size={17} aria-hidden="true" /></Link>
            <Link className={styles.textLink} href={kind === "privacy" ? definition.closing.href : definition.secondaryCta.href}>{kind === "privacy" ? "Contact privacy support" : definition.secondaryCta.label}</Link>
          </div>
        </div>
      </div>
    </section>
    <div className={styles.principles}><ul className={styles.container}>{principles.map(text => <li key={text}>{text}</li>)}</ul></div>
    <div className={`${styles.container} ${styles.readingLayout}`}>
      <aside className={styles.policySidebar} aria-label="On this page">
        <div className={styles.stickySidebar}>
          <p>On this page</p>
          <nav aria-label={`${page.title} sections`}>
            {links.map(link => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined} onClick={() => setActive(link.id)}>{link.title}</a>)}
          </nav>
        </div>
      </aside>
      <details className={styles.mobileContents}>
        <summary>On this page</summary>
        <nav aria-label="Policy sections on mobile">{links.map(link => <a key={link.id} href={`#${link.id}`} onClick={event => {
          setActive(link.id); event.currentTarget.closest("details")?.removeAttribute("open");
        }}>{link.title}</a>)}</nav>
      </details>
      <article className={styles.policyArticle}>
        <section id="overview" data-policy-section data-public-reveal>
          <h2>The short version</h2>
          {page.description && <p className={styles.policyDescription}>{page.description}</p>}
          {page.body.split(/\n{2,}/).filter(Boolean).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <p>{definition.heroDescription}</p>
          <ul>{definition.heroPoints.map(point => <li key={point}>{point}</li>)}</ul>
          <dl className={styles.policyFacts}>{definition.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
        </section>
        {definition.sections.map(section => <section key={section.id} id={section.id} data-policy-section data-public-reveal>
          <h2>{sectionNames[section.id] ?? section.title}</h2>
          {sectionNames[section.id] && sectionNames[section.id] !== section.title && <p className={styles.sectionStatement}>{section.title}</p>}
          {section.description && <p>{section.description}</p>}
          {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.cards && <dl className={styles.policyDefinitions}>{section.cards.map(card => <div key={card.title}>
            <dt>{card.title}</dt><dd>{card.description}</dd>
            {card.href && <dd><Link href={card.href} className={styles.textLink}>{card.linkLabel ?? card.title}</Link></dd>}
          </div>)}</dl>}
          {section.bullets && <ul>{section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
          {section.note && <p className={styles.policyNote}>{section.note}</p>}
        </section>)}
        <section className={styles.policyClosing}>
          <h2>{kind === "privacy" ? "Privacy question?" : "Questions about these terms?"}</h2>
          <p>{definition.closing.description}</p>
          <Link href={definition.closing.href} className={styles.textLink}>{definition.closing.label}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </section>
      </article>
    </div>
  </PublicPageShell>;
}
