"use client";

import Link from "next/link";
import styles from "./ReadingSections.module.css";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

const plans = [
  { key: "free", name: "Free", price: "$0", suffix: "forever", features: ["15 saved applications", "3 alignment analyses", "2 tailored summaries", "5 application drafts"], cta: "Get started" },
  { key: "pro", name: "Pro", price: "$12", suffix: "per month", features: ["Unlimited saved applications", "50 alignment analyses", "20 tailored summaries", "50 application drafts", "Resume version history"], cta: "Explore Pro" },
  { key: "plus", name: "Career Plus", price: "$29", suffix: "per month", features: ["Unlimited saved applications", "150 alignment analyses", "60 tailored summaries", "150 application drafts", "Priority studio workflows"], cta: "Explore Career Plus" },
];

export function PricingSection() {
  return (
    <section className={`${styles.section} ${sectionEnvironmentClass} static-section pricing-section`} aria-labelledby="pricing-title" data-reading-section="pricing">
      <SectionEnvironment kind="pricing"/>
      <div className={styles.sectionHeading}><h2 id="pricing-title" className={styles.heading}>Plans for your<br/>next move.</h2><p className={styles.lede}>Start free. Upgrade only when you need more AI, more resumes, and more interviews.</p></div>
      <div className={`${styles.pricingGrid} pricing-grid`}>
        {plans.map((plan) => (
          <article key={plan.key} className={`${styles.priceCard} price-card ${plan.key === "pro" ? `${styles.featured} price-card--featured` : ""}`}>
            <h3>{plan.name}</h3>
            <div className={`${styles.price} price`}><strong>{plan.price}</strong><span>/ {plan.suffix}</span></div>
            <p className={styles.planDescription}>{plan.key === "free" ? "A place to start with your real experience." : plan.key === "pro" ? "More room for an active job search." : "Space for your next career chapter."}</p>
            <ul className={styles.featureList}>{plan.features.map((feature) => <li key={feature}><span className={styles.featureCheck} aria-hidden/><span>{feature}</span></li>)}</ul>
            <Link href="/register" className={plan.key === "pro" ? "story-primary" : styles.secondaryButton}>{plan.cta} <span aria-hidden>↗</span></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
