"use client";
import { useEffect, type RefObject } from "react";
import { useMotionValue } from "framer-motion";
import { useSmoothedScene } from "./useSmoothedScene";
import { sampleStory, clampProgress, type StoryAnchor } from "@/lib/career-story";
import { isScenePhase, type SceneFrame, type ScenePhase } from "@/lib/career-scene";

export type ScenePlacement = { left: number; top: number; width: number; height: number; visible: boolean; hero: boolean };
export function useScrollStory(root: RefObject<HTMLDivElement | null>) {
  const progress = useMotionValue(0);
  const hero = useMotionValue(0);
  const targetFrame = useMotionValue<SceneFrame>({ phase: "hero", previous: "hero", local: 0 });
  const placement = useMotionValue<ScenePlacement>({left:0,top:0,width:0,height:0,visible:false,hero:true});
  const heroActive = useMotionValue(true);
  const unfold = useMotionValue<boolean | null>(null);
  const paused = useMotionValue(false);
  const frame = useSmoothedScene(targetFrame, paused);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let anchors: (StoryAnchor & {node: HTMLElement})[] = [];
    let raf = 0, dirty = true;
    let selected: HTMLElement | null = null;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      raf = 0;
      const scroll = window.scrollY, viewport = window.innerHeight;
      element.setAttribute("data-motion-paused",String(paused.get()));
      if (dirty) {
        anchors = Array.from(element.querySelectorAll<HTMLElement>("[data-story-section]"))
          .filter(node => node.offsetHeight > 0)
          .map(node => ({id:node.dataset.storySection!, top:node.getBoundingClientRect().top + scroll,height:node.offsetHeight,node}));
        dirty = false;
      }
      if (!anchors.length) return;
      progress.set(sampleStory(anchors,scroll,viewport).progress);
      const narrow = innerWidth < 1000;
      const focus = scroll + viewport * (narrow ? .65 : .4);
      let index = 0;
      for (let i=1;i<anchors.length;i++) if (anchors[i].top <= focus) index=i;
      const chapter=anchors[index];
      if (selected !== chapter.node) {
        selected?.removeAttribute("data-story-active");
        selected=chapter.node; selected.setAttribute("data-story-active","true");
      }
      const local=clampProgress((focus - chapter.top) / Math.max(1,chapter.height - viewport * .25));
      chapter.node.style.setProperty("--chapter-progress", String(reduced.matches || paused.get() ? 1 : local));
      const phase: ScenePhase = isScenePhase(chapter.id) ? chapter.id : "privacy";
      let previous: ScenePhase = phase;
      for(let i=index-1;i>=0;i--) if(isScenePhase(anchors[i].id)){previous=anchors[i].id as ScenePhase;break;}
      const home=anchors.find(a=>a.id==="hero");
      const homePort=element.querySelector<HTMLElement>('[data-career-port="hero"]');
      const homeProgress=home ? clampProgress((scroll-home.top)/Math.max(viewport*.45,home.height-viewport)) : 0;
      hero.set(homeProgress);
      const homeRect = homePort?.getBoundingClientRect();
      const inHero = chapter.id === "hero" || Boolean(home && homeRect && homeRect.bottom>85 && homeRect.top<viewport && scroll<home.top+home.height);
      const port = inHero ? homePort : chapter.node.querySelector<HTMLElement>("[data-career-port]");
      const quiet = !isScenePhase(chapter.id);
      let localFrame=inHero ? (unfold.get() === null ? homeProgress : unfold.get() ? 1 : 0) : local;
      if (reduced.matches) localFrame = inHero ? (unfold.get() ? 1 : 0) : 1;
      if (!quiet) targetFrame.set({phase:inHero?"hero":phase,previous:inHero?"hero":reduced.matches ? phase : previous,local:localFrame,manual:inHero && unfold.get()!==null});
      const rect = port?.getBoundingClientRect();
      placement.set({left:rect?.left??0,top:rect?.top??0,width:rect?.width??0,height:rect?.height??0,
        visible:!quiet && Boolean(rect && rect.bottom>85 && rect.top<viewport-30) && (!inHero || heroActive.get()),hero:inHero});
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    const measure=()=>{dirty=true;schedule();};
    const resize=new ResizeObserver(measure);
    resize.observe(element);
    element.querySelectorAll("[data-story-section]").forEach(node=>resize.observe(node));
    const cleanups=[heroActive.on("change",schedule),unfold.on("change",schedule),paused.on("change",schedule)];
    const resumeScroll=()=>unfold.set(null);
    window.addEventListener("wheel",resumeScroll,{passive:true});
    window.addEventListener("touchmove",resumeScroll,{passive:true});
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",measure); reduced.addEventListener("change",measure);
    update();
    return()=>{window.removeEventListener("wheel",resumeScroll);window.removeEventListener("touchmove",resumeScroll);resize.disconnect();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",measure);reduced.removeEventListener("change",measure);cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());};
  },[root,progress,hero,targetFrame,placement,heroActive,unfold,paused]);
  return {progress,hero,frame,placement,heroActive,unfold,paused};
}
