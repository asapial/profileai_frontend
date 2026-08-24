import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, AtSign, BadgeCheck, Globe, Mail, X } from "lucide-react";
import type { HomepageConfig } from "@/lib/homepage";

const PRODUCT = [
  { href: "/#features", label: "Features" },
  { href: "/#templates", label: "Templates" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/resumes/new", label: "AI résumé builder" },
  { href: "/dashboard/ats", label: "ATS analyzer" },
];
const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/help", label: "Help Center" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/about#careers", label: "Careers" },
  { href: "/contact#partners", label: "Partners" },
];
const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/privacy#security", label: "Security" },
  { href: "/terms#accessibility", label: "Accessibility" },
];

export function Footer({ content }: { content?: HomepageConfig["site"] }) {
  const socials = content?.socialLinks ?? [
    { label: "X", href: "https://x.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com" },
    { label: "GitHub", href: "https://github.com" },
  ];
  const socialIcons = [X, Globe, AtSign];
  return (
    <footer className="border-t border-white/35 bg-muted/20 backdrop-blur-xl dark:border-white/8">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-4 rounded-2xl border border-violet-500/15 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/5 to-cyan-500/8 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-violet-500" />Career notes, without the noise</p>
            <p className="mt-1 text-sm text-muted-foreground">Practical résumé guidance, hiring insights, and product updates delivered twice a month.</p>
          </div>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
            Join ProFile AI <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/brand/profileai-mark.svg" alt="" width={48} height={48} className="h-9 w-9" />
              <span className="text-lg font-semibold tracking-tight">
                ProFile <span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {content?.footerDescription ||
                "Build a job-winning resume with AI. Create, tailor, score, and export a professional resume in minutes."}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" /> Privacy-first career workspace
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socials.map((social, index) => {
                const Icon = socialIcons[index % socialIcons.length]!;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Product" links={PRODUCT} />
          <FooterColumn title="Company" links={COMPANY} />
          <FooterColumn title="Legal" links={LEGAL} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProFile AI. All rights reserved.</p>
          <p>{content?.footerNote || "Made for job seekers who want to stand out."}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
