import type { Metadata } from "next";
import { Navbar1 } from "@/components/navbar1";
import { Footer } from "@/components/layout/Footer";
import { ContactPageClient } from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — ProfileAI",
  description: "Contact the ProfileAI team about product support, billing, partnerships, privacy, or security.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar1 />
      <main id="main" className="studio-public-page">
        <ContactPageClient />
      </main>
      <Footer />
    </>
  );
}
