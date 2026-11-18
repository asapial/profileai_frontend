import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { ContactPageClient } from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — ProfileAI",
  description: "Contact the ProfileAI team about product support, billing, partnerships, privacy, or security.",
};

export default function ContactPage() {
  return (
    <PublicPageShell page="contact">
      <ContactPageClient />
    </PublicPageShell>
  );
}
