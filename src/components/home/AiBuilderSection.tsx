"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/SectionHeader";

const outputs = [
  "Led checkout redesign that reduced drop-off by 24% and improved activation across three user segments.",
  "Built reusable analytics dashboards that shortened weekly reporting time from six hours to under one hour.",
  "Partnered with design and backend teams to ship onboarding experiments that lifted completion by 31%.",
];

export function AiBuilderSection() {
  const [index, setIndex] = useState(0);

  return (
    <section className="bg-[--color-bg-surface] px-4 py-14 dark:bg-[--color-bg-card] lg:px-6 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeader
          align="left"
          eyebrow="AI builder"
          title="Turn raw notes into resume-ready impact"
          description="Type rough work history and let the interface preview clear, quantified bullet points."
        />
        <Card className="p-5">
          <Badge>Interactive demo</Badge>
          <Textarea
            className="mt-4 min-h-28"
            defaultValue="Improved onboarding, worked with design, shipped experiments, helped users finish setup."
            aria-label="Resume note prompt"
          />
          <Button className="mt-4" onClick={() => setIndex((value) => (value + 1) % outputs.length)}>
            <Sparkles size={16} /> Rewrite bullet
          </Button>
          <div className="mt-5 rounded-xl border border-[--color-border] bg-[--color-bg-surface] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[--color-text-muted]">AI output</p>
            <p className="mt-2 text-sm leading-relaxed text-[--color-text-primary]">{outputs[index]}</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
