"use client";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { sceneNodes, sceneConnections, type SceneFrame, type ScenePhase } from "@/lib/career-scene";

const initial: SceneFrame = {phase:"hero",previous:"hero",local:0};
export function CareerFallback({frame, initialPhase}:{frame?:MotionValue<SceneFrame>;initialPhase?:ScenePhase}) {
  const root=useRef<SVGSVGElement>(null);
  useEffect(()=>{
    if(!frame || !root.current)return;
    const groups=Array.from(root.current.querySelectorAll<SVGGElement>('[data-core-node]'));
    const lines=Array.from(root.current.querySelectorAll<SVGPathElement>('[data-core-line]'));
    const paint=(value:SceneFrame)=>{
      const nodes=sceneNodes(value);
      root.current?.querySelector("[data-core-paper]")?.setAttribute("opacity",String(value.phase==="hero"?1-value.local:value.phase==="finalCta"?value.local:0));
      groups.forEach((group,i)=>{
        const n=nodes[i];
        group.setAttribute('transform',`translate(${n.x} ${n.y})`);
        group.setAttribute('opacity',String(n.opacity));
        group.querySelectorAll('rect').forEach(rect=>{rect.setAttribute('width',String(n.w));rect.setAttribute('height',String(n.h));});
        const text=group.querySelectorAll('text');
        [n.label,n.title,n.detail].forEach((word,j)=>{
          text[j].textContent=word;
          text[j].setAttribute('y',String(j===0?15:j===1?n.h*.5+5:n.h-9));
          text[j].setAttribute('font-size',String(Math.min(j===0?8:j===1?14:9,(n.w-24)/Math.max(word.length,1)*1.7)));
        });
      });
      const connections=sceneConnections(value.phase);
      lines.forEach((line,i)=>{
        const pair=connections[i];
        if(!pair){line.setAttribute('opacity','0');return;}
        const a=nodes[pair[0]],b=nodes[pair[1]];
        const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
        line.setAttribute('d',`M${ax},${ay} C${ax},${(ay+by)/2} ${bx},${(ay+by)/2} ${bx},${by}`);
        line.setAttribute('opacity',String(value.phase==='hero'?value.local*.5:.55));
        line.style.strokeDasharray='1';
        line.style.strokeDashoffset=String(1-Math.min(1,value.local*2));
      });
    };
    paint(frame.get());return frame.on('change',paint);
  },[frame]);
  return <svg ref={root} className="career-six-layers" viewBox="0 0 520 440" aria-hidden="true" focusable="false">
    <rect data-core-paper="" className="career-node-paper" x="106" y="12" width="308" height="392" rx="11" opacity={!initialPhase || initialPhase==="finalCta" ? 1 : 0}/>
    {Array.from({length:5},(_,i)=><path key={`line-${i}`} data-core-line="" pathLength="1" className="career-node-connection" fill="none" />)}
    {sceneNodes(initialPhase ? {phase:initialPhase,previous:initialPhase,local:1} : initial).map((node,i)=><g key={i} data-core-node={i} transform={`translate(${node.x} ${node.y})`}>
      <rect x="3" y="5" width={node.w} height={node.h} rx="8" className="career-node-depth" />
      <rect width={node.w} height={node.h} rx="8" className="career-node-face" />
      <text x="12" y="15" fontSize="8" className="career-node-label">{node.label}</text>
      <text x="12" y={node.h*.5+5} fontSize="14" className="career-node-title">{node.title}</text>
      <text x="12" y={node.h-9} fontSize="9" className="career-node-detail">{node.detail}</text>
    </g>)}
  </svg>;
}
