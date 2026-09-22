"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  Clock3,
  Cookie,
  Database,
  Eye,
  FileCheck2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  LifeBuoy,
  LockKeyhole,
  Mail,
  Milestone,
  PenLine,
  Scale,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
import type {
  PublicPageCard,
  PublicPageDefinition,
  PublicPageIcon,
} from "@/lib/public-page-content";
import { cn } from "@/lib/utils";

type ContentPage = {
  slug: string;
  title: string;
  description: string | null;
  body: string;
  updatedAt: string;
};

type Props = {
  page: ContentPage;
  definition: PublicPageDefinition;
};

const ICONS: Record<PublicPageIcon, LucideIcon> = {
  sparkles: Sparkles,
  target: Target,
  users: UsersRound,
  shield: ShieldCheck,
  briefcase: BriefcaseBusiness,
  heart: HeartHandshake,
  timeline: Milestone,
  mail: Mail,
  "life-buoy": LifeBuoy,
  handshake: Handshake,
  building: Building2,
  graduation: GraduationCap,
  book: BookOpen,
  pen: PenLine,
  chart: BarChart3,
  search: Search,
  scale: Scale,
  "file-check": FileCheck2,
  accessibility: Accessibility,
  lock: LockKeyhole,
  database: Database,
  eye: Eye,
  cookie: Cookie,
  settings: Settings2,
  clock: Clock3,
};

const ACCENTS = {
  violet: {
    glow: "bg-violet-500/25",
    soft: "from-violet-500/14 via-fuchsia-500/7 to-transparent",
    icon: "from-violet-600 to-fuchsia-500 shadow-violet-500/25",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    activeDot: "bg-violet-600 dark:bg-violet-400",
    activeBorder: "border-violet-500/40",
  },
  cyan: {
    glow: "bg-cyan-400/25",
    soft: "from-cyan-500/14 via-sky-500/7 to-transparent",
    icon: "from-cyan-600 to-sky-500 shadow-cyan-500/25",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
    ring: "ring-cyan-500/30",
    activeDot: "bg-cyan-600 dark:bg-cyan-400",
    activeBorder: "border-cyan-500/40",
  },
  emerald: {
    glow: "bg-emerald-400/25",
    soft: "from-emerald-500/14 via-teal-500/7 to-transparent",
    icon: "from-emerald-600 to-teal-500 shadow-emerald-500/25",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    activeDot: "bg-emerald-600 dark:bg-emerald-400",
    activeBorder: "border-emerald-500/40",
  },
  amber: {
    glow: "bg-amber-400/25",
    soft: "from-amber-500/14 via-orange-500/7 to-transparent",
    icon: "from-amber-600 to-orange-500 shadow-amber-500/25",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    activeDot: "bg-amber-600 dark:bg-amber-400",
    activeBorder: "border-amber-500/40",
  },
  rose: {
    glow: "bg-rose-400/25",
    soft: "from-rose-500/14 via-fuchsia-500/7 to-transparent",
    icon: "from-rose-600 to-fuchsia-500 shadow-rose-500/25",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    activeDot: "bg-rose-600 dark:bg-rose-400",
    activeBorder: "border-rose-500/40",
  },
} as const;

/* ─── AOS (Animate On Scroll) Hook ───────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-aos]");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.aosDelay ?? "0";
            setTimeout(() => {
              el.classList.add("aos-visible");
            }, Number(delay));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Active Section Hook ─────────────────────────────────────────── */
function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!ids.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/* ─── 3D Tilt Card Hook ───────────────────────────────────────────── */
function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      el.style.transform = `perspective(900px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) scale3d(1.02,1.02,1.02)`;
      el.style.transition = "transform 0.12s ease-out";
    };

    const handleMouseLeave = () => {
      el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
      el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref]);
}

/* ─── Main Component ─────────────────────────────────────────────── */
export function PublicInfoPage({ page, definition }: Props) {
  useScrollReveal();

  const accent = ACCENTS[definition.accent];
  const updatedAt = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(page.updatedAt));

  const sectionIds = ["overview", ...definition.sections.map((s) => s.id)];
  const activeSection = useActiveSection(sectionIds);

  const heroRef = useRef<HTMLDivElement>(null);
  useTilt(heroRef);

  return (
    <>
      <Navbar1 />
      <main id="main" className="studio-public-page relative isolate overflow-clip pb-24 sm:pb-32">
        {/* Ambient background glows */}
        <div
          className={cn(
            "pointer-events-none absolute -left-32 top-28 -z-10 h-96 w-96 rounded-full blur-[120px] opacity-60 motion-safe:animate-pulse",
            accent.glow,
          )}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-72 -z-10 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-[100px] opacity-50 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        {/* Hero section */}
        <section className="px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div
            data-aos="fade-up"
            className="glass-panel premium-ring relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14"
          >
            <div className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br", accent.soft)} aria-hidden="true" />
            {/* Floating 3D depth orb inside hero */}
            <div
              className={cn("pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-[90px] opacity-40", accent.glow)}
              aria-hidden="true"
            />

            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
              <div>
                <span className="premium-kicker">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {definition.eyebrow}
                </span>
                <h1 className="mt-7 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                  {page.title}
                </h1>
                {page.description && (
                  <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
                    {page.description}
                  </p>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={definition.primaryCta.href}
                    className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {definition.primaryCta.label}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                  <Link
                    href={definition.secondaryCta.href}
                    className="glass-subtle inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {definition.secondaryCta.label}
                  </Link>
                </div>
              </div>

              {/* Tiltable hero card */}
              <div
                ref={heroRef}
                className="glass-subtle relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8 will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className={cn("pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-50", accent.glow)} aria-hidden="true" />
                <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", accent.text)}>{definition.heroLabel}</p>
                <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{definition.heroTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{definition.heroDescription}</p>
                <ul className="mt-6 space-y-3">
                  {definition.heroPoints.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-foreground/85">
                      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-md", accent.icon)}>
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Metrics row */}
            <dl
              data-aos="fade-up"
              data-aos-delay="150"
              className="mt-10 grid grid-cols-2 gap-3 border-t border-border/60 pt-7 lg:grid-cols-4"
            >
              {definition.metrics.map((metric) => (
                <div
                  key={`${metric.value}-${metric.label}`}
                  className="group glass-subtle rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <dt className="text-xs leading-5 text-muted-foreground">{metric.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Body grid: sticky sidebar + content */}
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
          {/* Sticky sidebar */}
          <aside aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <div className="glass-subtle rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  On this page
                </p>
                <nav className="mt-4" aria-label={`${page.title} sections`}>
                  <ul className="space-y-0.5">
                    <li>
                      <SectionLink
                        href="#overview"
                        label="Overview"
                        dotClass={accent.activeDot}
                        active={activeSection === "overview"}
                        accentBorder={accent.activeBorder}
                      />
                    </li>
                    {definition.sections.map((section) => (
                      <li key={section.id}>
                        <SectionLink
                          href={`#${section.id}`}
                          label={section.title}
                          dotClass={accent.activeDot}
                          active={activeSection === section.id}
                          accentBorder={accent.activeBorder}
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last updated</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{updatedAt}</p>
                </div>
              </div>

              {/* Back to top */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                ↑ Back to top
              </button>
            </div>
          </aside>

          {/* Article content */}
          <article className="min-w-0 space-y-6">
            {/* Overview */}
            <section
              id="overview"
              data-aos="fade-up"
              className="glass-panel scroll-mt-28 rounded-[1.75rem] p-6 sm:p-8 lg:p-10"
            >
              <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>Overview</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">The short version</h2>
              <div className="mt-5 max-w-3xl space-y-4 text-[0.98rem] leading-8 text-foreground/80">
                {page.body.split(/\n{2,}/).filter(Boolean).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Dynamic sections */}
            {definition.sections.map((section, sectionIndex) => (
              <section
                id={section.id}
                key={section.id}
                data-aos="fade-up"
                data-aos-delay={String(sectionIndex * 60)}
                className="glass-panel scroll-mt-28 overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:p-10"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-lg", accent.icon)}>
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>{section.eyebrow}</p>
                </div>
                <h2 className="mt-5 max-w-3xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
                {section.description && (
                  <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{section.description}</p>
                )}
                {section.paragraphs && (
                  <div className="mt-5 max-w-3xl space-y-4 text-[0.98rem] leading-8 text-foreground/80">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                )}
                {section.cards && (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    {section.cards.map((card, cardIdx) => (
                      <div
                        key={card.title}
                        data-aos="fade-up"
                        data-aos-delay={String(cardIdx * 80)}
                      >
                        <InfoCard card={card} accent={accent} />
                      </div>
                    ))}
                  </div>
                )}
                {section.bullets && (
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet, i) => (
                      <li
                        key={bullet}
                        data-aos="fade-up"
                        data-aos-delay={String(i * 60)}
                        className="glass-subtle flex gap-3 rounded-xl p-4 text-sm leading-6 text-foreground/85"
                      >
                        <Check className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {section.note && (
                  <div
                    data-aos="fade-up"
                    className={cn("mt-7 rounded-2xl border border-border/60 bg-gradient-to-r p-5", accent.soft)}
                  >
                    <p className="flex gap-3 text-sm leading-6 text-foreground/85">
                      <Sparkles className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
                      {section.note}
                    </p>
                  </div>
                )}
              </section>
            ))}

            {/* Closing CTA */}
            <section
              data-aos="fade-up"
              className="glass-panel premium-ring relative overflow-hidden rounded-[1.75rem] p-7 sm:p-9"
            >
              <div className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br", accent.soft)} aria-hidden="true" />
              <div className={cn("pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full blur-[80px] opacity-40", accent.glow)} aria-hidden="true" />
              <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>{definition.closing.eyebrow}</p>
              <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{definition.closing.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{definition.closing.description}</p>
                </div>
                <Link
                  href={definition.closing.href}
                  className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {definition.closing.label}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ─── Sidebar section link ───────────────────────────────────────── */
function SectionLink({
  href,
  label,
  dotClass,
  active,
  accentBorder,
}: {
  href: string;
  label: string;
  dotClass: string;
  active: boolean;
  accentBorder: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? cn("border bg-background/80 font-semibold text-foreground shadow-sm", accentBorder)
          : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full transition-all duration-200",
          active ? cn("scale-125", dotClass) : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60",
        )}
      />
      <span className="line-clamp-2 leading-snug">{label}</span>
    </Link>
  );
}

/* ─── Info card with 3D tilt ─────────────────────────────────────── */
function InfoCard({ card, accent }: { card: PublicPageCard; accent: (typeof ACCENTS)[keyof typeof ACCENTS] }) {
  const Icon = ICONS[card.icon];
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", accent.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {card.meta && (
          <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {card.meta}
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
      {card.linkLabel && (
        <span className={cn("mt-5 inline-flex items-center gap-1.5 text-sm font-semibold", accent.text)}>
          {card.linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        className="group glass-subtle block rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </Link>
    );
  }

  return (
    <div ref={ref} className="glass-subtle rounded-2xl p-5 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
      {content}
    </div>
  );
}
