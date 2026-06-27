import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { features } from "@/constants/homepage";

export function FeatureGridSection() {
  return (
    <section id="features" className="bg-white px-4 py-14 dark:bg-[--color-bg-surface] lg:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Features"
          title="Everything a focused job search needs"
          description="From first draft to final PDF, the workflow keeps your content targeted, measurable, and ready to send."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="group transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[--color-badge-bg] text-[--color-accent-hover]">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-medium text-[--color-text-primary]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[--color-text-body]">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
