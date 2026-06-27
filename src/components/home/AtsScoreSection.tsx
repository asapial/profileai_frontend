import { CheckCircle2, CircleAlert } from "lucide-react";
import { AtsScoreBar } from "@/components/shared/AtsScoreBar";
import { OrbLayer } from "@/components/shared/OrbLayer";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Card } from "@/components/ui/card";
import { insightCards } from "@/constants/homepage";

export function AtsScoreSection() {
  return (
    <section id="ats" className="relative overflow-hidden bg-[--color-nav-bg] px-4 py-14 lg:px-6 lg:py-20">
      <OrbLayer />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          inverted
          eyebrow="ATS intelligence"
          title="Know why a resume scores before you send it"
          description="Match the job description, surface missing keywords, and keep improvement suggestions actionable."
        />
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <Card className="bg-white/95 p-5 dark:bg-[--color-bg-card]">
            <div className="space-y-4">
              <AtsScoreBar score={88} label="Overall" />
              <AtsScoreBar score={94} label="Keywords" />
              <AtsScoreBar score={81} label="Clarity" />
              <AtsScoreBar score={76} label="Impact" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {insightCards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-[--color-bg-surface] p-4">
                  <Icon size={17} className="text-[--color-accent-hover]" />
                  <p className="mt-2 text-xl font-semibold text-[--color-text-primary]">{value}</p>
                  <p className="text-xs text-[--color-text-body]">{label}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-3">
            {["Add Kubernetes and CI/CD keywords", "Quantify launch impact", "Move technical skills higher"].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/8 p-4 text-white">
                {index === 0 ? <CircleAlert className="text-[--color-accent]" size={18} /> : <CheckCircle2 className="text-[--color-accent]" size={18} />}
                <p className="text-sm text-white/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
