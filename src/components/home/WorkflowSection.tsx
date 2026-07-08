import { UserPlus, Wand2, Sliders, Download } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Create your free account",
    description:
      "Sign up in seconds. No credit card. Save unlimited resumes and come back any time.",
  },
  {
    n: "02",
    icon: Wand2,
    title: "Tell us about the role",
    description:
      "Paste the job description and your background. Our AI builds a tailored first draft in under a minute.",
  },
  {
    n: "03",
    icon: Sliders,
    title: "Tailor & score",
    description:
      "Edit, regenerate any section, and watch your ATS score climb with real-time suggestions.",
  },
  {
    n: "04",
    icon: Download,
    title: "Export and apply",
    description:
      "Download a clean PDF or DOCX, log the application in your tracker, and go land that interview.",
  },
] as const;

export function WorkflowSection() {
  return (
    <section id="workflow" className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title={<>From blank page to interview-ready in 4 steps</>}
          description="A guided workflow designed to remove the friction between you and your next job."
        />

        <ol className="relative mt-14 grid gap-6 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-widest text-primary">
                    STEP {step.n}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-[-14px] top-1/2 hidden h-px w-7 bg-border lg:block"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
