"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, CopyPlus, ShieldCheck } from "lucide-react";
import type { FeaturedTemplate } from "@/lib/api";
import type { Template } from "@/lib/hooks/useTemplates";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import styles from "./TemplateDetailView.module.css";

const DEFAULT_ACCENT = "#0f918a";

function RelatedTemplate({ template }: { template: FeaturedTemplate }) {
  return (
    <Link href={`/templates/${template.id}`} className={styles.relatedCard}>
      <div className={styles.relatedPreview}><TemplateDesignPreview template={template} /></div>
      <div className={styles.relatedCopy}>
        <strong>{template.name}</strong>
        <span>{template.category.toLowerCase()} · {template.documentType.toLowerCase()}</span>
        <p>{template.description || "A refined, editable layout for a confident first impression."}</p>
      </div>
      <span className={styles.relatedArrow} aria-hidden="true"><ArrowUpRight /></span>
    </Link>
  );
}

export function TemplateDetailView({ template, related }: { template: Template; related: FeaturedTemplate[] }) {
  const accent = template.customization?.accentColor || DEFAULT_ACCENT;
  const previewTemplate = useMemo(() => ({
    ...template,
    cssStyles: `${template.cssStyles}\n:root,.resume,.resume-container,.cv { --primary: ${accent}; --accent: ${accent}; --primary-color: ${accent}; --accent-color: ${accent}; }`,
  }), [accent, template]);
  const description = template.description || "An engineering-focused résumé with precise visual rhythm. Clean, modern, and designed to highlight impact.";

  return (
    <main id="main" className={styles.main} style={{ "--detail-accent": "var(--primary)" } as React.CSSProperties}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.shell}>
        <Link href="/templates" className={styles.backLink}><ArrowLeft />All templates</Link>
        <section className={styles.hero} aria-labelledby="template-title">
          <div className={styles.previewScene}>
            <div className={styles.floorGlow} aria-hidden="true" />
            <div className={styles.podium} aria-hidden="true">
              <span className={styles.podiumGround} />
              <div className={styles.podiumTop}>
                <span className={styles.podiumContact} />
              </div>
              <span className={styles.podiumEdge} />
              <span className={styles.podiumFace} />
            </div>
            <div className={`${styles.paper} ${styles.paperBack}`} aria-hidden="true"><TemplateDesignPreview template={previewTemplate} /></div>
            <div className={`${styles.paper} ${styles.paperMiddle}`} aria-hidden="true"><TemplateDesignPreview template={previewTemplate} /></div>
            <div className={`${styles.paper} ${styles.paperFront}`}><TemplateDesignPreview template={previewTemplate} priority /></div>
          </div>

          <div className={styles.details}>
            <div className={styles.badges}><span>{template.category}</span><span>{template.documentType}</span></div>
            <h1 id="template-title">{template.name}</h1>
            <p className={styles.description}>{description}</p>
            <ul className={styles.features}>
              {["Preview the layout before you start", "Editable colors, typography, spacing and content", "Save your own version to your workspace", "ATS-friendly structure and export-ready layout"].map((item) => <li key={item}><Check />{item}</li>)}
            </ul>
            <div className={styles.actions}>
              <Link href={`/dashboard/documents/new?templateId=${template.id}`} className={styles.primaryAction}>Use this template <ArrowUpRight /></Link>
              <Link href={`/dashboard/templates?customize=${template.id}`} className={styles.secondaryAction}><CopyPlus /> Save editable copy</Link>
            </div>
            <div className={styles.trustNote}>
              <ShieldCheck />
              <p><strong>{template.isCommunity ? `Reviewed community template by ${template.owner?.name || "a ProfileAI creator"}` : "Designed and reviewed by the ProfileAI template team"}</strong><span>Professional. ATS-friendly. Ready for your next application.</span></p>
            </div>
          </div>
        </section>

        {related.length ? (
          <section className={styles.related} aria-labelledby="related-title">
            <div className={styles.relatedHeading}>
              <div><span className={styles.label}>You may also like</span><h2 id="related-title">Related templates</h2></div>
              <Link href="/templates">View all templates <ArrowUpRight /></Link>
            </div>
            <div className={styles.relatedGrid}>{related.map((item) => <RelatedTemplate key={item.id} template={item} />)}</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
