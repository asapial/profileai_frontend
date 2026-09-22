import Link from "next/link";
import Image from "next/image";
import type { HomepageConfig } from "@/lib/homepage";
export function Footer({ content }: { content?: HomepageConfig["site"] }) {
  return (
    <footer className="studio-footer">
      <div className="studio-container">
        <div className="grid gap-10 py-14 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link href="/" className="studio-brand">
              <Image src="/brand/profileai-mark.svg" alt="" width={40} height={40} className="studio-logo-mark" />
              {content?.brandName || "ProfileAI"}
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              {(content?.footerDescription?.startsWith(
                "Build a job-winning resume with AI.",
              )
                ? undefined
                : content?.footerDescription) ||
                "For the work you’ve done. And everything you’ll do next."}
            </p>
          </div>
          <nav aria-label="Product">
            <p className="studio-eyebrow mb-5">THE STUDIO</p>
            <div className="flex flex-col items-start gap-3 text-sm">
              {[
                ["Templates", "/templates"],
                ["Pricing", "/pricing"],
                ["Your workspace", "/dashboard"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="studio-text-link">
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <nav aria-label="Support and legal">
            <p className="studio-eyebrow mb-5">THE DETAILS</p>
            <div className="flex flex-col items-start gap-3 text-sm">
              {[
                ["Help center", "/help"],
                ["Contact", "/contact"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="studio-text-link">
                  {label}
                </Link>
              ))}
              {content?.socialLinks
                ?.filter(
                  (link) =>
                    ![
                      "https://x.com",
                      "https://www.linkedin.com",
                      "https://github.com",
                      "#",
                    ].includes(link.href),
                )
                .map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="studio-text-link"
                  >
                    {link.label}
                  </a>
                ))}
            </div>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t py-6 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {content?.brandName || "ProfileAI"}
          </p>
          <p>
            {content?.footerNote || "Make your next move a considered one."}
          </p>
        </div>
      </div>
    </footer>
  );
}
