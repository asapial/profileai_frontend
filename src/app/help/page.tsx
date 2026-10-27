import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
import { HelpCenter } from "./HelpCenter";
import { HELP_CATEGORIES } from "./data";
import { getHelpArticles } from "./published";

export const metadata: Metadata = {
  title: "Help Center — ProfileAI",
  description:
    "Search guides, FAQs, and tutorials for ProfileAI. Find answers about resumes, AI writing, ATS scoring, billing, and account security.",
  openGraph: {
    title: "Help Center — ProfileAI",
    description:
      "Self-service support for ProfileAI. Search articles or contact our team.",
    type: "website",
  },
};

export default async function HelpPage() {
  const articles = await getHelpArticles();
  const categories = [...HELP_CATEGORIES];
  for (const article of articles) {
    if (!categories.some(category => category.id === article.category)) categories.push({ id: article.category, label: article.category, description: "Published guides" });
  }
  return (
    <>
      <Navbar1 />
      <main id="main" className="studio-public-page">
        <HelpCenter articles={articles} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
