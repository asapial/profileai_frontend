"use client";

import dynamic from "next/dynamic";
import { Navbar } from "./Navbar";
import { TrustAndWorkspaceSections } from "./TrustAndWorkspaceSections";
import { StoryShowcaseSection, StoryCustomerStorySection, StoryTemplatesSection } from "./StoryProofSections";
import { CareerCinema } from "./CareerCinema";
import { useStoryStore } from "@/store/useStoryStore";

// B6: the below-the-story sections keep their server-rendered HTML (ssr stays
// on), but ship as separate chunks so the story's first paint pulls less JS.
const PricingSection = dynamic(() => import("./PricingSection").then((m) => m.PricingSection));
const FaqSection = dynamic(() => import("./FaqSection").then((m) => m.FaqSection));
const BottomCtaAndFooter = dynamic(() => import("./BottomCtaAndFooter").then((m) => m.BottomCtaAndFooter));

export function StoryLandingPage() {
  const motionEnabled = useStoryStore((state) => state.motionEnabled);
  return (
    <div className={`story-page ${motionEnabled ? "" : "story-page--reduced"}`}>
      <Navbar />
      <main id="main">
        <CareerCinema />
        <div id="static-zone" className="static-zone">
          <TrustAndWorkspaceSections />
          <StoryShowcaseSection />
          <StoryCustomerStorySection />
          <StoryTemplatesSection />
          <PricingSection />
          <FaqSection />
          <BottomCtaAndFooter />
        </div>
      </main>
    </div>
  );
}
