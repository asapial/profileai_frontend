import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, LifeBuoy, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  getArticleBySlug,
  getRelatedArticles,
} from "../data";

type RouteParams = { slug: string };

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article not found — ProFile AI" };
  return {
    title: `${article.title} — ProFile AI Help`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — ProFile AI Help`,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article, 3);
  const category = HELP_CATEGORIES.find((c) => c.id === article.category);

  return (
    <>
      <Navbar />
      <main id="main" className="pt-24">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to help center
          </Link>

          <header className="mt-6">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {category?.label ?? article.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              {article.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{article.readTime} min read</span>
              <span aria-hidden>·</span>
              <span>
                Updated{" "}
                {new Date(article.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </header>

          <hr className="my-8 border-border" />

          <ArticleBody body={article.body} />

          {/* Escalation */}
          <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
                <LifeBuoy className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  Still need help?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We couldn&rsquo;t answer your question here? Reach out and we&rsquo;ll
                  get back to you.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="mailto:support@profileai.app"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <Mail className="h-4 w-4" />
                    Email support
                  </Link>
                  <Link
                    href="/dashboard/support"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
                  >
                    Open a ticket
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Related articles
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/help/${r.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition hover:border-violet-300 hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {r.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.readTime} min read
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}

// Lightweight renderer for the controlled subset of formatting we use
// in the static article bodies. NOT a general-purpose markdown parser —
// for that, wire up a sanitized rich-text renderer once the CMS is in.
function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/);
  return (
    <div className="space-y-5 text-base leading-relaxed text-foreground">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function renderBlock(block: string, key: number) {
  if (block.startsWith("**") && block.endsWith("**") && !block.includes("\n")) {
    return (
      <p key={key} className="font-semibold">
        {stripBold(block)}
      </p>
    );
  }
  if (block.startsWith("- ")) {
    const items = block.split("\n").map((line) => line.replace(/^-\s+/, ""));
    return (
      <ul key={key} className="ml-5 list-disc space-y-2 marker:text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  if (/^\d+\.\s/.test(block)) {
    const items = block.split("\n").map((line) => line.replace(/^\d+\.\s+/, ""));
    return (
      <ol key={key} className="ml-5 list-decimal space-y-2 marker:text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ol>
    );
  }
  return <p key={key}>{renderInline(block)}</p>;
}

function renderInline(text: string): React.ReactNode {
  // Convert **bold** segments to <strong>.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function stripBold(s: string) {
  return s.replace(/^\*\*|\*\*$/g, "");
}
