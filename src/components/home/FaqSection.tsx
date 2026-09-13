"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";
import type { ManagedHomepageSection } from "@/lib/homepage";

const QUESTIONS = [
  { q: "What can I do on the Free plan?", a: "Start with private job imports, an Evidence Bank, and 15 saved applications. Career Studio includes 3 alignment analyses, 2 tailored summaries and 5 application drafts per month." },
  { q: "Does an alignment score predict an interview?", a: "No. Alignment is a review of evidence and keyword coverage, not a hiring probability or a guarantee that an ATS will accept a document. Review the missing and uncertain requirements alongside the score." },
  { q: "Will the studio invent achievements or metrics?", a: "Career Studio drafts use your selected confirmed evidence. Inferred or missing evidence cannot become a generated achievement. You can use clear wording without a metric when a number is unavailable." },
  { q: "Does ProFile AI send applications automatically?", a: "No. Review your draft and recipient, then explicitly choose to send. Google email and calendar connections require consent and availability depends on the deployment configuration." },
  { q: "Where do discovered jobs come from?", a: "From administrator-approved Lever and Greenhouse public boards. Private URL and description imports are also supported. Restricted job boards remain manual or link-only." },
  { q: "Can I take my data with me?", a: "Yes. Career Studio provides a workspace export. You can delete drafts or evidence, disconnect Google and use account deletion from Settings. See the privacy policy for storage and provider processing details." },
] as const;

export function FaqSection({ content }: { content?: ManagedHomepageSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const questions = QUESTIONS;

  return (
    <section id="faq" className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={content?.eyebrow || "FAQ"}
          title={<>{content?.title || "Frequently asked questions"}</>}
          description={content?.description || "Quick answers about pricing, ATS, AI quality, and privacy. Need more? Visit our help center."}
        />

        <ul className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {questions.map((item, i) => {
            const open = openIndex === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-foreground sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-foreground transition",
                      open ? "bg-foreground text-background" : "bg-background",
                    )}
                  >
                    {open ? (
                      <Minus className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid overflow-hidden px-5 transition-[grid-template-rows] duration-300",
                    open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
