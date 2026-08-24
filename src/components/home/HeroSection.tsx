import { BadgeCheck, Sparkles, Star, FileText, Briefcase } from "lucide-react";
import { CtaButton } from "./CtaButton";
import { cn } from "@/lib/utils";
import type { ManagedHomepageSection } from "@/lib/homepage";

export function HeroSection({ content }: { content?: ManagedHomepageSection }) {
  const assurances = content?.items ?? [
    { title: "No credit card required", description: "" },
    { title: "4.8 average user rating", description: "" },
  ];
  return (
    <section className="premium-section relative isolate overflow-hidden pt-24 sm:pt-28 lg:pt-32">
      <div aria-hidden className="premium-grid-mask pointer-events-none absolute inset-0 -z-10 opacity-80" />
      {/* Floating blurred orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl animate-float-slower"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl animate-float-slow"
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:pb-28">
        {/* Left — copy + CTAs */}
        <div className="flex flex-col items-start text-left">
          <span className="premium-kicker normal-case tracking-normal text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            {content?.eyebrow || "AI-powered resume builder"}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.03] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl">
            {content?.title || "Build a job-winning resume with AI."}
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {content?.description ||
              "Create, tailor, score, and export a professional resume in minutes. ProFile AI helps you beat applicant tracking systems and land more interviews."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton
              href={content?.primaryCta?.href ?? "/register"}
              label={content?.primaryCta?.label ?? "Get Started Free"}
              eventName="hero_cta_get_started"
              className="px-6 py-3.5 text-base"
            />
            <CtaButton
              href={content?.secondaryCta?.href ?? "/templates"}
              label={content?.secondaryCta?.label ?? "View Templates"}
              variant="secondary"
              eventName="hero_cta_view_templates"
              className="px-6 py-3.5 text-base"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              {String(assurances[0]?.title ?? "No credit card required")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {String(assurances[1]?.title ?? "4.8 average user rating")}
            </span>
          </div>
        </div>

        {/* Right — resume preview mockup with floating AI score */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <ResumeMockup />
          <AiScoreBadge />
          <KeywordBadge />
        </div>
      </div>
    </section>
  );
}

function ResumeMockup() {
  return (
    <div
      className={cn(
        "glass-panel premium-ring relative rounded-[1.75rem] p-6 shadow-2xl shadow-violet-500/10",
      )}
    >
      {/* Window dots */}
      <div className="mb-5 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="h-3 w-40 rounded bg-foreground/80" />
            <div className="mt-2 h-2.5 w-56 rounded bg-muted" />
          </div>
          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
        </div>

        {/* Section */}
        <div className="space-y-2 pt-2">
          <div className="h-2.5 w-24 rounded bg-primary/80" />
          <div className="h-2 w-full rounded bg-muted" />
          <div className="h-2 w-11/12 rounded bg-muted" />
          <div className="h-2 w-10/12 rounded bg-muted" />
        </div>

        {/* Experience rows */}
        <div className="space-y-3 pt-2">
          <div className="h-2.5 w-28 rounded bg-primary/80" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-2 w-1/2 rounded bg-foreground/70" />
                <div className="h-1.5 w-full rounded bg-muted" />
                <div className="h-1.5 w-5/6 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Skills chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"].map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiScoreBadge() {
  return (
    <div
      className={cn(
        "absolute -right-3 -top-5 sm:-right-6 sm:-top-6",
        "glass-panel flex items-center gap-3 rounded-2xl p-3 pr-4 shadow-xl",
        "animate-float-slow",
      )}
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          AI Score
        </p>
        <p className="text-xl font-bold text-foreground">
          92<span className="text-muted-foreground">/100</span>
        </p>
      </div>
    </div>
  );
}

function KeywordBadge() {
  return (
    <div
      className={cn(
        "absolute -bottom-5 -left-3 sm:-bottom-6 sm:-left-6",
        "glass-panel flex items-center gap-2.5 rounded-xl px-3 py-2 shadow-xl",
        "animate-float-slower",
      )}
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-50 text-emerald-600">
        <FileText className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          ATS Ready
        </p>
        <p className="text-sm font-semibold text-foreground">PDF Export</p>
      </div>
    </div>
  );
}
