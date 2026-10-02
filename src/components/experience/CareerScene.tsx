"use client";
import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent } from "framer-motion";
import { useTheme } from "next-themes";
import { useCareerStory } from "./CareerExperienceProvider";
import { usePointerParallax } from "./usePointerParallax";
import { CareerFallback } from "./CareerFallback";
import { type ScenePhase } from "@/lib/career-scene";
import { CAREER_MOTION } from "@/lib/career-story";
import type { createCareerCore } from "./createCareerCore";

/** One mounted scene, one optional canvas. Docking never remounts its objects. */
export function CareerScene() {
  const {frame,placement,paused}=useCareerStory();
  const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null);
  usePointerParallax(root);
  const engine=useRef<ReturnType<typeof createCareerCore>|null>(null);
  const [phase,setPhase]=useState<ScenePhase>('hero');
  const [isPaused,setIsPaused]=useState(false);
  useMotionValueEvent(paused,"change",setIsPaused);
  const [ready,setReady]=useState(false);
  const {resolvedTheme}=useTheme();
  useEffect(()=>{
    const panel=root.current;
    if(!panel)return;
    panel.closest(".career-story-root")?.setAttribute("data-scene-enhanced", "true");
    const position=(p:ReturnType<typeof placement.get>)=>{
      Object.assign(panel.style,{left:`${p.left}px`,top:`${p.top}px`,width:`${p.width}px`,height:`${p.height}px`,visibility:p.visible?'visible':'hidden'});
      panel.dataset.dock=p.hero?'hero':'chapter';
      panel.dataset.active=String(p.visible);
      engine.current?.setActive(p.visible);
    };
    const scene=(value:ReturnType<typeof frame.get>)=>{panel.dataset.phase=value.phase;setPhase(previous=>previous===value.phase?previous:value.phase);engine.current?.setStory(value);};
    position(placement.get());scene(frame.get());
    const off=[placement.on('change',position),frame.on('change',scene)];
    return()=>off.forEach(fn=>fn());
  },[frame,placement]);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    const media=matchMedia(CAREER_MOTION.desktopQuery);
    let cancelled=false,version=0;
    const clear=()=>{engine.current?.dispose();engine.current=null;setReady(false);};
    const load=async()=>{
      const current=++version;clear();
      const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
      if(!media.matches||connection?.saveData)return;
      try{
        const sceneModule=await import('./createCareerCore');
        if(cancelled||version!==current)return;
        engine.current=sceneModule.createCareerCore(element,clear);
        engine.current.setStory(frame.get());engine.current.setActive(placement.get().visible);
        engine.current.setTheme(document.documentElement.classList.contains('dark'));setReady(true);
      }catch{if(!cancelled&&version===current)clear();}
    };
    const request=requestAnimationFrame(()=>void load());media.addEventListener('change',load);
    return()=>{cancelled=true;version++;cancelAnimationFrame(request);media.removeEventListener('change',load);engine.current?.dispose();engine.current=null;};
  },[frame,placement,paused]);
  useEffect(()=>{engine.current?.setTheme(resolvedTheme==='dark');},[resolvedTheme]);
  const togglePause=()=>{const next=!isPaused;setIsPaused(next);paused.set(next);};
  return <><aside ref={root} className="career-persistent-scene" data-renderer={ready?'webgl':'svg'} data-phase={phase} data-motion={isPaused?"paused":"playing"} aria-label="Career Core product story" style={{visibility:'hidden'}}>
    <div className="career-scene-toolbar"><span>PROFILEAI / CAREER CORE</span></div>
    <div className="career-scene-visual">
      <div className="career-scene-svg"><CareerFallback frame={frame}/></div>
      <div className="career-scene-webgl" ref={host} aria-hidden="true" />
    </div>

  </aside>{phase!=="hero"&&<button className="career-motion-control" type="button" aria-pressed={isPaused} onClick={togglePause}><span aria-hidden="true">{isPaused?"▷":"Ⅱ"}</span>{isPaused?"Resume motion":"Pause motion"}</button>}</>;
}
