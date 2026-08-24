import { UserPlus, Wand2, Sliders, Download } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import type { ManagedHomepageSection } from "@/lib/homepage";

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

const STEP_ICONS = [UserPlus, Wand2, Sliders, Download];

export function WorkflowSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const steps = content?.items?.map((item, index) => ({
    n: String(item.label ?? String(index + 1).padStart(2, "0")),
    icon: STEP_ICONS[index % STEP_ICONS.length]!,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
  })) ?? STEPS;
  return (
    <section id="workflow" className="premium-section bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={content?.eyebrow || "How it works"}
          title={<>{content?.title || "From blank page to interview-ready in 4 steps"}</>}
          description={content?.description || "A guided workflow designed to remove the friction between you and your next job."}
        />

        <ol className="relative mt-14 grid gap-6 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="glass-panel relative rounded-3xl p-6 transition duration-300 hover:-translate-y-1"
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
                {i < steps.length - 1 && (
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
