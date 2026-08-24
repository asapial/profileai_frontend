import { Footer } from "@/components/layout/Footer";
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
import {
  CareerWorkspaceSection,
  LiveIntelligenceSection,
  PrivacyControlSection,
} from "@/components/home/PremiumProductSections";
import { fetchFeaturedTemplates, fetchPublicTemplates } from "@/lib/api";
import { Navbar1 } from "@/components/navbar1";
import {
  fetchHomepageContent,
  sectionMap,
  type ManagedHomepageSection,
} from "@/lib/homepage";

export const revalidate = 60;

const DEFAULT_ORDER = [
  "hero",
  "trust",
  "features",
  "careerWorkspace",
  "workflow",
  "featuredTemplates",
  "templateGallery",
  "aiBuilder",
  "ats",
  "coverLetter",
  "applicationTracker",
  "liveIntelligence",
  "testimonials",
  "pricing",
  "faq",
  "privacyControl",
  "animatedCta",
  "finalCta",
];

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof fetchFeaturedTemplates>> = [];
  let templates: Awaited<ReturnType<typeof fetchPublicTemplates>> = [];
  try {
    [featured, templates] = await Promise.all([
      fetchFeaturedTemplates(),
      fetchPublicTemplates(),
    ]);
  } catch {
    featured = [];
    templates = [];
  }

  const homepage = await fetchHomepageContent();
  const sections = sectionMap(homepage);
  const order = homepage?.sectionOrder ?? DEFAULT_ORDER;

  const renderSection = (
    id: string,
    content: ManagedHomepageSection | undefined,
  ) => {
    if (content?.enabled === false) return null;
    switch (id) {
      case "hero":
        return <HeroSection content={content} />;
      case "trust":
        return <TrustBarSection content={content} />;
      case "features":
        return <FeatureGridSection content={content} />;
      case "careerWorkspace":
        return <CareerWorkspaceSection content={content} />;
      case "workflow":
        return <WorkflowSection content={content} />;
      case "featuredTemplates":
        return (
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                eyebrow={content?.eyebrow || "Featured templates"}
                title={<>{content?.title || "Hand-picked designs that convert"}</>}
                description={
                  content?.description ||
                  "ATS-tested, mobile-friendly and fully customizable designs."
                }
              />
              <div className="mt-12">
                <FeaturedTemplateCarousel templates={featured} />
              </div>
              <div className="mt-8 flex justify-center">
                <CtaButton
                  href={content?.primaryCta?.href ?? "/templates"}
                  label={content?.primaryCta?.label ?? "View all templates"}
                  variant="secondary"
                  eventName="featured_view_all"
                />
              </div>
            </div>
          </section>
        );
      case "templateGallery":
        return <TemplateGallerySection content={content} templates={templates} />;
      case "aiBuilder":
        return <AiBuilderSection content={content} />;
      case "ats":
        return <AtsScoreSection content={content} />;
      case "coverLetter":
        return <CoverLetterSection content={content} />;
      case "applicationTracker":
        return <ApplicationTrackerSection content={content} />;
      case "liveIntelligence":
        return <LiveIntelligenceSection content={content} />;
      case "testimonials":
        return <TestimonialsSection content={content} />;
      case "pricing":
        return <PricingSection content={content} />;
      case "faq":
        return <FaqSection content={content} />;
      case "privacyControl":
        return <PrivacyControlSection content={content} />;
      case "animatedCta":
        return (
          <AnimatedCtaSection
            eyebrow={content?.eyebrow}
            title={content?.title || "Stop applying. Start getting interviews."}
            description={
              content?.description ||
              "Create your account and let ProFile AI do the repetitive work."
            }
            primary={
              content?.primaryCta ?? {
                label: "Get Started Free",
                href: "/register",
              }
            }
            secondary={
              content?.secondaryCta ?? {
                label: "See Pricing",
                href: "/pricing",
              }
            }
          />
        );
      case "finalCta":
        return <FinalCtaBand content={content} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar1
        logo={{
          url: "/",
          src: "/brand/profileai-mark.svg",
          alt: homepage?.site.brandName ?? "ProFile AI",
          title: homepage?.site.brandName ?? "ProFile AI",
        }}
        menu={homepage?.navigation.map((item) => ({
          title: item.label,
          url: item.href,
          items: item.children?.map((child) => ({
            title: child.label,
            url: child.href,
            description: child.description,
          })),
        }))}
      />
      <main id="main" className="premium-home relative overflow-hidden">
        {order.map((id) => (
          <div key={id}>{renderSection(id, sections.get(id))}</div>
        ))}
      </main>
      <Footer content={homepage?.site} />
    </>
  );
}
