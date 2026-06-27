import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { pricingPlans } from "@/constants/homepage";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white px-4 py-14 dark:bg-[--color-bg-surface] lg:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Start free, upgrade when your search gets serious"
          description="Simple plans for individual job seekers and teams supporting multiple candidates."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative overflow-hidden p-6",
                plan.highlighted && "border-[--color-accent] bg-[--color-nav-bg] text-white"
              )}
            >
              {plan.highlighted && <Badge className="mb-4 bg-white/10 text-white">Recommended</Badge>}
              <p className={cn("text-sm", plan.highlighted ? "text-white/50" : "text-[--color-text-muted]")}>{plan.name}</p>
              <p className={cn("mt-2 text-3xl font-medium", plan.highlighted ? "text-[--color-accent]" : "text-[--color-text-primary]")}>
                {plan.price} <span className="text-sm font-normal opacity-50">/mo</span>
              </p>
              <p className={cn("mt-3 text-sm leading-relaxed", plan.highlighted ? "text-white/65" : "text-[--color-text-body]")}>{plan.description}</p>
              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className={cn("flex gap-2 text-sm", plan.highlighted ? "text-white/70" : "text-[--color-text-body]")}>
                    <Check className="mt-0.5 text-[--color-accent]" size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="mt-6 w-full" variant={plan.highlighted ? "primary" : "outline"}>
                  Get Started
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
