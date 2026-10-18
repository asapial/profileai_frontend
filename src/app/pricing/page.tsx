import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./PricingClient";

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
    <>
      <Navbar />
      <main id="main" className="studio-public-page">
        <Suspense fallback={null}>
          <PricingClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
