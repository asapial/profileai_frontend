"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { PLANS, COMPARISON, FAQS } from "@/app/pricing/PricingClient";
import { track } from "@/lib/analytics";
import { PublicEnvironment } from "./PublicPageShell";
import styles from "./PublicPages.module.css";

export function PublicPricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  return <>
    <section className={styles.pricingHero}>
      <PublicEnvironment kind="pricing" />
      <div className={styles.container}>
        <div className={styles.pricingIntro}>
          <div><h1>Plans for your<br />next move.</h1><p className={styles.lede}>Start free. Upgrade when you need more room.</p></div>
          <div className={styles.billingSwitch} role="group" aria-label="Billing interval">
            {(["monthly", "yearly"] as const).map(interval => <button key={interval} type="button" aria-pressed={billing === interval} onClick={() => {
              setBilling(interval); track({ name: "pricing_toggle_billing", properties: { billing: interval } });
            }}>{interval === "monthly" ? "Monthly" : "Yearly"}</button>)}
          </div>
        </div>
        <ul className={styles.plans}>
          {PLANS.map(plan => <li className={styles.planStage} key={plan.id} data-highlighted={plan.highlighted || undefined}>
            <div className={styles.plan} data-ui>
              <h2>{plan.name}</h2>
              <p className={styles.planPrice} aria-live="polite"><strong>৳{(billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString("en-BD")}</strong><span>{plan.monthlyPrice === 0 ? "forever" : billing === "monthly" ? "/ month" : "/ year"}</span></p>
              <p className={styles.planDescription}>{plan.tagline}</p>
              <ul>{plan.features.map(feature => <li key={feature.label}><Check size={17} aria-hidden="true" /><span>{feature.label}{feature.comingSoon ? " (coming soon)" : ""}</span></li>)}</ul>
              <Link className={plan.highlighted ? styles.button : styles.secondaryButton} href={plan.selfServe ? `/register?plan=${plan.id}&billing=${billing}` : "/contact"} onClick={() => track({ name: `pricing_cta_${plan.id}`, properties: { plan: plan.id, billing, selfServe: plan.selfServe } })}>{plan.cta.label}</Link>
            </div>
            <div className={styles.platform} aria-hidden="true" />
          </li>)}
        </ul>
        <p className={styles.billingNote}>{billing === "yearly" ? "Paid plans are billed once per year. AI allowances reset monthly." : "Prices in Bangladeshi Taka. The Free plan needs no payment method."}</p>
      </div>
    </section>
    <section className={`${styles.container} ${styles.comparisonSection}`} data-public-reveal>
      <h2>Every plan, side by side</h2>
      <div className={styles.comparison} role="region" aria-label="Pricing plan comparison" tabIndex={0}>
        <table><caption className={styles.srOnly}>Feature comparison for Free, Job Seeker, and Career Pro plans</caption>
          <thead><tr><th scope="col">Feature</th>{PLANS.map(plan => <th key={plan.id} scope="col">{plan.name}</th>)}</tr></thead>
          <tbody>{COMPARISON.map(row => <tr key={row.row}><th scope="row">{row.row}</th>{[row.free, row.pro, row.business].map((value, index) => <td key={index}>{typeof value === "boolean" ? value ? <><Check aria-hidden="true" size={18} /><span className={styles.srOnly}>Included</span></> : <><span aria-hidden="true">—</span><span className={styles.srOnly}>Not included</span></> : value}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <aside className={styles.sprintPass} data-public-reveal>
        <div><h3>One urgent application?</h3><p>The 7-day Sprint Pass includes 5 alignment analyses, 3 tailored resumes, 10 application drafts, premium templates, and clean PDF export.</p></div>
        <div><strong>৳149</strong><p>One-time · no auto-renewal</p></div>
      </aside>
    </section>
    <section className={`${styles.container} ${styles.faqSection}`}>
      <h2>Frequently asked questions</h2>
      <div className={styles.faqList}>{FAQS.map(item => <details key={item.q} data-public-reveal><summary>{item.q}<ChevronDown aria-hidden="true" size={19} /></summary><p>{item.a}</p></details>)}</div>
      <p className={styles.helpLink}>Need help choosing? <Link href="/help">Visit the help center</Link> or <a href="mailto:support@profileai.app">email support</a>.</p>
    </section>
  </>;
}
