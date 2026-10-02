import { Mail, ArrowRight, Sparkles } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";
import type { ManagedHomepageSection } from "@/lib/homepage";

export function CoverLetterSection({ content }: { content?: ManagedHomepageSection }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-5 lg:items-center lg:px-8">
        <div className="lg:col-span-2">
          <SectionHeader
            align="left"
            eyebrow={content?.eyebrow || "Cover letters"}
            title={<>{content?.title || "A cover letter that matches your resume—automatically"}</>}
            description={content?.description || "Generate a tailored cover letter in your voice for every role."}
          />
          <div className="mt-8">
            <CtaButton
              href={content?.primaryCta?.href ?? "/register"}
              label={content?.primaryCta?.label ?? "Generate my first letter"}
              eventName="cover_letter_cta"
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="h-4 w-4 text-violet-600" />
                Cover letter — Senior Engineer
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Dear Hiring Team,</p>
              <p>
                I&apos;m excited to apply for the Senior Engineer role at
                Acme. With 6+ years building scalable web platforms, I&apos;d
                love to bring my experience shipping event-driven systems to
                your team.
              </p>
              <p>
                In my current role, I led a migration that cut p99 API latency
                by 42% and saved $180k/year in infrastructure — exactly the
                kind of measurable impact your team is looking for.
              </p>
              <p className="inline-flex items-center gap-1 font-medium text-foreground">
                Read more in my resume <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
