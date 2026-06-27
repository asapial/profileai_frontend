"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AtsScoreBar } from "@/components/shared/AtsScoreBar";
import { templates } from "@/constants/homepage";
import { cn } from "@/lib/utils";

const tabs = ["All", "Modern", "Classic", "Creative", "ATS"];

export function TemplateGallerySection() {
  const [tab, setTab] = useState("All");
  const visible = useMemo(
    () => templates.filter((template) => tab === "All" || template.category === tab),
    [tab]
  );

  return (
    <section id="templates" className="bg-white px-4 py-14 dark:bg-[--color-bg-surface] lg:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Templates"
          title="Start with a resume structure that already feels polished"
          description="Filter templates by style and choose layouts designed for readability, recruiter scanning, and PDF export."
        />
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]",
                tab === item
                  ? "bg-[--color-badge-bg] text-[--color-badge-text]"
                  : "text-[--color-text-body] hover:bg-[--color-bg-surface] hover:text-[--color-text-primary]"
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visible.map((template) => (
            <Card key={template.name} className="group overflow-hidden p-4 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 flex aspect-[3/4] items-center justify-center rounded-lg bg-[--color-bg-surface]">
                <div className="w-3/4 rounded-lg bg-[--color-bg-card] p-4 shadow-sm">
                  <FileText className="mb-3 text-[--color-accent-hover]" size={22} />
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-[--color-badge-bg]" />
                    <div className="h-2 w-5/6 rounded-full bg-[--color-badge-bg]" />
                    <div className="h-2 w-2/3 rounded-full bg-[--color-badge-bg]" />
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-[--color-text-primary]">{template.name}</h3>
              <p className="mb-4 mt-1 text-sm text-[--color-text-body]">{template.category}</p>
              <AtsScoreBar score={template.score} label="ATS" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
