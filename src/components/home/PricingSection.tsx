import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import { CtaButton } from "./CtaButton";
import type { ManagedHomepageSection } from "@/lib/homepage";

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
    price: "৳0",
    cadence: "forever",
    description: "Try ProfileAI and build your first resume — no card needed.",
    features: [
      "2 resumes",
      "2 alignment analyses / month",
      "1 tailored resume / month",
      "3 application drafts / month",
    ],
    cta: { label: "Get started", href: "/register" },
  },
  {
    name: "Job Seeker",
    price: "৳299",
    cadence: "per month",
    description: "For active job seekers who want maximum callbacks.",
    features: [
      "10 resume versions",
      "25 alignment analyses / month",
      "15 tailored resumes / month",
      "30 application drafts / month",
      "Unlimited application tracking",
      "Premium templates and clean exports",
    ],
    cta: { label: "Choose Job Seeker", href: "/register?plan=pro&billing=monthly" },
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Career Pro",
    price: "৳599",
    cadence: "per month",
    description: "For serious job seekers making a focused career move.",
    features: [
      "Unlimited resume versions",
      "75 alignment analyses / month",
      "50 tailored resumes / month",
      "100 application drafts / month",
      "Advanced interview preparation",
      "STAR Story Builder and analytics",
    ],
    cta: { label: "Choose Career Pro", href: "/register?plan=business&billing=monthly" },
  },
];

export function PricingSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const plans: Plan[] = content?.items?.map((item) => ({
    name: String(item.title ?? ""),
    price: String(item.label ?? ""),
    cadence: String(item.cadence ?? "per month"),
    description: String(item.description ?? ""),
    features: String(item.features ?? "").split("|").filter(Boolean),
    cta: {
      label: String(item.ctaLabel ?? "Choose plan"),
      href: String(item.ctaHref ?? "/register"),
    },
    highlighted: Boolean(item.highlighted),
    badge: item.badge ? String(item.badge) : undefined,
  })) ?? PLANS;
  const displayPlans = plans.map(plan => {
    const tier = plan.name.toLowerCase();
    if (tier === "free") return { ...plan, price: "৳0", description: "Start building a grounded application.", features: ["2 resumes", "2 alignment analyses / month", "1 tailored resume / month", "3 application drafts / month", "10 saved applications"] };
    if (tier === "pro" || tier === "job seeker") return { ...plan, name: "Job Seeker", price: "৳299", description: "Room for an active job search.", features: ["10 resume versions", "25 alignment analyses / month", "15 tailored resumes / month", "30 application drafts / month", "Unlimited application tracking"], cta: { label: "Choose Job Seeker", href: "/register?plan=pro&billing=monthly" } };
    if (tier === "business" || tier === "career plus" || tier === "career pro") return { ...plan, name: "Career Pro", price: "৳599", description: "Higher allowances for a focused career move.", features: ["Unlimited resume versions", "75 alignment analyses / month", "50 tailored resumes / month", "100 application drafts / month", "Advanced interview preparation"], cta: { label: "Choose Career Pro", href: "/register?plan=business&billing=monthly" } };
    return plan;
  });
  return (
    <section id="pricing" className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={content?.eyebrow || "Pricing"}
          title={<>{content?.title || "Simple plans, no surprises"}</>}
          description={content?.description || "Start free. Upgrade only when you need more AI, more resumes, and more interviews."}
        />

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {displayPlans.map((plan) => (
            <li
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition",
                plan.highlighted
                  ? "-translate-y-2 border-violet-500 shadow-[var(--shadow-3)]"
                  : "border-border",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow">
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
