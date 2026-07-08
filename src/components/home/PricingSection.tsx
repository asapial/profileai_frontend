import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Try ProFile AI and build your first resume — no card needed.",
    features: [
      "1 resume",
      "3 AI generations / month",
      "Basic ATS score",
      "PDF export",
    ],
    cta: { label: "Get started", href: "/register" },
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    description: "For active job seekers who want maximum callbacks.",
    features: [
      "Unlimited resumes",
      "Unlimited AI generations",
      "Full ATS scoring & suggestions",
      "Cover letter generator",
      "Application tracker",
      "PDF + DOCX export",
    ],
    cta: { label: "Start Pro free trial", href: "/register?plan=pro" },
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Business",
    price: "$29",
    cadence: "per month",
    description: "For teams, career coaches, and recruiting agencies.",
    features: [
      "Everything in Pro",
      "Team workspace (5 seats)",
      "Bulk resume tailoring",
      "Custom branding",
      "Priority support",
    ],
    cta: { label: "Contact sales", href: "/contact" },
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Pricing"
          title={<>Simple plans, no surprises</>}
          description="Start free. Upgrade only when you need more AI, more resumes, and more interviews."
        />

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition",
                plan.highlighted
                  ? "border-violet-500 shadow-xl shadow-violet-500/10"
                  : "border-border",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </span>
              )}

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {plan.cadence}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        plan.highlighted ? "text-violet-600" : "text-emerald-600",
                      )}
                    />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <CtaButton
                  href={plan.cta.href}
                  label={plan.cta.label}
                  variant={plan.highlighted ? "primary" : "secondary"}
                  eventName={`pricing_cta_${plan.name.toLowerCase()}`}
                  className="w-full"
                  trailingArrow={false}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
