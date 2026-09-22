"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  HelpCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/home/SectionHeader";
import { track } from "@/lib/analytics";

type Billing = "monthly" | "yearly";

type PlanFeature = {
  label: string;
  /** If true, feature is shown but disabled (e.g. coming soon). */
  comingSoon?: boolean;
};

type StaticPlan = {
  id: "free" | "pro" | "business";
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number; // USD
  yearlyPrice: number; // USD per month when billed yearly
  features: PlanFeature[];
  cta: { label: string };
  highlighted?: boolean;
  badge?: string;
  /** Self-serve means the user can click "Choose Plan" and check out.
   *  Otherwise show "Contact Sales" instead. */
  selfServe: boolean;
};

const PLANS: StaticPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Forever free",
    description: "Try ProFile AI and build your first resume — no card needed.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { label: "1 resume" },
      { label: "3 AI generations / month" },
      { label: "Basic ATS score" },
      { label: "PDF export" },
      { label: "Access to free templates" },
    ],
    cta: { label: "Get started" },
    selfServe: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For active job seekers",
    description:
      "More room to draft, tailor and prepare for your next application.",
    monthlyPrice: 12,
    yearlyPrice: 9,
    features: [
      { label: "Unlimited resumes" },
      { label: "Unlimited AI generations" },
      { label: "Full ATS scoring & suggestions" },
      { label: "Cover letter generator" },
      { label: "Application tracker" },
      { label: "PDF + DOCX export" },
      { label: "Priority email support" },
    ],
    cta: { label: "Choose Pro" },
    highlighted: true,
    badge: "Most popular",
    selfServe: true,
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams and coaches",
    description:
      "Team workspace, bulk tailoring, and custom branding for agencies.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    features: [
      { label: "Everything in Pro" },
      { label: "Team workspace (5 seats)" },
      { label: "Bulk resume tailoring" },
      { label: "Custom branding" },
      { label: "Priority support with SLA" },
      { label: "API access (coming soon)", comingSoon: true },
    ],
    cta: { label: "Contact sales" },
    selfServe: false,
  },
];

// Reusable comparison rows shown below the cards.
const COMPARISON = [
  { row: "Resumes", free: "1", pro: "Unlimited", business: "Unlimited" },
  { row: "AI generations / month", free: "3", pro: "Unlimited", business: "Unlimited" },
  { row: "ATS scoring", free: "Basic", pro: "Full + suggestions", business: "Full + suggestions" },
  { row: "Cover letter generator", free: false, pro: true, business: true },
  { row: "Application tracker", free: false, pro: true, business: true },
  { row: "Export formats", free: "PDF", pro: "PDF + DOCX", business: "PDF + DOCX" },
  { row: "Team workspace", free: false, pro: false, business: "5 seats" },
  { row: "Custom branding", free: false, pro: false, business: true },
  { row: "API access", free: false, pro: false, business: "Coming soon" },
];

const FAQS = [
  {
    q: "Can I switch plans later?",
    a: "Yes — upgrade, downgrade, or cancel at any time from your billing settings. Pro-rated changes apply immediately.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee on Pro and Business plans. Email support@profileai.app to request a refund.",
  },
  {
    q: "What happens when my AI limit runs out?",
    a: "On the Free plan, AI generation is paused until the next month. You can keep editing existing resumes and exporting PDFs.",
  },
  {
    q: "Is annual billing cheaper?",
    a: "Yes. Pro is $9/mo billed yearly (save 25%) and Business is $23/mo billed yearly.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan works without a card. Add one only when you upgrade.",
  },
];

export function PricingClient() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const onToggle = (next: Billing) => {
    if (next === billing) return;
    setBilling(next);
    track({ name: "pricing_toggle_billing", properties: { billing: next } });
  };

  const cards = useMemo(() => PLANS, []);

  return (
    <>
      {/* Hero / toggle */}
      <section className="relative isolate overflow-hidden px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-violet-500/10 to-transparent" aria-hidden="true" />
        <div data-aos="fade-up" className="glass-panel premium-ring mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <SectionHeader
            headingTag="h1"
            eyebrow="Simple, transparent pricing"
            title={<>Make your next move without hidden costs.</>}
            description="Start free. Upgrade when you need more drafts, deeper feedback, or a shared workspace. No credit card is required to begin."
          />

          {/* Monthly / Yearly toggle */}
          <div className="mt-9 flex justify-center">
            <div
              role="tablist"
              aria-label="Billing interval"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm"
            >
              <ToggleButton
                active={billing === "monthly"}
                onClick={() => onToggle("monthly")}
              >
                Monthly
              </ToggleButton>
              <ToggleButton
                active={billing === "yearly"}
                onClick={() => onToggle("yearly")}
              >
                Yearly
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  −25%
                </span>
              </ToggleButton>
            </div>
          </div>

          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <PricingPromise icon={CreditCard} label="No card to start" />
            <PricingPromise icon={RefreshCcw} label="Change plans anytime" />
            <PricingPromise icon={ShieldCheck} label="14-day money-back promise" />
          </ul>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="grid gap-6 lg:grid-cols-3">
            {cards.map((plan) => (
              <li
                key={plan.id}
                data-aos="fade-up"
                className={cn(
                  "relative flex flex-col rounded-[1.75rem] border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7",
                  plan.highlighted
                    ? "border-violet-500 shadow-xl shadow-violet-500/15"
                    : "border-border hover:border-primary/30",
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                    <Sparkles className="h-3 w-3" />
                    {plan.badge}
                  </span>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {plan.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>

                  <PriceBlock plan={plan} billing={billing} />

                  <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          f.comingSoon
                            ? "text-muted-foreground/50"
                            : plan.highlighted
                              ? "text-violet-600"
                              : "text-emerald-600",
                        )}
                      />
                      <span
                        className={cn(
                          "text-foreground",
                          f.comingSoon && "text-muted-foreground",
                        )}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  <PlanCta plan={plan} billing={billing} />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Prices in USD. Taxes calculated at checkout.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Compare"
            title={<>Every plan, side by side</>}
            description="A quick look at the limits and features included in Free, Pro, and Business."
          />

          <div data-aos="fade-up" className="mt-12 overflow-x-auto rounded-[1.5rem] border border-border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Feature comparison for Free, Pro, and Business plans</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-5 py-4 font-semibold">Feature</th>
                  <th scope="col" className="px-5 py-4 font-semibold">Free</th>
                  <th scope="col" className="px-5 py-4 font-semibold">Pro</th>
                  <th scope="col" className="px-5 py-4 font-semibold">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON.map((row) => (
                  <tr key={row.row}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-foreground">
                      {row.row}
                    </th>
                    <CompareCell value={row.free} />
                    <CompareCell value={row.pro} highlighted />
                    <CompareCell value={row.business} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Pricing FAQ"
            title={<>Questions about plans and billing</>}
          />
          <ul data-aos="fade-up" className="mt-10 divide-y divide-border rounded-[1.5rem] border border-border bg-card shadow-sm">
            {FAQS.map((item) => (
              <li key={item.q} className="px-5 py-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground sm:text-base">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {item.q}
                    </span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-foreground transition group-open:bg-foreground group-open:text-background">
                      <span className="text-lg leading-none group-open:hidden">+</span>
                      <span className="text-lg leading-none hidden group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Need help choosing?{" "}
            <Link
              href="/help"
              className="font-semibold text-primary hover:underline"
            >
              Visit the help center
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:support@profileai.app"
              className="font-semibold text-primary hover:underline"
            >
              support@profileai.app
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-foreground text-background shadow"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PriceBlock({
  plan,
  billing,
}: {
  plan: StaticPlan;
  billing: Billing;
}) {
  const isFree = plan.monthlyPrice === 0;
  const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <div className="mt-4" aria-live="polite">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {isFree ? "$0" : `$${price}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {isFree ? "forever" : "/ month"}
        </span>
      </div>
      {!isFree && billing === "yearly" && (
        <p className="mt-1 text-xs font-medium text-emerald-600">
          ${price * 12} billed once per year
        </p>
      )}
    </div>
  );
}

function PlanCta({ plan, billing }: { plan: StaticPlan; billing: Billing }) {
  // Visitor flow: route to /register?plan=<id>
  const href = plan.selfServe
    ? `/register?plan=${plan.id}&billing=${billing}`
    : "/contact";

  return (
    <Link
      href={href}
      onClick={() =>
        track({
          name: `pricing_cta_${plan.id}`,
          properties: { plan: plan.id, billing, selfServe: plan.selfServe },
        })
      }
      className={cn(
        "group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        plan.highlighted
          ? "bg-foreground text-background shadow-lg shadow-violet-500/20 hover:opacity-90"
          : "border border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {plan.cta.label}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

function PricingPromise({
  icon: Icon,
  label,
}: {
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <li className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <span>{label}</span>
    </li>
  );
}

function CompareCell({
  value,
  highlighted,
}: {
  value: string | boolean;
  highlighted?: boolean;
}) {
  if (typeof value === "boolean") {
    return (
      <td
        className={cn(
          "px-5 py-3",
          highlighted && "bg-violet-50/50 dark:bg-violet-950/10",
        )}
      >
        {value ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    );
  }
  return (
    <td
      className={cn(
        "px-5 py-3 text-foreground",
        highlighted && "bg-violet-50/50 font-medium dark:bg-violet-950/10",
      )}
    >
      {value}
    </td>
  );
}
