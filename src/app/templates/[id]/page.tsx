import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CopyPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Navbar1 } from "@/components/navbar1";
import { env } from "@/lib/env";
import type { Template } from "@/lib/hooks/useTemplates";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";

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
  const template = await loadTemplate(id);
  if (!template) notFound();
  return (
    <>
      <Navbar1 />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <Button asChild variant="ghost" size="sm">
          <Link href="/templates"><ArrowLeft className="mr-2 size-4" />All templates</Link>
        </Button>
        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:items-start">
          <Card className="glass-panel overflow-hidden border-white/60 p-3 dark:border-white/10">
            <CardContent className="rounded-xl bg-gradient-to-br from-violet-100/80 via-white to-cyan-100/80 p-4 dark:from-violet-950/50 dark:via-slate-950 dark:to-cyan-950/40 sm:p-7">
              <TemplateDesignPreview template={template} className="mx-auto max-w-[620px] rounded-xl shadow-2xl shadow-slate-950/20" priority />
            </CardContent>
          </Card>
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-2">
              <p className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600">{template.category}</p>
              <p className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{template.documentType}</p>
              {template.isCommunity ? <p className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Community edition</p> : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{template.name}</h1>
            <p className="mt-4 text-muted-foreground">{template.description || "A professional, ATS-friendly resume template."}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {["Preview the layout before you start", "Editable colors, typography, spacing and content", "Save your own version to your workspace", "ATS-friendly structure and export-ready layout"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{item}</li>)}
            </ul>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <Link href={`/dashboard/resumes/new?templateId=${template.id}`}>
                  Use this template
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/dashboard/templates?customize=${template.id}`}><CopyPlus className="mr-2 size-4" />Save editable copy</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-violet-500" />
              <p>{template.isCommunity ? `Published by ${template.owner?.name || "a ProFile AI creator"} after admin review.` : "Designed and reviewed by the ProFile AI template team."}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
