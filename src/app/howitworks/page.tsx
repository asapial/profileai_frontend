import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  FileSearch,
  FileText,
  Layers3,
  MousePointerClick,
  ScanSearch,
  Target,
  WandSparkles,
} from "lucide-react";
import { Navbar1 } from "@/components/navbar1";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "How It Works — ProfileAI",
  description: "See how ProfileAI turns your real experience and a target role into a tailored, review-ready application workflow.",
};

const steps = [
  {
    number: "1",
    icon: FileSearch,
    eyebrow: "Build your source",
    title: "Bring the work you have already done.",
    description: "Start with an existing resume or create a structured profile. Add roles, projects, skills, education, and measurable achievements once—then reuse that verified evidence.",
    details: ["Import or build a base resume", "Keep achievements in one evidence bank", "Edit every detail before it is reused"],
  },
  {
    number: "2",
    icon: ScanSearch,
    eyebrow: "Understand the role",
    title: "Turn a job description into a clear brief.",
    description: "ProfileAI identifies responsibilities, skills, and language in the role, then compares them with your confirmed experience. The result is guidance—not a promise of hiring outcomes.",
    details: ["See important requirements", "Spot evidence gaps", "Prioritize the most relevant experience"],
  },
  {
    number: "3",
    icon: WandSparkles,
    eyebrow: "Tailor with control",
    title: "Create a focused draft without inventing facts.",
    description: "Choose a template and generate targeted suggestions for your resume and cover letter. Your source material stays visible, so every claim can be checked and refined in your voice.",
    details: ["ATS-conscious structure", "Role-specific summaries and bullets", "Human review before anything leaves"],
  },
  {
    number: "4",
    icon: BarChart3,
    eyebrow: "Keep momentum",
    title: "Track the application beyond the document.",
    description: "Save the opportunity, export the final version, and keep status, notes, interviews, and follow-ups connected in one workspace.",
    details: ["Export a clean final document", "Track stages and next actions", "Prepare for interviews from the same context"],
  },
];

const tools = [
  { icon: FileText, title: "Resume workspace", text: "One reliable source for your experience, projects, education, and skills." },
  { icon: Target, title: "Role alignment", text: "A practical comparison between the role and evidence you have actually provided." },
  { icon: Layers3, title: "Templates & versions", text: "Create focused editions while keeping your base information intact." },
  { icon: BriefcaseBusiness, title: "Application tracker", text: "Keep documents, status, notes, and follow-up dates attached to the opportunity." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar1 />
      <main id="main" className="studio-public-page overflow-hidden">
        <section className="relative isolate px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,.13),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(139,92,246,.16),transparent_32%)]" aria-hidden="true" />
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="font-serif text-4xl leading-[1.04] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Build a stronger application.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                ProfileAI helps you organize the truth, understand the role, tailor with intention, and keep the whole job search moving—without handing control to the AI.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="studio-button min-h-12 justify-center rounded-xl px-6">Start your workspace <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/templates" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-card/80 px-6 text-sm font-semibold transition hover:bg-muted">Browse templates <MousePointerClick className="h-4 w-4" /></Link>
              </div>
            </div>

            <div data-ui className="glass-panel premium-ring mx-auto mt-14 max-w-5xl rounded-[2rem] p-4 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-4">
                {["Your evidence", "Role analysis", "Tailored drafts", "Application progress"].map((label) => (
                  <div key={label} className="relative rounded-2xl border bg-card/70 p-4 text-center">
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <h2 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Four steps. One source.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Each stage keeps the original evidence close, so the final application remains specific, defensible, and recognizably yours.</p>
            </div>
            <ol className="mt-12 min-h-[52rem] space-y-5">
              {steps.map((step) => {
                return (
                  <li key={step.number} className="glass-panel grid gap-6 rounded-[1.75rem] p-6 sm:p-8 lg:grid-cols-[110px_minmax(0,1fr)_minmax(260px,.7fr)] lg:items-center lg:gap-10">
                    <div className="flex items-center gap-4 lg:block">
                      <span className="font-serif text-4xl text-primary/60">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{step.title}</h3>
                      <p className="mt-4 leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                    <ul data-ui className="min-h-[12.5rem] space-y-3 rounded-2xl border bg-muted/25 p-5 text-sm">
                      {step.details.map((detail) => <li key={detail} className="list-inside list-disc">{detail}</li>)}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="border-y bg-muted/20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <h2 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Context stays connected.</h2>
                <p className="mt-5 leading-7 text-muted-foreground">The tools share the information you choose to save, so you spend less time copying the same details between disconnected documents.</p>
              </div>
              <div data-ui className="grid min-h-[26rem] gap-4 sm:grid-cols-2">
                {tools.map(({ title, text }) => (
                  <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div data-ui className="mx-auto grid min-h-[24rem] max-w-7xl gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/5 p-7 sm:p-9">
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">Suggestions, never final say.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Review, rewrite, remove, or ignore any suggestion. ProfileAI is designed to support your judgment—not replace it or submit applications without your approval.</p>
            </div>
            <div className="rounded-[1.75rem] border border-violet-500/20 bg-violet-500/5 p-7 sm:p-9">
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">Share on your terms.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Your workspace stays private by default. You choose when to export a document or create a shareable resume link, and you can revoke supported links later.</p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="premium-ring mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-foreground px-6 py-12 text-background sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:py-16 dark:bg-card dark:text-foreground">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Finish the next application.</h2>
              <p className="mt-4 leading-7 opacity-70">Start free, build your source profile, and move through the workflow at your own pace.</p>
            </div>
            <div className="mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-background px-6 text-sm font-semibold text-foreground transition hover:opacity-90 dark:bg-primary dark:text-primary-foreground">Create free account <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-current/20 px-6 text-sm font-semibold transition hover:bg-background/10">Talk to the team</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
