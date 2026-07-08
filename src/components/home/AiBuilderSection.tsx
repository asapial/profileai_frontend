import { Wand2, CheckCircle2, RefreshCw, FileText } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";

export function AiBuilderSection() {
  return (
    <section id="ai-builder" className="py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <SectionHeader
            align="left"
            eyebrow="AI builder"
            title={<>Write a resume that fits the job — not just any job</>}
            description="ProFile AI reads the job description, your experience, and the role's hidden requirements, then drafts a focused, quantified resume that speaks directly to the hiring manager."
          />

          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              "Rewrites bullet points to lead with measurable impact",
              "Surfaces missing keywords the ATS is scanning for",
              "Adapts tone for technical, creative, or executive roles",
              "Generates a tailored summary in 3 different lengths",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <CtaButton
              href="/register"
              label="Try the AI builder free"
              eventName="ai_builder_cta"
            />
          </div>
        </div>

        <AiBuilderMockup />
      </div>
    </section>
  );
}

function AiBuilderMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-sky-500/10 blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5 text-violet-600" />
          <span className="font-medium text-foreground">
            AI generating tailored content…
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {[
            "Analyzing the job description…",
            "Mapping your experience to the role…",
            "Writing impact-driven bullet points…",
            "Optimizing for ATS keywords…",
          ].map((line, i) => (
            <div
              key={line}
              className="flex items-center gap-2 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span
                className={
                  i === 3
                    ? "font-medium text-foreground"
                    : "text-muted-foreground line-through decoration-muted-foreground/40"
                }
              >
                {line}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Bullet · Senior Engineer</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Regenerate
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Led migration of monolith to event-driven services, reducing p99
            API latency by <span className="font-semibold">42%</span> and
            cutting infrastructure costs by <span className="font-semibold">$180k/yr</span>.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Resume_v3.pdf
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            ATS 92
          </span>
        </div>
      </div>
    </div>
  );
}
