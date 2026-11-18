import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicEnvironment, PublicPageShell } from "./PublicPageShell";
import { BillingArticleContents } from "./BillingArticleContents";
import styles from "./AccessPages.module.css";

type Article = { slug: string; title: string; excerpt: string; readTime: number; updatedAt: string; body: string };
const titles: Record<string, string> = { "To cancel.": "Cancel your subscription", "To get a refund.": "Request a refund", "To pause instead of cancel.": "Switch to Free" };

/** Keep published policy text as the source; the redesign only adds reading structure. */
export function BillingHelpArticle({ article, category, related }: { article: Article; category: string; related: Article[] }) {
  const sections = article.body.split(/\n\n+/).filter(Boolean).map((block, index) => {
    const heading = block.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
    return { id: "billing-section-" + index, title: heading ? titles[heading[1]] ?? heading[1].replace(/\.$/, "") : "Subscription details", body: heading ? heading[2] : block };
  });
  return <PublicPageShell page="billing-help">
    <article>
      <header className={styles.hero + " " + styles.articleHero}>
        <PublicEnvironment kind="billing-help" />
        <div className={styles.container}>
          <div className={styles.heroCopy} data-public-reveal>
            <Link href="/help" className={styles.back}><ArrowLeft size={16} aria-hidden />Back to help center</Link>
            <p className={styles.category}>{category}</p>
            <h1 data-public-reveal>{article.title}</h1>
            <p className={styles.excerpt} data-public-reveal>{article.excerpt}</p>
            <div className={styles.metadata} data-public-reveal><span>{article.readTime} min read</span><span aria-hidden>·</span><time dateTime={article.updatedAt}>Updated {new Date(article.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</time></div>
          </div>
        </div>
      </header>
      <div className={styles.container}>
        <div className={styles.articleLayout}>
          <BillingArticleContents sections={sections.map(({ id, title }) => ({ id, title }))} />
          <div className={styles.articleBody}>
            {sections.map(section => <section key={section.id} id={section.id} className={styles.articleSection} data-public-reveal><h2>{section.title}</h2><p>{inline(section.body)}</p></section>)}
          </div>
        </div>
        <section className={styles.escalation} data-public-reveal>
          <h2>Still need help?</h2>
          <div className={styles.supportActions}><Link href="/contact" className={styles.submit}>Contact support <ArrowRight size={16} aria-hidden /></Link><Link href="/dashboard/billing" className={styles.billingLink}>Open billing settings</Link><a href="mailto:support@profileai.app" className={styles.emailLink}>Email support</a></div>
        </section>
        {related.length > 0 && <section className={styles.related} data-public-reveal><h2>Related articles</h2>{related.map(item => <Link key={item.slug} href={"/help/" + item.slug}>{item.title}<ArrowRight size={16} aria-hidden /></Link>)}</section>}
      </div>
    </article>
  </PublicPageShell>;
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|support@profileai\.app)/g).map((part, index) => part === "support@profileai.app" ? <a key={index} href="mailto:support@profileai.app">{part}</a> : part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}
