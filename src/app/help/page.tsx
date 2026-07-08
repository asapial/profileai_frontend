import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpCenter } from "./HelpCenter";
import { HELP_ARTICLES, HELP_CATEGORIES } from "./data";

export const metadata: Metadata = {
  title: "Help Center — ProFile AI",
  description:
    "Search guides, FAQs, and tutorials for ProFile AI. Find answers about resumes, AI writing, ATS scoring, billing, and account security.",
  openGraph: {
    title: "Help Center — ProFile AI",
    description:
      "Self-service support for ProFile AI. Search articles or contact our team.",
    type: "website",
  },
};

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <HelpCenter articles={HELP_ARTICLES} categories={HELP_CATEGORIES} />
      </main>
      <Footer />
    </>
  );
}
