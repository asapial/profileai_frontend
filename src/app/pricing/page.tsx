import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPricing } from "@/components/public/PublicPricing";

export const metadata: Metadata = {
  title: "Pricing — ProfileAI",
  description:
    "Bangladesh-friendly career plans in Taka. Start free, then upgrade for tailored resumes, application drafts, interview preparation, and career analytics.",
  openGraph: {
    title: "Pricing — ProfileAI",
    description:
      "Simple pricing in Bangladeshi Taka. Free, Job Seeker, and Career Pro plans built for your next career move.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <PublicPageShell page="pricing">
        <Suspense fallback={null}>
          <PublicPricing />
        </Suspense>
    </PublicPageShell>
  );
}
