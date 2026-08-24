import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FileCheck2,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type { ManagedHomepageSection } from "@/lib/homepage";
import { CtaButton } from "./CtaButton";
import { SectionHeader } from "./SectionHeader";

const asText = (value: string | number | boolean | undefined, fallback: string) =>
  value === undefined ? fallback : String(value);

export function CareerWorkspaceSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const items = content?.items ?? [
    {
      title: "One calm workspace",
      description: "Resume, cover letter and application history stay connected.",
      label: "Unified",
    },
    {
      title: "A clear next action",
      description: "Know exactly what to improve, send or follow up on next.",
      label: "Focused",
    },
    {
      title: "Progress you can see",
      description: "Track stronger applications and interview conversion over time.",
      label: "Measurable",
    },
  ];

  return (
    <section id="career-workspace" className="premium-section py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeader
            align="left"
            eyebrow={content?.eyebrow || "Career workspace"}
            title={<>{content?.title || "Your entire job search, moving as one."}</>}
            description={
              content?.description ||
              "ProFile AI connects the work before, during and after every application so nothing falls through the cracks."
            }
          />
          <div className="mt-8 grid gap-3">
            {items.map((item, index) => (
              <div
                key={asText(item.title, String(index))}
                className="glass-subtle group flex items-start gap-4 rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-primary ring-1 ring-primary/15">
                  {index === 0 ? <BriefcaseBusiness className="size-4" /> : null}
                  {index === 1 ? <Target className="size-4" /> : null}
                  {index === 2 ? <TrendingUp className="size-4" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {asText(item.title, "Connected workflow")}
                    </h3>
                    {item.label ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {String(item.label)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {asText(item.description, "Everything stays connected.")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <CtaButton
              href={content?.primaryCta?.href ?? "/register"}
              label={content?.primaryCta?.label ?? "Open my career workspace"}
              eventName="career_workspace_cta"
            />
          </div>
        </div>

        <div className="relative">
          <div className="premium-grid-mask absolute -inset-12 -z-10" aria-hidden />
          <div className="glass-panel premium-ring overflow-hidden rounded-[2rem] p-3 sm:p-5">
            <div className="rounded-[1.45rem] border border-white/40 bg-background/45 p-4 shadow-inner backdrop-blur-xl dark:border-white/8 dark:bg-white/3 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Career command center
                  </p>
                  <p className="mt-1 text-lg font-semibold">Senior Product Designer</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  ["92", "ATS score"],
                  ["12", "Active roles"],
                  ["28%", "Interview rate"],
                ].map(([value, label]) => (
                  <div key={label} className="glass-subtle rounded-xl p-3 sm:p-4">
                    <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/40 bg-background/50 p-4 dark:border-white/8 dark:bg-white/3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Application momentum</p>
                  <BarChart3 className="size-4 text-primary" />
                </div>
                <div className="mt-5 flex h-24 items-end gap-2" aria-label="Application momentum chart">
                  {[38, 54, 46, 68, 60, 82, 74, 94].map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600 to-fuchsia-400 opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/6 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Your next best action</p>
                    <p className="text-xs text-muted-foreground">Follow up with Northwind today</p>
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveIntelligenceSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const items = content?.items ?? [
    {
      title: "Role-fit signal",
      description: "See how strongly your experience maps to the role before applying.",
      label: "94% match",
    },
    {
      title: "Experience gap map",
      description: "Spot missing proof, keywords and outcomes while there is time to fix them.",
      label: "3 actions",
    },
    {
      title: "Application insights",
      description: "Learn which roles, resumes and messages are earning real responses.",
      label: "+28%",
    },
  ];
  const icons = [Target, FileCheck2, TrendingUp];

  return (
    <section id="live-intelligence" className="premium-section py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={content?.eyebrow || "Live intelligence"}
          title={<>{content?.title || "Decisions powered by signal, not guesswork."}</>}
          description={
            content?.description ||
            "Every resume, job description and application becomes useful feedback for the next move."
          }
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index % icons.length]!;
            return (
              <article
                key={asText(item.title, String(index))}
                className="glass-panel group relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 sm:p-7"
              >
                <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/10 blur-2xl transition duration-500 group-hover:scale-125" />
                <div className="relative flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
                    {asText(item.label, "Live")}
                  </span>
                </div>
                <h3 className="relative mt-7 text-xl font-semibold tracking-tight">
                  {asText(item.title, "Career signal")}
                </h3>
                <p className="relative mt-2 text-sm leading-6 text-muted-foreground">
                  {asText(item.description, "Turn your activity into useful guidance.")}
                </p>
                <div className="relative mt-6 flex items-center gap-2 text-xs font-semibold text-primary">
                  Continuously updated <span className="size-1 rounded-full bg-primary" /> Personalized
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PrivacyControlSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const items = content?.items ?? [
    {
      title: "Private by default",
      description: "Your career data is never treated as public content.",
    },
    {
      title: "You stay in control",
      description: "Edit, export or delete your information from one place.",
    },
    {
      title: "Human-approved AI",
      description: "Nothing is submitted until you review and approve it.",
    },
  ];
  const icons = [Lock, Eye, ShieldCheck];

  return (
    <section id="privacy-control" className="premium-section py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel premium-ring relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-12">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-emerald-400/12 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-violet-500/12 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <span className="premium-kicker">
                <ShieldCheck className="size-3.5" />
                {content?.eyebrow || "Privacy and control"}
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                {content?.title || "Your career story belongs to you."}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {content?.description ||
                  "Premium software should feel safe as well as beautiful. ProFile AI keeps you in control of every document, suggestion and shared link."}
              </p>
              <div className="mt-7">
                <CtaButton
                  href={content?.primaryCta?.href ?? "/privacy"}
                  label={content?.primaryCta?.label ?? "Read our privacy approach"}
                  variant="secondary"
                  eventName="privacy_section_cta"
                />
              </div>
            </div>

            <div className="grid gap-3">
              {items.map((item, index) => {
                const Icon = icons[index % icons.length]!;
                return (
                  <div
                    key={asText(item.title, String(index))}
                    className="glass-subtle flex items-center gap-4 rounded-2xl p-4 sm:p-5"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-300">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{asText(item.title, "Protected")}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {asText(item.description, "Your information stays under your control.")}
                      </p>
                    </div>
                    <CheckCircle2 className="ml-auto hidden size-5 shrink-0 text-emerald-500 sm:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
