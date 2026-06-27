"use client";

import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { stats } from "@/constants/homepage";

export function TrustBarSection() {
  return (
    <section className="bg-white px-4 py-12 dark:bg-[--color-bg-surface] lg:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-[--color-border] bg-[--color-bg-card] p-5 text-center">
            <p className="text-3xl font-semibold text-[--color-text-primary]">
              <AnimatedCounter value={item.value} suffix={item.suffix} />
            </p>
            <p className="mt-1 text-sm text-[--color-text-body]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
