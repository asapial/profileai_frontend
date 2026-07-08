import { Star, Quote } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const QUOTES = [
  {
    quote:
      "I went from zero callbacks to three interviews in a week. The ATS score alone is worth it.",
    name: "Maya Chen",
    role: "Product Designer",
  },
  {
    quote:
      "The AI rewrote my bullet points in a way I couldn't have done myself. Landed my dream role two weeks later.",
    name: "James O'Connor",
    role: "Data Engineer",
  },
  {
    quote:
      "I love that the cover letter matches my resume. It saves me an hour per application.",
    name: "Priya Sharma",
    role: "Marketing Manager",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Loved by job seekers"
          title={<>Real people, real interviews</>}
          description="Join thousands of job seekers who've used ProFile AI to land more interviews in less time."
        />

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {QUOTES.map((q) => (
            <li
              key={q.name}
              className="relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
            >
              <Quote className="h-6 w-6 text-violet-300" />
              <p className="text-base leading-relaxed text-foreground">
                &ldquo;{q.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {q.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
