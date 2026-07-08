import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingClient } from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing — ProFile AI",
  description:
    "Choose the plan that fits your job search. Start free, upgrade for unlimited AI, cover letters, and the application tracker. No surprises.",
  openGraph: {
    title: "Pricing — ProFile AI",
    description:
      "Simple, transparent pricing. Free, Pro, and Business plans built for job seekers and teams.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <Suspense fallback={null}>
          <PricingClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
