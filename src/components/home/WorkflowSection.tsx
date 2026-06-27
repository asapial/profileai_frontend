import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { workflow } from "@/constants/homepage";

export function WorkflowSection() {
  return (
    <section className="bg-[--color-bg-surface] px-4 py-14 dark:bg-[--color-bg-card] lg:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Workflow"
          title="A calm process from profile to finished PDF"
          description="Each step keeps the job seeker moving forward without burying them in form fields."
        />
        <div className="grid gap-4 md:grid-cols-5">
          {workflow.map(({ title, description, icon: Icon }, index) => (
            <Card key={title} className="relative p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[--color-badge-bg] text-[--color-accent-hover]">
                <Icon size={18} />
              </div>
              <p className="text-xs font-medium text-[--color-text-muted]">Step {index + 1}</p>
              <h3 className="mt-1 text-base font-medium text-[--color-text-primary]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[--color-text-body]">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
