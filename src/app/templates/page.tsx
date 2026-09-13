import { redirect } from "next/navigation";
import { Navbar1 } from "@/components/navbar1";
import { Footer } from "@/components/layout/Footer";
import { TemplateGallerySection } from "@/components/home/TemplateGallerySection";
import { fetchPublicTemplates } from "@/lib/api";
export const metadata = {
  title: "Template collection — ProfileAI",
  description:
    "Explore resume and CV designs. Choose a layout before creating your account.",
};
export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  if (typeof query.customize === "string")
    redirect(
      `/dashboard/templates?customize=${encodeURIComponent(query.customize)}`,
    );
  let templates: Awaited<ReturnType<typeof fetchPublicTemplates>> = [];
  try {
    templates = await fetchPublicTemplates();
  } catch {
    /* Gallery has an explicit unavailable state. */
  }
  return (
    <>
      <Navbar1 />
      <main id="main">
        <TemplateGallerySection templates={templates} full />
      </main>
      <Footer />
    </>
  );
}
