import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicHelpCenter } from "@/components/public/PublicHelpCenter";
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
    <PublicPageShell page="help"><PublicHelpCenter articles={articles} categories={categories} /></PublicPageShell>
  );
}
