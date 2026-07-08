"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

const QUESTIONS = [
  {
    q: "Is ProFile AI really free to use?",
    a: "Yes. The Free plan lets you build one resume with limited AI generations. No credit card is required and you can upgrade to Pro any time for unlimited AI, cover letters, and the application tracker.",
  },
  {
    q: "What is an ATS score and why does it matter?",
    a: "Most companies use an Applicant Tracking System (ATS) to filter resumes before a human reads them. Your ATS score reflects how well your resume matches the role's keywords and formatting rules. A higher score means more interviews.",
  },
  {
    q: "Will my resume actually pass ATS systems?",
    a: "Our templates are designed to be parsed cleanly by all major ATS platforms, including Workday, Greenhouse, Lever, and Taleo. The ATS scoring tool also flags anything that might trip a parser.",
  },
  {
    q: "Can I edit the AI's output?",
    a: "Absolutely. The AI gives you a first draft — every section, bullet, and summary is fully editable. You can also regenerate individual sections as many times as you like.",
  },
  {
    q: "What file formats can I export?",
    a: "On the Free plan you can export PDF. Pro and Business plans also include DOCX export, which is useful when an employer wants an editable file.",
  },
  {
    q: "Is my data private and secure?",
    a: "Your data is encrypted in transit and at rest. We never share your resume or personal information with third parties. You can delete your account and all associated data at any time.",
  },
] as const;

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title={<>Frequently asked questions</>}
          description="Quick answers about pricing, ATS, AI quality, and privacy. Need more? Visit our help center."
        />

        <ul className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {QUESTIONS.map((item, i) => {
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
