import type { Metadata } from "next";
import HowItWorksContent from "./HowItWorksContent";

export const metadata: Metadata = {
  title: "How It Works — ProfileAI",
  description: "See how ProfileAI builds a resume from your experience, finds and reviews jobs, and connects your documents, applications and next actions.",
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
