import Link from "next/link";
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
  },
  cyan: {
    glow: "bg-cyan-400/25",
    soft: "from-cyan-500/14 via-sky-500/7 to-transparent",
    icon: "from-cyan-600 to-sky-500 shadow-cyan-500/25",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  emerald: {
    glow: "bg-emerald-400/25",
    soft: "from-emerald-500/14 via-teal-500/7 to-transparent",
    icon: "from-emerald-600 to-teal-500 shadow-emerald-500/25",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  amber: {
    glow: "bg-amber-400/25",
    soft: "from-amber-500/14 via-orange-500/7 to-transparent",
    icon: "from-amber-600 to-orange-500 shadow-amber-500/25",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  rose: {
    glow: "bg-rose-400/25",
    soft: "from-rose-500/14 via-fuchsia-500/7 to-transparent",
    icon: "from-rose-600 to-fuchsia-500 shadow-rose-500/25",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
} as const;

export function PublicInfoPage({ page, definition }: Props) {
  const accent = ACCENTS[definition.accent];
  const updatedAt = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(page.updatedAt));

  return (
    <>
      <Navbar1 />
      <main id="main" className="relative isolate overflow-hidden pb-20 sm:pb-28">
        <div
          className="premium-grid-mask pointer-events-none absolute inset-x-0 top-0 -z-20 h-[46rem] opacity-70"
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute -left-32 top-28 -z-10 h-80 w-80 rounded-full blur-3xl motion-safe:animate-pulse",
            accent.glow,
          )}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-72 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl motion-safe:animate-pulse"
          aria-hidden="true"
        />

        <section className="premium-section px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
          <div className="glass-panel premium-ring relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:p-12">
            <div className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br", accent.soft)} aria-hidden="true" />
            <div className="grid items-center gap-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
              <div>
                <span className="premium-kicker">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {definition.eyebrow}
                </span>
                <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                  {page.title}
                </h1>
                {page.description && (
                  <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
                    {page.description}
                  </p>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={definition.primaryCta.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    {definition.primaryCta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href={definition.secondaryCta.href} className="glass-subtle inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    {definition.secondaryCta.label}
                  </Link>
                </div>
              </div>

              <div className="glass-subtle relative overflow-hidden rounded-[1.75rem] p-6 sm:p-7">
                <div className={cn("pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl", accent.glow)} aria-hidden="true" />
                <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", accent.text)}>{definition.heroLabel}</p>
                <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{definition.heroTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{definition.heroDescription}</p>
                <ul className="mt-6 space-y-3">
                  {definition.heroPoints.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-foreground/85">
                      <span className={cn("mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-md", accent.icon)}>
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-3 border-t border-border/60 pt-7 lg:grid-cols-4">
              {definition.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`} className="glass-subtle rounded-2xl p-4">
                  <dt className="text-xs leading-5 text-muted-foreground">{metric.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
          <aside aria-label="On this page" className="lg:sticky lg:top-24 lg:h-fit">
            <div className="glass-subtle rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
              <nav className="mt-4" aria-label={`${page.title} sections`}>
                <ul className="space-y-1">
                  <li><SectionLink href="#overview" label="Overview" dotClass={accent.dot} /></li>
                  {definition.sections.map((section) => (
                    <li key={section.id}><SectionLink href={`#${section.id}`} label={section.title} dotClass={accent.dot} /></li>
                  ))}
                </ul>
              </nav>
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last updated</p>
                <p className="mt-1 text-sm font-medium text-foreground">{updatedAt}</p>
              </div>
            </div>
          </aside>

          <article className="min-w-0 space-y-6">
            <section id="overview" className="glass-panel scroll-mt-24 rounded-[1.75rem] p-6 sm:p-8 lg:p-10">
              <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>Backend-managed overview</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">The short version</h2>
              <div className="mt-5 max-w-3xl space-y-4 text-[0.98rem] leading-8 text-foreground/80">
                {page.body.split(/\n{2,}/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>

            {definition.sections.map((section, sectionIndex) => (
              <section id={section.id} key={section.id} className="glass-panel scroll-mt-24 overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-lg", accent.icon)}>
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>{section.eyebrow}</p>
                </div>
                <h2 className="mt-5 max-w-3xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
                {section.description && <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{section.description}</p>}
                {section.paragraphs && (
                  <div className="mt-5 max-w-3xl space-y-4 text-[0.98rem] leading-8 text-foreground/80">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                )}
                {section.cards && (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    {section.cards.map((card) => <InfoCard key={card.title} card={card} accent={accent} />)}
                  </div>
                )}
                {section.bullets && (
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="glass-subtle flex gap-3 rounded-xl p-4 text-sm leading-6 text-foreground/85">
                        <Check className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {section.note && (
                  <div className={cn("mt-7 rounded-2xl border border-border/60 bg-gradient-to-r p-5", accent.soft)}>
                    <p className="flex gap-3 text-sm leading-6 text-foreground/85">
                      <Sparkles className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
                      {section.note}
                    </p>
                  </div>
                )}
              </section>
            ))}

            <section className="glass-panel premium-ring relative overflow-hidden rounded-[1.75rem] p-7 sm:p-9">
              <div className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br", accent.soft)} aria-hidden="true" />
              <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", accent.text)}>{definition.closing.eyebrow}</p>
              <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{definition.closing.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{definition.closing.description}</p>
                </div>
                <Link href={definition.closing.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  {definition.closing.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
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

function SectionLink({ href, label, dotClass }: { href: string; label: string; dotClass: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full opacity-60 transition group-hover:opacity-100", dotClass)} />
      <span className="line-clamp-2">{label}</span>
    </Link>
  );
}

function InfoCard({ card, accent }: { card: PublicPageCard; accent: (typeof ACCENTS)[keyof typeof ACCENTS] }) {
  const Icon = ICONS[card.icon];
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", accent.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {card.meta && <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.meta}</span>}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
      {card.linkLabel && (
        <span className={cn("mt-5 inline-flex items-center gap-1.5 text-sm font-semibold", accent.text)}>
          {card.linkLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </>
  );

  return card.href ? (
    <Link href={card.href} className="glass-subtle group rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{content}</Link>
  ) : (
    <div className="glass-subtle rounded-2xl p-5">{content}</div>
  );
}
