import { LayoutTemplate } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    name: "Modern",
    description: "Clean, two-column, recruiter-friendly.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Classic",
    description: "Traditional, single-column, ATS-perfect.",
    accent: "from-slate-500 to-slate-700",
  },
  {
    name: "Creative",
    description: "Bold headers, made for design roles.",
    accent: "from-amber-500 to-rose-500",
  },
  {
    name: "Minimal",
    description: "Whitespace-first, content-led.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    name: "Executive",
    description: "Refined typography for senior roles.",
    accent: "from-indigo-500 to-blue-600",
  },
  {
    name: "Technical",
    description: "Project-heavy, skills-forward.",
    accent: "from-sky-500 to-cyan-500",
  },
] as const;

export function TemplateGallerySection() {
  return (
    <section id="templates" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Template gallery"
          title={<>A template for every kind of role</>}
          description="From classic single-column to bold creative layouts — all fully ATS-friendly, all instantly customizable."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <li
              key={cat.name}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <TemplateMockup accent={cat.accent} />
              </div>
              <div className="flex flex-col gap-1.5 p-5">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-violet-600" />
                  <h3 className="text-base font-semibold text-foreground">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <CtaButton
            href="/templates"
            label="Browse all templates"
            variant="secondary"
            eventName="gallery_browse_all"
          />
        </div>
      </div>
    </section>
  );
}

function TemplateMockup({ accent }: { accent: string }) {
  return (
    <div className="grid h-full grid-cols-3 gap-3 bg-gradient-to-br from-muted/40 to-muted p-5">
      {/* Left column */}
      <div className="col-span-1 space-y-2">
        <div className={cn("h-3 w-3/4 rounded bg-gradient-to-r", accent)} />
        <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-5/6 rounded bg-muted-foreground/20" />
        <div className="mt-3 h-1.5 w-1/2 rounded bg-muted-foreground/30" />
        <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-4/6 rounded bg-muted-foreground/20" />
      </div>
      {/* Right column */}
      <div className="col-span-2 space-y-2">
        <div className="h-1.5 w-1/3 rounded bg-muted-foreground/30" />
        <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-11/12 rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-10/12 rounded bg-muted-foreground/20" />
        <div className="mt-3 h-1.5 w-1/3 rounded bg-muted-foreground/30" />
        <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
        <div className="h-1.5 w-5/6 rounded bg-muted-foreground/20" />
      </div>
    </div>
  );
}
