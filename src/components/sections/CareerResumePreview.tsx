"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, Check, Download, FileText, Link2, Search, Send, X } from "lucide-react";
import { previewLayout, previewState, previewView } from "@/lib/career-preview";
import { homeTemplate, homeTemplateAsset, homeTemplateSvg } from "@/lib/home-templates";
import type { TailoringDecision } from "@/lib/career-tailoring";
import type { StoryIdentity } from "@/lib/story-identity";
import type { StoryCopy } from "@/lib/story-i18n";
import styles from "./CareerResumePreview.module.css";

export type ResumePreviewHandle = { update: (p: number, width: number, height: number) => void };
type Props = { copy: StoryCopy; selected: string; identity: StoryIdentity; decision: TailoringDecision;
  shareState: "idle" | "copied" | "failed"; onOutput: (action: "download" | "share" | "register") => void; onChangeTemplate: () => void };
const WORDS = {
  en: { proof: "Built from your evidence", ready: "Ready for review", checks: ["5 sections assembled", "Source links preserved", "Your words unchanged"],
    change: "Change template", title: "Your next move", enlarge: "Enlarge preview", preview: "Resume preview", close: "Close preview", share: "Share", paper: "A4 · 210 × 297 mm", compactProof: "All 5 sections assembled" },
  bn: { proof: "আপনার এভিডেন্স থেকে তৈরি", ready: "রিভিউয়ের জন্য প্রস্তুত", checks: ["৫টি সেকশন সম্পন্ন", "সোর্স লিংক সংরক্ষিত", "আপনার লেখা অপরিবর্তিত"],
    change: "টেমপ্লেট বদলান", title: "আপনার পরের ধাপ", enlarge: "বড় করে দেখুন", preview: "রেজুমে প্রিভিউ", close: "প্রিভিউ বন্ধ করুন", share: "শেয়ার", paper: "A4 · ২১০ × ২৯৭ মিমি", compactProof: "৫টি সেকশনই সম্পন্ন" },
};

export const CareerResumePreview = forwardRef<ResumePreviewHandle, Props>(function CareerResumePreview({ copy, selected, identity, decision, shareState, onOutput, onChangeTemplate }, ref) {
  const root = useRef<HTMLDivElement>(null), proof = useRef<HTMLElement>(null), actions = useRef<HTMLElement>(null), paper = useRef<HTMLElement>(null), enlarge = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), last = useRef({ p: -1, width: 0, height: 0 });
  const [expanded, setExpanded] = useState(false);
  const text = WORDS[copy.locale], template = homeTemplate(selected);
  const source = useMemo(() => identity.personal || decision === "accepted" ? homeTemplateSvg(template, identity, decision) : homeTemplateAsset(template), [template, identity, decision]);
  const status = shareState === "copied" ? copy.finalPanel.statusCopied : shareState === "failed" ? copy.finalPanel.statusFailed : identity.personal ? copy.finalPanel.statusPersonal(identity.firstName) : copy.finalPanel.statusIdle;

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);

  useImperativeHandle(ref, () => ({ update(p, width, height) {
    const element = root.current;
    if (!element) return;
    const state = previewState(p);
    element.dataset.unit = p.toFixed(4);
    element.style.opacity = state.copy.toFixed(4);
    element.style.visibility = state.copy > .001 ? "visible" : "hidden";
    element.inert = state.copy < .98;
    element.setAttribute("aria-hidden", state.copy < .98 ? "true" : "false");
    if (state.copy < .5 && dialog.current?.open) dialog.current.close();
    if (state.presence <= .001) return;
    if (Math.abs(last.current.p - p) < .0001 && last.current.width === width && last.current.height === height) return;
    last.current = { p, width, height };
    const layout = previewLayout(width, height), view = previewView(width, height, p);
    element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : layout.wide ? "wide" : "tablet";
    const place = (node: HTMLElement | null, rect: { x: number; y: number; width: number; height: number }) => {
      if (!node) return;
      node.style.width = rect.width.toFixed(2) + "px"; node.style.height = rect.height.toFixed(2) + "px";
      node.style.transform = `translate3d(${rect.x.toFixed(2)}px,${rect.y.toFixed(2)}px,0)`;
    };
    place(proof.current, layout.proof); place(actions.current, layout.actions); place(paper.current, view.frame); place(enlarge.current, layout.enlarge);
  } }), []);

  const openPreview = () => { if (!dialog.current?.open) { dialog.current?.showModal(); setExpanded(true); } };
  return <>
    <div ref={root} className={styles.preview} data-resume-preview data-selected-template={template.slug} data-paper-mm="210x297" style={{ opacity: 0, visibility: "hidden" }} inert aria-hidden="true" role="group" aria-label={text.preview}>
      <figure ref={paper} className={styles.paperAnchor} data-preview-document aria-label={`${identity.name} · ${template.name} · ${text.paper}`}><figcaption className={styles.srOnly}>{text.paper}</figcaption></figure>
      <section ref={proof} className={styles.proof} data-preview-proof data-ui aria-label={text.proof}>
        <h3>{text.proof}</h3>
        <p className={styles.ready}><span><Check size={17} aria-hidden="true" /></span>{text.ready}</p>
        <ul>{text.checks.map((line) => <li key={line}><Check size={18} aria-hidden="true" /><span>{line}</span></li>)}</ul>
        <button type="button" className={styles.change} data-preview-change onClick={onChangeTemplate}><ArrowLeft size={18} aria-hidden="true" />{text.change}</button>
      </section>
      <section ref={actions} className={styles.actions} data-preview-actions data-ui aria-label={text.title}>
        <div className={styles.panelHeading}><h3>{text.title}</h3><p>{template.name} <span aria-hidden="true">·</span> {copy.locale === "bn" ? "A4 · ১ পেইজ" : "A4 · 1 page"}</p></div>
        <p className={styles.compactReady}><Check size={16} aria-hidden="true" />{text.compactProof}</p>
        <div className={styles.primaryActions}>
          <button type="button" className={styles.download} data-preview-output="download" onClick={() => onOutput("download")}><Download size={23} aria-hidden="true" /><span>{copy.finalPanel.rows.download}</span></button>
          <button type="button" className={styles.share} data-preview-output="share" aria-label={copy.finalPanel.rows.share} onClick={() => onOutput("share")}><Link2 size={22} aria-hidden="true" /><span className={styles.fullShare}>{copy.finalPanel.rows.share}</span><span className={styles.smallShare}>{text.share}</span></button>
        </div>
        <div className={styles.nextActions}>
          <button type="button" data-preview-output="register" onClick={() => onOutput("register")}><Send size={18} aria-hidden="true" /><span>{copy.finalPanel.rows.register}</span><ArrowUpRight size={17} aria-hidden="true" /></button>
          <button type="button" data-preview-output="track" onClick={() => onOutput("register")}><BarChart3 size={18} aria-hidden="true" /><span>{copy.finalPanel.rows.track}</span><ArrowUpRight size={17} aria-hidden="true" /></button>
        </div>
        <p className={styles.note} aria-live="polite">{status}</p>
      </section>
      <button ref={enlarge} type="button" className={styles.enlarge} data-preview-enlarge data-ui aria-label={text.enlarge} onClick={openPreview}><Search size={19} aria-hidden="true" /><span>{text.enlarge}</span></button>
    </div>
    <dialog ref={dialog} className={styles.dialog} data-resume-dialog aria-labelledby="resume-preview-title" onClose={() => { setExpanded(false); enlarge.current?.focus({ preventScroll: true }); }} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className={styles.dialogContent}>
        <header className={styles.dialogHeader}><div><h2 id="resume-preview-title">{text.preview}</h2><p>{template.name} · {text.paper}</p></div><button type="button" aria-label={text.close} onClick={() => dialog.current?.close()} autoFocus><X size={22} /></button></header>
        {expanded ? <figure className={styles.fullPaper} data-preview-a4>
          {/* The unwarped catalog image keeps the physical A4 ratio at every zoom. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source} width={794} height={1123} alt={`${identity.name} — ${template.name}. ${text.paper}`} decoding="async" />
        </figure> : null}
        <footer className={styles.dialogFooter}><FileText size={18} aria-hidden="true" /><span>{text.paper}</span><button type="button" onClick={() => onOutput("download")}><Download size={18} aria-hidden="true" />{copy.finalPanel.rows.download}</button></footer>
      </div>
    </dialog>
  </>;
});
