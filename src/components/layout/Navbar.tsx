"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/constants/homepage";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[--color-nav-bg]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--grad-cta] text-sm font-bold text-[--color-cta-text]">
            P
          </span>
          <span className="text-base font-semibold">ProFile AI</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[--grad-cta] px-5 text-sm font-medium text-[--color-cta-text] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]"
          >
            Start Building
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "grid border-t border-white/10 bg-[--color-nav-bg] transition-all duration-200 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/register" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full">Start Building</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
