"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeaturedTemplate } from "@/lib/api";
import { track } from "@/lib/analytics";

type Props = {
  templates: FeaturedTemplate[];
};

export function FeaturedTemplateCarousel({ templates }: Props) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Number of cards visible at once depends on viewport — we let CSS handle
  // it via snap scrolling, and we compute the active index from scrollLeft.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const card = el.querySelector<HTMLElement>("[data-card]");
      if (!card) return;
      const cardWidth = card.offsetWidth + 24; // include gap
      const next = Math.round(el.scrollLeft / cardWidth);
      setIndex((prev) => (prev === next ? prev : next));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    if (!card) return;
    const cardWidth = card.offsetWidth + 24;
    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  }, []);

  const prev = () => goTo(Math.max(0, index - 1));
  const next = () => goTo(Math.min(templates.length - 1, index + 1));

  if (templates.length === 0) {
    return <EmptyState />;
  }

  const atStart = index <= 0;
  const atEnd = index >= templates.length - 1;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        // Tailwind arbitrary variants cover Firefox / IE / WebKit scrollbar hiding.
        // We avoid <style jsx> here because its scoped class injection has been
        // flaky under Next 16 + Turbopack + React 19, producing hydration mismatches.
        className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {templates.map((t) => (
          <article
            key={t.id}
            data-card
            className={cn(
              "group relative flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card",
              "sm:w-[48%] lg:w-[31%]",
              "transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-violet-500/10",
            )}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
              {t.thumbnailUrl ? (
                <Image
                  src={t.thumbnailUrl}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 48vw, 31vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <TemplatePlaceholder name={t.name} />
              )}
              {t.isDefault && (
                <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                  Default
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {t.name}
                </h3>
                <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.category}
                </span>
              </div>
              {t.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {t.description}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                <span>{t._count?.resumes ?? 0} users</span>
                <Link
                  href={`/templates/${t.id}`}
                  onClick={() =>
                    track({
                      name: "featured_template_click",
                      properties: { id: t.id, name: t.name },
                    })
                  }
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  Preview →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous template"
          onClick={prev}
          disabled={atStart}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {templates.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to template ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/40",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next template"
          onClick={next}
          disabled={atEnd}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TemplatePlaceholder({ name }: { name: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-100 via-fuchsia-100 to-sky-100">
      <div className="flex flex-col items-center gap-2 text-violet-700/70">
        <LayoutTemplate className="h-10 w-10" />
        <span className="text-xs font-semibold">{name}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
      <Layers className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Featured templates will appear here soon. Check back shortly.
      </p>
    </div>
  );
}
