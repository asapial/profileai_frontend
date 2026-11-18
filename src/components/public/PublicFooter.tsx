import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { HomepageConfig } from "@/lib/homepage";
import { BrandMonument } from "./BrandMonument";
import styles from "./PublicBrand.module.css";

/** One branded colophon for public pages; compact keeps account forms in focus. */
export function PublicFooter({ compact = false, withCTA = true, content }: { compact?: boolean; withCTA?: boolean; content?: HomepageConfig["site"] }) {
  const brandName = (content?.brandName || "ProfileAI").replace(/ProFile\s*AI/gi, "ProfileAI");
  const description = content?.footerDescription?.startsWith("Build a job-winning resume with AI.") ? undefined : content?.footerDescription;
  const socialLinks = content?.socialLinks?.filter(link=>!["https://x.com","https://www.linkedin.com","https://github.com","#"].includes(link.href)) ?? [];
  return <footer className={styles.footer} data-site-footer data-compact={compact || undefined} aria-label="ProfileAI footer">
    <div className={styles.footerInner}>
      {!compact && <div className={styles.invitation}>
        <div className={styles.invitationCopy}>
          <h2>Your next chapter,<br/>built from you.</h2>
          <p>One place for your experience, your resumes,<br className={styles.desktopBreak}/> and every next move.</p>
          {withCTA && <Link href="/register" className={styles.footerAction}>Create your resume <span><ArrowUpRight size={20} aria-hidden/></span></Link>}
        </div>
        <div className={styles.monument}><BrandMonument/></div>
      </div>}
      <div className={styles.directory}>
        <div className={styles.identity}>
          <Link href="/" className={styles.brand} aria-label={brandName+" home"}><span className={styles.logoMount}><Image src="/brand/profileai-mark.svg" alt="" width={44} height={44}/></span><span>{brandName}</span></Link>
          <p>{description || <>Your words. Your evidence.<br/>Your next chapter.</>}</p>
          {socialLinks.length>0&&<div className={styles.socialLinks}>{socialLinks.map(link=><a key={link.href} href={link.href}>{link.label}</a>)}</div>}
        </div>
        <nav aria-label="Product"><h3>Explore</h3><Link href="/howitworks">How it works</Link><Link href="/templates">Resume templates</Link><Link href="/pricing">Plans & pricing</Link></nav>
        <nav aria-label="Support"><h3>Here to help</h3><Link href="/help">Help center</Link><Link href="/contact">Contact the team</Link><Link href="/help/cancel-or-refund">Cancel or refund</Link></nav>
        <nav aria-label="Legal"><h3>Your space</h3><Link href="/dashboard">Your workspace</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link></nav>
      </div>
      <div className={styles.colophon}><span>© {new Date().getFullYear()} {brandName}</span><span>{content?.footerNote||"For the work you’ve done. And everything you’ll do next."}</span><a href="#main">Back to top <ArrowUpRight size={14} aria-hidden/></a></div>
    </div>
  </footer>;
}
