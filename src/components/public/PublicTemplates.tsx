"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bookmark, ChevronLeft, ChevronRight, Grid2X2, List, Search, X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { FeaturedTemplate, TemplateCategory } from "@/lib/api";
import catalog from "@/lib/home-template-catalog.json";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import { useShortlist } from "@/components/home/TemplateGallerySection";
import { PublicEnvironment } from "./PublicPageShell";
import styles from "./PublicPages.module.css";

type GalleryTemplate = Pick<FeaturedTemplate, "id" | "name" | "description" | "category" | "documentType" | "htmlLayout" | "cssStyles" | "displayOrder" | "_count"> & { previewAsset?: string };
const order = ["kinship", "orbit", "editorial-cut", "gridline", "harbor", "apex", "oblique"];
const localCatalog: GalleryTemplate[] = [...catalog].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)).map((template, index) => ({
  ...template, id: `catalog:${template.slug}`, category: template.category as TemplateCategory, documentType: "RESUME", displayOrder: index, _count: { resumes: 0 }, previewAsset: `/templates/story/${template.slug}.png`,
}));
const categories: Array<["ALL" | TemplateCategory, string]> = [["ALL", "All templates"], ["MODERN", "Modern"], ["CREATIVE", "Creative"], ["CLASSIC", "Classic"], ["ATS", "ATS friendly"]];

function Paper({ template, priority = false }: { template: GalleryTemplate; priority?: boolean }) {
  return template.previewAsset
    ? <Image src={template.previewAsset} alt="" width={794} height={1123} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} sizes="(max-width: 620px) 70vw, 340px" className={styles.paperImage} />
    : <TemplateDesignPreview template={template} priority={priority} as="span" />;
}

export function PublicTemplates({ templates }: { templates: FeaturedTemplate[] }) {
  const source: GalleryTemplate[] = templates.length ? templates : localCatalog;
  const [documentType, setDocumentType] = useState<"RESUME" | "CV">("RESUME");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | TemplateCategory>("ALL");
  const [shortlisted, setShortlisted] = useState(false);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, source.findIndex(template => template.name === "Orbit")));
  const [preview, setPreview] = useState<GalleryTemplate | null>(null);
  const lastPreviewButton = useRef<HTMLButtonElement | null>(null);
  const { saved, toggle } = useShortlist();
  const visible = useMemo(() => source.filter(template => (template.documentType || "RESUME") === documentType &&
    (category === "ALL" || template.category === category) && (!shortlisted || saved.includes(template.id)) &&
    `${template.name} ${template.description ?? ""} ${template.category}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b._count.resumes - a._count.resumes || a.displayOrder - b.displayOrder),
    [source, documentType, category, shortlisted, saved, query, sort]);
  const current = visible.length ? activeIndex % visible.length : 0;
  const displayed = visible.length >= 3 ? [-1, 0, 1].map(offset => ({ template: visible[(current + offset + visible.length) % visible.length]!, offset }))
    : visible.map((template, index) => ({ template, offset: index === current ? 0 : 1 }));
  const openPreview = (template: GalleryTemplate, button: HTMLButtonElement) => { lastPreviewButton.current = button; setPreview(template); };

  return <>
    <section className={styles.galleryHero}>
      <PublicEnvironment kind="templates" />
      <div className={styles.container}>
        <div className={styles.galleryIntro}>
          <div><h1>Find your<br />resume style.</h1><p className={styles.lede}>Choose a layout. Keep your story.</p></div>
          <div className={styles.galleryControls}>
            <label className={styles.templateSearch}><Search size={20} aria-hidden="true" /><span className={styles.srOnly}>Search templates</span><input type="search" value={query} placeholder="Search templates" onChange={event => { setQuery(event.target.value); setActiveIndex(0); }} /></label>
            <div className={styles.documentSwitch} role="group" aria-label="Document type">{(["RESUME", "CV"] as const).map(type => <button key={type} type="button" aria-pressed={documentType === type} onClick={() => { setDocumentType(type); setActiveIndex(0); }}>{type === "RESUME" ? "Resumes" : "CVs"}</button>)}</div>
            <div className={styles.categories} role="group" aria-label="Template category">{categories.map(([value, label]) => <button type="button" key={value} aria-pressed={category === value} onClick={() => { setCategory(value); setActiveIndex(0); }}>{label}</button>)}</div>
          </div>
        </div>
        {visible.length ? <div className={styles.galleryStage} aria-label="Featured template gallery">
          {displayed.map(({ template, offset }) => <figure className={styles.galleryExhibit} key={template.id} data-offset={offset}>
            <div className={styles.paperStage}>
              <button className={styles.exhibitFace} type="button" aria-label={`Preview ${template.name}`} onClick={event => openPreview(template, event.currentTarget)}><Paper template={template} priority /></button>
              <div className={styles.platform} aria-hidden="true" />
            </div>
            <figcaption><h2>{template.name}</h2><p>{template.description}</p><button type="button" className={styles.textLink} onClick={event => openPreview(template, event.currentTarget)}>Preview template<ArrowUpRight size={15} aria-hidden="true" /></button></figcaption>
          </figure>)}
          {visible.length > 1 && <div className={styles.galleryArrows}><button type="button" aria-label="Previous template" onClick={() => setActiveIndex((current + visible.length - 1) % visible.length)}><ChevronLeft aria-hidden="true" /></button><button type="button" aria-label="Next template" onClick={() => setActiveIndex((current + 1) % visible.length)}><ChevronRight aria-hidden="true" /></button></div>}
          <p className={styles.srOnly} aria-live="polite">{visible[current]?.name} selected</p>
        </div> : <div className={styles.empty}><h2>No matching layouts</h2><p>Try another document type or clear your filters.</p><button className={styles.secondaryButton} type="button" onClick={() => { setQuery(""); setCategory("ALL"); setDocumentType("RESUME"); setShortlisted(false); }}>Reset filters</button></div>}
      </div>
    </section>
    <section className={`${styles.container} ${styles.catalogSection}`} aria-labelledby="browse-templates">
      <div className={styles.catalogToolbar}>
        <h2 id="browse-templates">Browse all templates</h2>
        <div className={styles.catalogActions}>
          <button className={styles.control} type="button" aria-pressed={shortlisted} onClick={() => { setShortlisted(!shortlisted); setActiveIndex(0); }}><Bookmark size={17} aria-hidden="true" />Shortlist{saved.length ? ` (${saved.length})` : ""}</button>
          <label className={styles.srOnly} htmlFor="template-sort">Sort templates</label><select className={styles.control} id="template-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Most popular</option><option value="name">Sort by name</option></select>
          <div className={styles.viewSwitch} role="group" aria-label="Gallery view"><button type="button" aria-label="Show grid" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={18} /></button><button type="button" aria-label="Show list" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /></button></div>
        </div>
      </div>
      <ul className={styles.catalogGrid} data-view={view}>{visible.map(template => <li key={template.id} data-public-reveal>
        <button type="button" className={styles.catalogPreview} onClick={event => openPreview(template, event.currentTarget)}><div className={styles.catalogPaper}><Paper template={template} priority={displayed.some(item => item.template.id === template.id)} /></div><h3>{template.name}</h3><span className={styles.textLink}>Preview template<ArrowUpRight size={14} aria-hidden="true" /></span></button>
        <button className={styles.saveTemplate} type="button" aria-label={`${saved.includes(template.id) ? "Remove" : "Save"} ${template.name} ${saved.includes(template.id) ? "from" : "to"} shortlist`} aria-pressed={saved.includes(template.id)} onClick={() => toggle(template.id)}><Bookmark size={18} aria-hidden="true" /></button>
      </li>)}</ul>
      <p className={styles.catalogNote}>A4 proportions · Illustrative resume content{!templates.length ? " · Catalog previews" : ""}</p>
    </section>
    <section className={styles.galleryClosing}><div className={styles.container}><h2>A layout for your next move.</h2><Link href="/register" className={styles.textLink}>Create your resume<ArrowUpRight size={18} aria-hidden="true" /></Link></div></section>
    <Dialog.Root open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}>
      <Dialog.Portal><Dialog.Overlay className={styles.previewOverlay} /><Dialog.Content className={styles.previewDialog} aria-modal="true" onCloseAutoFocus={event => { event.preventDefault(); lastPreviewButton.current?.focus(); }}>
        <div className={styles.previewCopy}><Dialog.Title>{preview?.name}</Dialog.Title><Dialog.Description>{preview?.description} Preview uses illustrative content and A4 proportions.</Dialog.Description><Link className={styles.button} href={preview && !preview.previewAsset ? `/templates/${encodeURIComponent(preview.id)}` : "/register"}>{preview?.previewAsset ? "Create your resume" : "View template"}<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        {preview && <div className={styles.largePaper}><Paper template={preview} priority /></div>}
        <Dialog.Close className={styles.previewClose} aria-label="Close preview"><X size={20} aria-hidden="true" /></Dialog.Close>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
