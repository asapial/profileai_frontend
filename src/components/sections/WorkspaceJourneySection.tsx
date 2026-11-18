"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, FileText, Link2, MessagesSquare, ScanSearch } from "lucide-react";
import styles from "./ReadingSections.module.css";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

const stages = [
  { id:"resume", title:"Resume", copy:"One evidence-grounded master story.", icon:FileText },
  { id:"alignment", title:"Alignment", copy:"See which proof matters for the role.", icon:ScanSearch },
  { id:"applications", title:"Applications", copy:"Keep every opportunity and version connected.", icon:BriefcaseBusiness },
  { id:"interviews", title:"Interviews", copy:"Carry the same truth into STAR stories.", icon:MessagesSquare },
] as const;

export function WorkspaceJourneySection() {
  const [selected,setSelected]=useState(0);
  const tabs=useRef<(HTMLButtonElement|null)[]>([]);
  const current=stages[selected]!;
  return (
    <section id="career-workspace" className={`${styles.section} ${sectionEnvironmentClass} static-section workspace-section`} aria-labelledby="workspace-title" data-reading-section="workspace">
      <SectionEnvironment kind="workspace"/>
      <div className={styles.split}>
        <div className={styles.intro}>
          <h2 id="workspace-title" className={styles.heading}>One story.<br/>Every next move.</h2>
          <p className={styles.lede}>Your resume is not the end. The same verified career data follows the job search from discovery to conversation.</p>
          <Link className="story-text-link" href="/dashboard">Explore the workspace <ArrowUpRight size={18} aria-hidden/></Link>
          <div className={styles.sourceStamp}><Link2 size={20} aria-hidden/><span>One source.<br/><strong>Carried through every stage.</strong></span></div>
        </div>
        <div className={`${styles.panel} workspace-flow`} data-ui>
          <div className={styles.panelHeader}><span>Your career workspace</span><span className={styles.quiet}>Illustrative workflow</span></div>
          <div className={styles.journeyTabs} role="tablist" aria-label="Explore the career workspace" onKeyDown={event=>{
            if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
            event.preventDefault(); const next=event.key==="Home"?0:event.key==="End"?3:(selected+(event.key==="ArrowRight"?1:3))%4;
            setSelected(next);tabs.current[next]?.focus();
          }}>
            {stages.map(({id,title,icon:Icon},index)=><button key={id} ref={el=>{tabs.current[index]=el;}} id={`workspace-tab-${id}`} role="tab" type="button" aria-selected={selected===index} aria-controls="workspace-panel" tabIndex={selected===index?0:-1} onClick={()=>setSelected(index)}><Icon size={23} aria-hidden/><span>{title}</span></button>)}
          </div>
          <div key={current.id} className={styles.journeyPanel} role="tabpanel" id="workspace-panel" aria-labelledby={`workspace-tab-${current.id}`} tabIndex={0}>
            <div className={styles.demoTitle}><current.icon size={22} aria-hidden/><div><h3>{current.title}</h3><p>{current.copy}</p></div></div>
            {selected===0&&<div className={styles.draft}><div className={styles.docHeading}><FileText size={20} aria-hidden/><strong>Master resume</strong><span className={styles.status}>Evidence linked</span></div><h4>Customer Dashboard</h4><p>Developed reusable <mark>React components</mark>, improving load performance by <mark>31%</mark>.</p><div className={styles.sourceStrip}><Link2 size={17} aria-hidden/>Lighthouse report · Q3</div></div>}
            {selected===1&&<div className={styles.requirements}><div><strong>Frontend Engineer</strong><span className={styles.quiet}>Role alignment</span></div>{[["React / Next.js","Strong match","matched"],["System design","Needs proof","missing"],["Mentoring juniors","Related work","partial"]].map(([label,status,tone])=><div key={label}><span>{label}</span><span className={styles.status} data-tone={tone}>{status}</span></div>)}<p className={styles.small}>Evidence coverage, never hiring probability.</p></div>}
            {selected===2&&<div className={styles.draft}><div className={styles.docHeading}><BriefcaseBusiness size={20} aria-hidden/><strong>Frontend Engineer</strong></div><p className={styles.status}>Draft · Your review comes next</p><h4>Your application, connected</h4><p>The role, resume version and source evidence stay together. You choose what to send.</p><div className={styles.sourceStrip}><Link2 size={17} aria-hidden/>Master resume · Customer Dashboard</div></div>}
            {selected===3&&<div className={styles.interview}><div><span>Situation</span><p>A customer dashboard needed faster loading.</p></div><div><span>Action</span><p>Reworked lazy loading and reusable React components.</p></div><div><span>Result</span><p>LCP improved from 2.9s to 2.0s.</p></div><div className={styles.sourceStrip}><Link2 size={17} aria-hidden/>The same Lighthouse report · Q3</div></div>}
          </div>
          <div className={styles.panelFooter}><Check size={17} aria-hidden/>Same evidence. Your decisions.</div>
        </div>
      </div>
    </section>
  );
}
