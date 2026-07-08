"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export function AnimatedCtaSection({
  eyebrow = "Ready when you are",
  title,
  description,
  primary,
  secondary,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="py-20 sm:py-24">
      <div
        ref={ref}
        className={cn(
          "relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-600 via-fuchsia-600 to-sky-600 p-10 text-white shadow-2xl shadow-violet-500/20 sm:p-14",
          "transition-all duration-700",
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/20 blur-3xl"
        />

        <div className="relative flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </span>

          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h2>

          {description && (
            <p className="max-w-2xl text-base text-white/85 sm:text-lg">
              {description}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <a
              href={primary.href}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-white/90"
            >
              {primary.label}
              <ArrowRight className="h-4 w-4" />
            </a>
            {secondary && (
              <a
                href={secondary.href}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {secondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
