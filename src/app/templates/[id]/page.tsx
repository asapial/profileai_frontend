import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
import { TemplateDetailView } from "@/components/templates/TemplateDetailView";
import { env } from "@/lib/env";
import { fetchPublicTemplates } from "@/lib/api";
import type { Template } from "@/lib/hooks/useTemplates";

async function loadTemplate(id: string): Promise<Template | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/templates/${id}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      data: { template: Template };
    };
    return payload.data.template;
  } catch {
    return null;
  }
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, catalog] = await Promise.all([
    loadTemplate(id),
    fetchPublicTemplates().catch(() => []),
  ]);
  if (!template) notFound();

  const related = catalog
    .filter((item) => item.id !== template.id)
    .sort((a, b) => {
      const aMatch = a.category === template.category ? 1 : 0;
      const bMatch = b.category === template.category ? 1 : 0;
      return bMatch - aMatch || a.displayOrder - b.displayOrder;
    })
    .slice(0, 3);

  return (
    <div className="template-detail-page">
      <Navbar1 />
      <TemplateDetailView template={template} related={related} />
      <Footer />
    </div>
  );
}
