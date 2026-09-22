import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ManagedHomepageSection } from "@/lib/homepage";
export function FinalCtaBand({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  return (
    <section className="atelier-final border-t bg-muted py-16 sm:py-24">
      <div className="studio-container flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="studio-eyebrow mb-5 text-primary">READY WHEN YOU ARE</p>
          <h2 className="max-w-2xl text-4xl sm:text-5xl">
            {content?.title || (
              <>
                Your next chapter.
                <br />
                <em>Make it yours.</em>
              </>
            )}
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
            {content?.description ||
              "Start with your experience. Build something you’re proud to send."}
          </p>
        </div>
        <Link
          className="studio-button shrink-0"
          href={content?.primaryCta?.href || "/register"}
        >
          {content?.primaryCta?.label || "Create your resume"}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}

