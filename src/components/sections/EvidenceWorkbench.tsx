"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Check, FileText, Link2, ScanSearch, Send } from "lucide-react";
import Link from "next/link";
import styles from "./ReadingSections.module.css";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

const views=[
  {title:"Evidence, attached",copy:"Open any line in the document and the project note, report or outcome it came from is right there.",icon:Link2},
  {title:"Alignment, explained",copy:"Every requirement shows where your evidence matches, where it is missing, or where it needs more proof.",icon:ScanSearch},
  {title:"Ready to send",copy:"Choose a clean A4 document, an editable copy, or a private link to suit your application.",icon:Send},
] as const;

export function EvidenceWorkbench(){
  const [selected,setSelected]=useState(0),tabs=useRef<(HTMLButtonElement|null)[]>([]);
  return <section className={`${styles.section} ${sectionEnvironmentClass} static-section showcase-section`} aria-labelledby="showcase-title" data-reading-section="showcase">
    <SectionEnvironment kind="showcase"/>
    <div className={`${styles.sectionHeading} static-section-heading`}><h2 id="showcase-title" className={styles.heading}>Every claim<br/>in view.</h2><p className={styles.lede}>The evidence behind the story follows you into the document, the role fit, and the export. Nothing appears without a source.</p></div>
    <div className={styles.workbench}>
      <div className={styles.viewTabs} role="tablist" aria-orientation="vertical" aria-label="Explore the product" onKeyDown={event=>{
        if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
        event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?2:(selected+(event.key==="ArrowDown"?1:2))%3;setSelected(next);tabs.current[next]?.focus();
      }}>{views.map(({title,copy,icon:Icon},index)=><button type="button" role="tab" key={title} id={`proof-tab-${index}`} aria-selected={selected===index} aria-controls="proof-panel" tabIndex={selected===index?0:-1} ref={el=>{tabs.current[index]=el;}} onClick={()=>setSelected(index)}><span className={styles.iconTile}><Icon size={25} aria-hidden/></span><span><strong>{title}</strong><span>{copy}</span></span><ArrowUpRight size={18} aria-hidden/></button>)}</div>
      <div className={`${styles.panel} ${styles.workbenchPanel} showcase-frame`} data-ui role="tabpanel" id="proof-panel" aria-labelledby={`proof-tab-${selected}`} tabIndex={0}>
        <div className={styles.panelHeader}><span>{selected===0?"Resume · Senior Frontend":selected===1?"Alignment · Frontend Engineer":"Resume export"}</span><span className={styles.quiet}>Illustrative preview</span></div>
        {selected===0?<><div className={styles.documentSample}><span className={styles.status}><Check size={15} aria-hidden/>Evidence on</span><h3>Work experience</h3><p className={styles.claimLine}>Rebuilt the checkout flow. <mark>LCP improved 31%.</mark></p><p className={styles.claimLine}>Mentored two juniors through their first releases.</p><p className={styles.quiet}>React · TypeScript · Accessible interfaces</p></div><details className={styles.evidenceDisclosure} open><summary><FileText size={21} aria-hidden/><span>Lighthouse report · Q3</span><Link2 size={17} aria-hidden/></summary><blockquote>LCP 2.9s → 2.0s after the lazy-load rework.</blockquote></details></>:
        selected===1?<div className={styles.requirements}>{[["React development","Strong match","matched"],["System design","Needs proof","missing"],["Mentoring juniors","Related work","partial"]].map(([label,status,tone])=><div key={label}><span>{label}</span><span className={styles.status} data-tone={tone}>{status}</span></div>)}<p className={styles.small}>Missing evidence stays visible. Nothing is invented.</p></div>:
        <div className={styles.exportList}>{[["Resume.pdf","Ready"],["Resume.docx","Editable"],["Share link","Private"]].map(([name,status])=><div key={name}><span className={styles.iconTile}>{name==="Share link"?<Link2 size={24} aria-hidden/>:<FileText size={24} aria-hidden/>}</span><strong>{name}</strong><span className={styles.status}>{status}</span></div>)}<Link href="/register" className="story-text-link">Build your own resume <ArrowUpRight size={18} aria-hidden/></Link></div>}
        <div className={styles.panelFooter}><Link2 size={17} aria-hidden/>The source stays with the story.</div>
      </div>
    </div>
  </section>;
}
