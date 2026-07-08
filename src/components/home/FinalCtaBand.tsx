import { Sparkles } from "lucide-react";
import { CtaButton } from "./CtaButton";

export function FinalCtaBand() {
  return (
    <section className="border-t border-border bg-background py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Free forever — upgrade any time
        </span>
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Your next interview starts with a better resume.
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Join thousands of job seekers using ProFile AI to create tailored
          resumes, beat ATS filters, and land more interviews.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CtaButton
            href="/register"
            label="Get Started Free"
            eventName="footer_cta_get_started"
          />
          <CtaButton
            href="/pricing"
            label="See Pricing"
            variant="secondary"
            eventName="footer_cta_see_pricing"
          />
        </div>
      </div>
    </section>
  );
}
