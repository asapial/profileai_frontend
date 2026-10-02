"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowRight, Check, FileText, BriefcaseBusiness, ScanLine } from "lucide-react";
import type { ManagedHomepageSection } from "@/lib/homepage";

const previews = [
  { label: "Resume", icon: FileText },
  { label: "Role insights", icon: ScanLine },
  { label: "Applications", icon: BriefcaseBusiness },
];
export function HeroSection({ content }: { content?: ManagedHomepageSection }) {
  const [tab, setTab] = useState(0);
  const reduced = useReducedMotion();
  return <section className="editorial-hero" aria-label="Your next career chapter">
    <div className="editorial-hero-grid">
      <div className="editorial-intro">
        <p className="editorial-eyebrow"><span/> A LITTLE CLARITY. A LOT OF POSSIBILITY.</p>
        <h1>{content?.title || <>Your next chapter.<br/><em>Beautifully prepared.</em></>}</h1>
        <p className="editorial-lede">{content?.description || "Bring your experience into focus. Create a thoughtful resume, find the right opportunities, and make your next move with confidence."}</p>
        <div className="editorial-actions"><motion.div whileTap={reduced?undefined:{scale:.98}}><Link className="editorial-primary" href={content?.primaryCta?.href || "/register"}>{content?.primaryCta?.label || "Create my resume"}<ArrowUpRight size={17}/></Link></motion.div><a className="editorial-secondary" href="#match">Take a look around <ArrowRight size={16}/></a></div>
        <div className="editorial-assurances"><span><Check size={13}/>Free to start</span><span><Check size={13}/>Your words, your control</span></div>
      </div>
      <div className="editorial-preview">
        <div className="editorial-preview-top"><span className="editorial-mark">P</span><strong>Your career studio</strong><span className="editorial-sample">PRODUCT PREVIEW</span></div>
        <div className="editorial-tabs" role="group" aria-label="Choose a product preview">{previews.map(({label,icon:Icon},i)=><button key={label} type="button" aria-pressed={tab===i} onClick={()=>setTab(i)}><Icon size={14}/>{label}{tab===i&&<motion.span className="editorial-tab-line" layoutId="preview-tab" transition={{duration:reduced?0:.22}}/>}</button>)}</div>
        <div className="editorial-preview-body" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.div key={tab} initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-4}} transition={{duration:reduced?0:.18}}>
          {tab===0?<div className="editorial-resume"><div className="editorial-resume-header"><div><small>YOUR RESUME</small><h2>Alex Morgan</h2><p>Frontend Engineer</p></div><span className="editorial-avatar">AM</span></div><div className="editorial-resume-section"><h3>PROFILE</h3><p>Thoughtful interfaces. Reusable systems.<br/>A considered approach to the details.</p></div><div className="editorial-resume-section"><h3>SELECTED EXPERIENCE</h3><b>Customer dashboard</b><p>Built shared React components and documented how the product team could use them.</p></div><div className="editorial-resume-skills"><span>React</span><span>Component systems</span><span>Documentation</span></div></div>:tab===1?<div className="editorial-insights"><small>A ROLE WORTH EXPLORING</small><h2>Frontend Engineer</h2><p>Example Studio · Product team</p><div><Check size={17}/><span><b>React & component systems</b>Connected to your dashboard project.</span></div><div><ScanLine size={17}/><span><b>Mentoring experience</b>Add an example to support this requirement.</span></div><footer>Evidence coverage, never a hiring probability.</footer></div>:<div className="editorial-applications"><small>YOUR NEXT OPPORTUNITIES</small><h2>A place for every possibility.</h2>{[["Frontend Engineer","Preparing"],["Product Engineer","Applied"],["UI Engineer","Interview"]].map(([role,status])=><div key={role}><BriefcaseBusiness className="editorial-job-mark" size={16}/><span><b>{role}</b><small>Example company</small></span><em>{status}</em></div>)}<footer>Keep the role, your notes and the next step together.</footer></div>}
        </motion.div></AnimatePresence></div>
        <div className="editorial-preview-footer"><span><Check size={13}/>Grounded in your experience</span><span>Illustrative profile</span></div>
      </div>
    </div>
    <div className="editorial-path"><span>YOUR NEXT MOVE,<br/><b>ALL IN ONE PLACE</b></span>{["Write with clarity", "Find your fit", "Stay organized"].map(name=><a href="#features" key={name}><Check size={15}/>{name}<ArrowUpRight size={14}/></a>)}</div>
  </section>;
}
