"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  { key: "free", name: "Free", price: "$0", suffix: "forever", features: ["15 saved applications", "3 alignment analyses", "2 tailored summaries", "5 application drafts"], cta: "Get started" },
  { key: "pro", name: "Pro", price: "$12", suffix: "per month", badge: "MOST POPULAR", features: ["Unlimited saved applications", "50 alignment analyses", "20 tailored summaries", "50 application drafts", "Resume version history"], cta: "Explore Pro" },
  { key: "plus", name: "Career Plus", price: "$29", suffix: "per month", features: ["Unlimited saved applications", "150 alignment analyses", "60 tailored summaries", "150 application drafts", "Priority studio workflows"], cta: "Explore Career Plus" },
];

export function PricingSection() {
  useEffect(() => () => { delete document.body.dataset.ambient; }, []);
  return (
    <section className="static-section pricing-section" aria-labelledby="pricing-title">
      <p className="static-kicker">PRICING</p>
      <h2 id="pricing-title">Simple plans, <em>no surprises.</em></h2>
      <p className="static-lede">Start free. Upgrade only when you need more AI, more resumes, and more interviews.</p>
      <div className="pricing-grid" onPointerLeave={() => { delete document.body.dataset.ambient; }}>
        {plans.map((plan) => (
          <article key={plan.key} className={`price-card ${plan.key === "pro" ? "price-card--featured" : ""}`} onPointerEnter={() => { document.body.dataset.ambient = plan.key; }}>
            {plan.badge && <span className="price-badge">{plan.badge}</span>}
            <p>{plan.name}</p>
            <div className="price"><strong>{plan.price}</strong><span>/ {plan.suffix}</span></div>
            <ul>{plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul>
            <Link href="/register" className={plan.key === "pro" ? "story-primary" : "price-button"}>{plan.cta} <span>↗</span></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
