import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "ATS scoring", href: "#ats" },
      { label: "Templates", href: "#templates" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[--color-footer-bg] px-4 py-14 text-white lg:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--grad-cta] text-sm font-bold text-[--color-cta-text]">
              P
            </span>
            <span className="font-semibold">ProFile AI</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            AI resume generation, ATS optimization, and polished PDF exports for job seekers who
            want every application to feel intentional.
          </p>
          <div className="mt-5 flex gap-2">
            {[Twitter, Github, Linkedin].map((Icon, index) => (
              <a
                key={index}
                href="#"
                aria-label="Social profile"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-white">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 ProFile AI. All rights reserved.</p>
        <p>Built for focused, confident applications.</p>
      </div>
    </footer>
  );
}
