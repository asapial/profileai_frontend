import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbLayer } from "@/components/shared/OrbLayer";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[--color-nav-bg] px-4 py-16 text-center text-white lg:px-6 lg:py-20">
      <OrbLayer />
      <div className="relative mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
          Your next application deserves a resume built for the role.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
          Create a profile once, generate targeted resumes, check ATS fit, and export a PDF that
          feels ready.
        </p>
        <Link href="/register" className="mt-8 inline-flex">
          <Button size="lg">
            Start Building <ArrowRight size={17} />
          </Button>
        </Link>
      </div>
    </section>
  );
}
