import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { testimonials } from "@/constants/homepage";

export function TestimonialsSection() {
  return (
    <section className="bg-[--color-bg-page] px-4 py-14 dark:bg-[--color-bg-page] lg:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Results"
          title="Job seekers use it when the application matters"
          description="The interface is built to make thoughtful resume iteration feel fast, clear, and less lonely."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6">
              <p className="text-sm leading-relaxed text-[--color-text-body]">&quot;{testimonial.quote}&quot;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[--color-border] bg-[--color-badge-bg] text-sm font-medium text-[--color-badge-text]">
                  {testimonial.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-[--color-text-primary]">{testimonial.name}</p>
                  <p className="text-xs text-[--color-text-muted]">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
