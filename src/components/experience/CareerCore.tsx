"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useMotionValueEvent } from "framer-motion";
import { useCareerStory } from "./CareerExperienceProvider";
import { CareerFallback } from "./CareerFallback";

/** In-flow controls stay keyboard-reachable, including on short mobile screens. */
export function CareerCore({children,active,onReady}:{children:ReactNode;active:boolean;onReady:(ready:boolean)=>void}) {
  const {heroActive,paused,unfold}=useCareerStory();
  const [isPaused,setPaused]=useState(false),[expanded,setExpanded]=useState(false);
  useMotionValueEvent(paused,"change",setPaused);useMotionValueEvent(unfold,"change",value=>setExpanded(Boolean(value)));
  useEffect(()=>{heroActive.set(active);onReady(true);return()=>{heroActive.set(true);};},[active,heroActive,onReady]);
  return <>
    <div className="career-core-stage" data-career-port="hero">{active ? <div className="career-port-placeholder"><CareerFallback /></div> : children}</div>
    {active&&<div className="career-core-controls">
      <button type="button" aria-pressed={expanded} onClick={()=>unfold.set(!expanded)}>{expanded?'Fold back to resume':'Preview the six layers'} <span aria-hidden="true">↗</span></button>
      <button type="button" aria-pressed={isPaused} onClick={()=>paused.set(!isPaused)}>{isPaused?'Resume motion':'Pause motion'}</button>
    </div>}
  </>;
}
