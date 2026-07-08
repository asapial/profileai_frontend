import Link from "next/link";
import { Sparkles, X, Globe, AtSign } from "lucide-react";

const PRODUCT = [
  { href: "#features", label: "Features" },
  { href: "#templates", label: "Templates" },
  { href: "#pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];
const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/help", label: "Help Center" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];
const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                ProFile <span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Build a job-winning resume with AI. Create, tailor, score, and
              export a professional resume in minutes.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="#"
                aria-label="Twitter"
                className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="LinkedIn"
                className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="GitHub"
                className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground"
              >
                <AtSign className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <FooterColumn title="Product" links={PRODUCT} />
          <FooterColumn title="Company" links={COMPANY} />
          <FooterColumn title="Legal" links={LEGAL} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProFile AI. All rights reserved.</p>
          <p>Made for job seekers who want to stand out.</p>
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