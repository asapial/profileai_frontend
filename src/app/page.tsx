import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AiBuilderSection } from "@/components/home/AiBuilderSection";
import { AnimatedCtaSection } from "@/components/home/AnimatedCtaSection";
import { ApplicationTrackerSection } from "@/components/home/ApplicationTrackerSection";
import { AtsScoreSection } from "@/components/home/AtsScoreSection";
import { CoverLetterSection } from "@/components/home/CoverLetterSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedTemplateCarousel } from "@/components/home/FeaturedTemplateCarousel";
import { FeatureGridSection } from "@/components/home/FeatureGridSection";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { HeroSection } from "@/components/home/HeroSection";
import { PricingSection } from "@/components/home/PricingSection";
import { TemplateGallerySection } from "@/components/home/TemplateGallerySection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { CtaButton } from "@/components/home/CtaButton";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import TrustBarSection from "@/components/home/TrustBarSection";
import { fetchFeaturedTemplates } from "@/lib/api";

// Public, cacheable landing page. No auth required.
export const revalidate = 300; // 5 min — fresh enough for featured templates

export default async function HomePage() {
  // Fetch featured templates on the server with a safe fallback.
  let featured: Awaited<ReturnType<typeof fetchFeaturedTemplates>> = [];
  try {
    featured = await fetchFeaturedTemplates();
  } catch {
    // Backend unreachable in dev or rate-limited — show empty state in carousel.
    featured = [];
  }

  return (
    <>
      <Navbar />
      <main id="main">
        <HeroSection />
        <TrustBarSection />
        <FeatureGridSection />
        <WorkflowSection />

        {/* Featured templates — live data from /templates?featured=true */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Featured templates"
              title={<>Hand-picked designs that convert</>}
              description="Each template is ATS-tested, mobile-friendly, and fully customizable. Pick one and start tailoring in minutes."
            />
            <div className="mt-12">
              <FeaturedTemplateCarousel templates={featured} />
            </div>
            <div className="mt-8 flex justify-center">
              <CtaButton
                href="/templates"
                label="View all templates"
                variant="secondary"
                eventName="featured_view_all"
              />
            </div>
          </div>
        </section>

        <TemplateGallerySection />
        <AiBuilderSection />
        <AtsScoreSection />
        <CoverLetterSection />
        <ApplicationTrackerSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <AnimatedCtaSection
          title={<>Stop applying. Start getting interviews.</>}
          description="Create your free account, paste a job description, and let ProFile AI do the heavy lifting — in under a minute."
          primary={{ label: "Get Started Free", href: "/register" }}
          secondary={{ label: "See Pricing", href: "/pricing" }}
        />
        <FinalCtaBand />
      </main>
      <Footer />
    </>
  );
}
