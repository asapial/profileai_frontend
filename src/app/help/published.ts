import { cache } from "react";
import { api } from "@/lib/api";
import { HELP_ARTICLES, type HelpArticle } from "./data";

/** Keep the bundled guides available while publishing new guides from the admin CMS. */
export const getHelpArticles = cache(async (): Promise<HelpArticle[]> => {
  try {
    const published = await api.get<HelpArticle[]>("/content/help-articles", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    const articles = new Map(HELP_ARTICLES.map(article => [article.slug, article]));
    for (const article of published) articles.set(article.slug, article);
    return [...articles.values()];
  } catch {
    return HELP_ARTICLES;
  }
});
