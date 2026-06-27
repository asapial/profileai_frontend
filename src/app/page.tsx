import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AiBuilderSection } from "@/components/home/AiBuilderSection";
import { AtsScoreSection } from "@/components/home/AtsScoreSection";
import { CtaSection } from "@/components/home/CtaSection";
import { FeatureGridSection } from "@/components/home/FeatureGridSection";
import { HeroSection } from "@/components/home/HeroSection";
import { PricingSection } from "@/components/home/PricingSection";
import { TemplateGallerySection } from "@/components/home/TemplateGallerySection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustBarSection } from "@/components/home/TrustBarSection";
import { WorkflowSection } from "@/components/home/WorkflowSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[--color-bg-page]">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBarSection />
        <FeatureGridSection />
        <AiBuilderSection />
        <AtsScoreSection />
        <TemplateGallerySection />
        <WorkflowSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
