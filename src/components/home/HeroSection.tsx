import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrbLayer } from "@/components/shared/OrbLayer";
import { ResumePreviewCard } from "@/components/shared/ResumePreviewCard";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 text-white lg:px-6 lg:py-24" style={{ background: "var(--grad-hero)" }}>
      <OrbLayer />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge className="bg-white/10 text-white ring-1 ring-white/10">AI resume builder</Badge>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Build a resume that reads sharp, scores well, and exports beautifully.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
            ProFile AI turns your career profile into targeted resumes, ATS insights, and polished
            PDFs for every application.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Generate Resume <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href="#templates">
              <Button variant="outline" size="lg" className="w-full border-white/25 text-white hover:bg-white/10 sm:w-auto">
                <PlayCircle size={17} /> Browse Templates
              </Button>
            </Link>
          </div>
        </div>
        <ResumePreviewCard />
      </div>
    </section>
  );
}
