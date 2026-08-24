import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
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
      <Navbar1 />
      <main id="main">
        <HelpCenter articles={HELP_ARTICLES} categories={HELP_CATEGORIES} />
      </main>
      <Footer />
    </>
  );
}
