import { redirect } from "next/navigation";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicTemplates } from "@/components/public/PublicTemplates";
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
    <PublicPageShell page="templates"><PublicTemplates templates={templates} /></PublicPageShell>
  );
}
