"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, Check, FileText, ScanSearch } from "lucide-react";
import { useState } from "react";

const STEPS = [
  { title: "Add experience", description: "Bring the work you have actually done into one private evidence bank.", Icon: FileText },
  { title: "Align to a role", description: "See which claims are supported, which need context, and what the role is really asking for.", Icon: ScanSearch },
  { title: "Apply and track", description: "Prepare the right document, record the next action, and keep every opportunity moving.", Icon: BriefcaseBusiness },
] as const;

function StoryFrame({ step }: { step: number }) {
  const item = STEPS[step];
  const reduced = useReducedMotion();
  return (
    <motion.div key={item.title} initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -12 }} transition={{ duration: reduced ? 0 : 0.24 }} className="product-story-frame">
      <div className="product-story-toolbar"><span className="editorial-mark">P</span><strong>Career workspace</strong><span>Example data</span></div>
      <div className="product-story-paper-stack" aria-hidden="true"><i/><i/></div>
      <div className="product-story-paper">
        <span className="product-story-kicker">STEP {step + 1} OF 3</span>
        <div className="product-story-title"><item.Icon size={20}/><h3>{item.title}</h3></div>
        <p>{item.description}</p>
        <div className="product-story-lines"><i/><i/><i/></div>
        <span className="product-story-status"><Check size={14}/> Draft only · never auto-sent</span>
      </div>
    </motion.div>
  );
}

export function ProductStorySection() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  if (reduced) {
    return <section className="product-story reduced"><div className="studio-container"><header><span className="studio-eyebrow">HOW IT COMES TOGETHER</span><h2>One story. Three considered steps.</h2></header><div className="product-story-mobile-list">{STEPS.map((_, index) => <StoryFrame key={index} step={index}/>)}</div></div></section>;
  }
  return (
    <section className="product-story">
      <div className="studio-container product-story-grid">
        <div className="product-story-copy">
          <header><span className="studio-eyebrow">HOW IT COMES TOGETHER</span><h2>One story.<br/>Three considered steps.</h2><p>Move from experience to a role-specific application without losing the facts—or your voice.</p></header>
          <ol>{STEPS.map((item, index) => <motion.li key={item.title} onViewportEnter={() => setActive(index)} viewport={{ amount: 0.6 }} className={active === index ? "active" : ""}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></motion.li>)}</ol>
        </div>
        <div className="product-story-mobile-list">{STEPS.map((_, index) => <StoryFrame key={index} step={index}/>)}</div>
        <div className="product-story-stage"><AnimatePresence mode="wait"><StoryFrame step={active}/></AnimatePresence></div>
      </div>
    </section>
  );
}
