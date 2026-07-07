'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartCta } from '@/components/ui/smart-cta';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

/**
 * Navbar — Block 1.
 *
 * Transparent over hero → frosted glass once scrolled past 60px (200ms
 * opacity + blur fade, not a hard cut). Subtle height shrink 72 → 64.
 * Scroll-spy dots mark the current section.
 *
 * Hover treatment: NO underline — a 4px dot grows from 0 beneath the
 * link, the link brightens to full white. Active section keeps the dot
 * permanently visible.
 *
 * Mobile: full-screen glass overlay with large Fraunces links staggered
 * fade-in.
 */
const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#templates', label: 'Templates' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: pick the topmost section currently in view.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const visible = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    const flush = () => {
      let bestId = '';
      let bestY = Infinity;
      for (const id of visible.keys()) {
        const el = document.getElementById(id);
        if (!el) continue;
        const y = el.getBoundingClientRect().top;
        if (y < bestY && y < window.innerHeight * 0.5) {
          bestY = y;
          bestId = id;
        }
      }
      if (bestId) setActive(bestId);
    };

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) visible.set(id, e.intersectionRatio);
            else visible.delete(id);
          }
          flush();
        },
        { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled
          ? 'h-16 border-b border-white/[0.06] bg-[rgba(13,13,26,0.72)] backdrop-blur-xl'
          : 'h-[72px] bg-transparent'
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full max-w-7xl items-center justify-between px-5 lg:px-8',
          'transition-all duration-200'
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ProFile AI home">
          <LogoMark />
          <span className="font-display text-[20px] font-medium tracking-tight text-white">
            ProFile<span className="text-[--color-accent]"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.href.slice(1);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-1 text-[14px] font-medium text-white/70 transition-colors duration-200 hover:text-white"
              >
                {link.label}
                <span
                  className={cn(
                    'absolute left-1/2 top-full mt-1 h-1 w-1 -translate-x-1/2 rounded-full bg-[--color-accent] transition-all duration-200',
                    isActive
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
          >
            Log in
          </Link>
          <SmartCta
            href="/register"
            label="Get Started Free"
            size="sm"
            analyticsLabel="nav_primary"
          />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-white"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen glass overlay — large Fraunces links */}
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-[rgba(13,13,26,0.92)] backdrop-blur-2xl md:hidden">
          <div className="h-[72px]" />
          <nav className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="animate-fade-in-up font-display text-4xl text-white"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/25 px-5 py-3 text-center text-base font-medium text-white"
              >
                Log in
              </Link>
              <SmartCta
                href="/register"
                label="Get Started Free"
                size="lg"
                className="w-full"
                analyticsLabel="nav_primary_mobile"
              />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

/**
 * LogoMark — folded document corner merging into a soft circle. Echoes
 * the orb motif so the brand reads at any size.
 */
function LogoMark() {
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="navLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle cx="18" cy="18" r="16" fill="url(#navLogoGrad)" opacity="0.18" />
        <path d="M12 9 H22 L25 12 V27 H12 Z" fill="url(#navLogoGrad)" opacity="0.95" />
        <path d="M22 9 V12 H25 Z" fill="#0d0d1a" opacity="0.35" />
        <path
          d="M14.5 16 H22.5 M14.5 19.5 H22.5 M14.5 23 H19"
          stroke="#0d0d1a"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}
