import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
import { HeroSection } from "@/components/home/HeroSection";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { FeatureGridSection } from "@/components/home/FeatureGridSection";
import { TemplateGallerySection } from "@/components/home/TemplateGallerySection";
import { PricingSection } from "@/components/home/PricingSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { fetchPublicTemplates } from "@/lib/api";
import { fetchHomepageContent, sectionMap, type ManagedHomepageSection } from "@/lib/homepage";
import { studioSection } from "@/lib/studio-homepage";
import { CareerJourneyDemo } from "@/components/home/CareerJourneyDemo";
import { CareerExperience } from "@/components/home/CareerExperience";
import "@/components/home/career-home.css";
export const revalidate = 60;
const DEFAULT_ORDER = [
  "hero",
  "match",
  "workflow",
  "workspace",
  "evidence",
  "readiness",
  "email",
  "interview",
  "followup",
  "privacy",
  "features",
  "templateGallery",
  "pricing",
  "faq",
  "finalCta",
];
const LEGACY_ORDER = [
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
  const homepage = await fetchHomepageContent();
  const sections = sectionMap(homepage);
  for (const [id, section] of sections)
    sections.set(id, studioSection(section));
  const savedOrder = homepage?.sectionOrder;
  const isLegacy = savedOrder?.join(",") === LEGACY_ORDER.join(",");
  const order = [
    ...new Set(isLegacy || !savedOrder ? DEFAULT_ORDER : [...savedOrder.slice(0, 1), "match", "workspace", "evidence", "readiness", "email", "interview", "followup", "privacy", ...savedOrder.slice(1)]),
  ].filter((id) => DEFAULT_ORDER.includes(id));
  const renderSection = (id: string) => {
    const content = sections.get(id);
    if (content?.enabled === false) return null;
    switch (id) {
      case "evidence": case "interview": case "followup":
        return <CareerExperience section={id} />;
      case "match": case "workspace": case "readiness": case "email": case "privacy":
        return <CareerJourneyDemo section={id} />;
      case "hero":
        return <HeroSection content={content} />;
      case "workflow":
        return <WorkflowSection content={content} />;
      case "features":
        return <FeatureGridSection content={content} />;
      case "templateGallery":
        return (
          <Suspense fallback={<section className="studio-container py-16" aria-label="Template collection"><p>Loading the template collection…</p></section>}><HomeTemplateGallery content={content} /></Suspense>
        );
      case "pricing":
        return <PricingSection content={content} />;
      case "faq":
        return <FaqSection content={content} />;
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
          alt: homepage?.site.brandName || "ProfileAI",
          title: homepage?.site.brandName || "ProfileAI",
        }}
      />
      <main id="main" className="premium-home career-home relative">
        {order.map((id) => (
          <div key={id}>{renderSection(id)}</div>
        ))}
      </main>
      <Footer content={homepage?.site} />
    </>
  );
}

// The below-fold catalog must not hold back the hero. Serialize only the six
// previews displayed here, rather than every template's HTML and stylesheet.
async function HomeTemplateGallery({ content }: { content?: ManagedHomepageSection }) {
  const templates = await fetchPublicTemplates(AbortSignal.timeout(4000)).catch(() => []);
  const resumes = templates.filter(t => (t.documentType || "RESUME") === "RESUME");
  const cvs = templates.filter(t => t.documentType === "CV");
  return <TemplateGallerySection content={content} templates={[...resumes.slice(0, 3), ...cvs.slice(0, 3)]} totals={{ RESUME: resumes.length, CV: cvs.length }} />;
}
