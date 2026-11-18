"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { BarChart3, BriefcaseBusiness, Check, FileText, FolderKanban, GraduationCap, Layers3 } from "lucide-react";
import { ASSEMBLY_KEYS, DEFAULT_ASSEMBLY_REGIONS, assemblyCurve, assemblyCurvePoint, assemblyLayout, assemblyPort, assemblyRegionRect, assemblyState, assemblyView, type AssemblyRegions } from "@/lib/career-assembly";
import { homeTemplate } from "@/lib/home-templates";
import type { StoryCopy } from "@/lib/story-i18n";
import styles from "./CareerAssembly.module.css";

export type AssemblyHandle = { update: (p: number, width: number, height: number, regions?: AssemblyRegions) => void };
type Props = { copy: StoryCopy; selected: string };
const ICONS = [FileText, BriefcaseBusiness, FolderKanban, BarChart3, GraduationCap];
const COPY = {
  en: { labels: ["Professional summary", "Work experience", "Projects", "Skills", "Education"], placed: "Placed", placing: "Placing", next: "Next",
    title: "Live assembly", adding: (name: string) => "Placing " + name.toLowerCase(), complete: "Assembly complete",
    count: (count: number) => count + " of 5 sections placed", links: "Source links preserved", words: "Your words stay unchanged",
    combined: "Source links and wording preserved.", template: "Selected template", picker: "Resume sections", inspect: (name: string) => "Inspect " + name },
  bn: { labels: ["পেশাগত সারাংশ", "কাজের অভিজ্ঞতা", "প্রজেক্ট", "দক্ষতা", "শিক্ষা"], placed: "বসেছে", placing: "বসছে", next: "পরের ধাপ",
    title: "লাইভ অ্যাসেম্বলি", adding: (name: string) => name + " বসছে", complete: "অ্যাসেম্বলি সম্পন্ন",
    count: (count: number) => "৫টির মধ্যে " + ["০","১","২","৩","৪","৫"][count] + "টি সেকশন বসেছে", links: "সোর্স লিংক সংরক্ষিত", words: "আপনার লেখা অপরিবর্তিত",
    combined: "সোর্স লিংক ও লেখা সংরক্ষিত।", template: "নির্বাচিত টেমপ্লেট", picker: "রেজুমের সেকশন", inspect: (name: string) => name + " দেখুন" },
};

export const CareerAssembly = forwardRef<AssemblyHandle, Props>(function CareerAssembly({ copy, selected }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<number, HTMLButtonElement>()), paths = useRef(new Map<number, SVGPathElement>()), ports = useRef(new Map<number, HTMLElement>());
  const status = useRef<HTMLDivElement>(null), active = useRef<HTMLSpanElement>(null), fill = useRef<HTMLSpanElement>(null), bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLParagraphElement>(null), percent = useRef<HTMLSpanElement>(null), landing = useRef<HTMLDivElement>(null), traveler = useRef<HTMLDivElement>(null), picker = useRef<HTMLSelectElement>(null);
  const [inspected, setInspected] = useState<number | null>(null);
  const previous = useRef({ p: -1, width: 0, height: 0, inspected: -2, locale: "", regions: DEFAULT_ASSEMBLY_REGIONS });
  const text = COPY[copy.locale], template = homeTemplate(selected);

  useImperativeHandle(ref, () => ({
    update(p, width, height, regions = DEFAULT_ASSEMBLY_REGIONS) {
      const element = root.current;
      if (!element) return;
      const state = assemblyState(p);
      element.dataset.unit = p.toFixed(4);
      element.dataset.placed = String(state.count);
      element.dataset.activeSection = state.complete ? "complete" : ASSEMBLY_KEYS[state.active];
      element.style.opacity = state.copy.toFixed(4);
      element.style.visibility = state.copy > .001 ? "visible" : "hidden";
      element.inert = state.copy < .98;
      element.setAttribute("aria-hidden", state.copy < .98 ? "true" : "false");
      if (state.presence <= .001) return;
      const last = previous.current;
      if (Math.abs(last.p-p) < .0001 && last.width === width && last.height === height && last.inspected === (inspected ?? -1) && last.locale === copy.locale && last.regions === regions) return;
      previous.current = { p, width, height, inspected: inspected ?? -1, locale: copy.locale, regions };
      const layout = assemblyLayout(width, height), view = assemblyView(width, height, p);
      element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : layout.wide ? "wide" : "tablet";
      const place = (node: HTMLElement | null, rect: {x:number;y:number;width:number;height:number}) => {
        if (!node) return;
        node.style.width = rect.width.toFixed(2) + "px"; node.style.height = rect.height.toFixed(2) + "px";
        node.style.transform = "translate3d(" + rect.x.toFixed(2) + "px," + rect.y.toFixed(2) + "px,0)";
      };
      place(status.current, layout.status);
      if (picker.current) { picker.current.style.left = layout.gutter + "px"; picker.current.style.top = layout.pickerTop + "px"; picker.current.style.width = (width-layout.gutter*2) + "px"; picker.current.value = String(inspected ?? state.active); }
      const shown = inspected ?? state.active;
      element.dataset.inspected = ASSEMBLY_KEYS[shown];
      ASSEMBLY_KEYS.forEach((key, index) => {
        const card = cards.current.get(index), rect = layout.cards[index]!, phase = index < state.count ? "placed" : !state.complete && index === state.active ? "placing" : "next";
        place(card ?? null, rect);
        if (card) {
          card.dataset.phase = phase; card.setAttribute("aria-pressed", inspected === index ? "true" : "false");
          const label = card.querySelector<HTMLElement>("[data-assembly-phase]");
          const word = phase === "placed" ? text.placed : phase === "placing" ? text.placing : text.next;
          if (label && label.textContent !== word) label.textContent = word;
          const option = picker.current?.options[index]; if (option && option.textContent !== text.labels[index] + " — " + word) option.textContent = text.labels[index] + " — " + word;
        }
        const region = regions[index] ?? DEFAULT_ASSEMBLY_REGIONS[index]!, port = assemblyPort(region, view);
        const from = { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
        const path = paths.current.get(index), dot = ports.current.get(index);
        if (path) {
          path.setAttribute("d", assemblyCurve(from, port));
          path.dataset.phase = phase;
          path.style.visibility = !layout.portrait && phase !== "next" ? "visible" : "hidden";
        }
        if (dot) { dot.style.transform = "translate3d(" + port.x.toFixed(2) + "px," + port.y.toFixed(2) + "px,0) translate(-50%,-50%)"; dot.style.visibility = phase !== "next" ? "visible" : "hidden"; dot.dataset.phase = phase; }
        if (index === shown) place(landing.current, assemblyRegionRect(region, view));
        if (index === state.active && traveler.current) {
          const amount = state.sections[index]!, point = assemblyCurvePoint(from, port, amount);
          traveler.current.style.transform = "translate3d(" + point.x.toFixed(2) + "px," + point.y.toFixed(2) + "px,0) translate(-50%,-50%) rotate(" + (-7 + 10*amount).toFixed(2) + "deg)";
          traveler.current.style.opacity = (Math.sin(Math.PI*amount) * (state.complete || layout.portrait ? 0 : 1)).toFixed(4);
        }
      });
      if (landing.current) { landing.current.style.opacity = state.complete && inspected === null ? "0" : "1"; landing.current.dataset.phase = state.complete || shown < state.count ? "placed" : "placing"; }
      const value = Math.round(state.progress * 100);
      const activity = state.complete ? text.complete : text.adding(text.labels[state.active]!);
      if (active.current && active.current.textContent !== activity) active.current.textContent = activity;
      if (percent.current && percent.current.textContent !== value + "%") percent.current.textContent = value + "%";
      if (count.current && count.current.textContent !== text.count(state.count)) count.current.textContent = text.count(state.count);
      if (fill.current) fill.current.style.transform = "scaleX(" + state.progress.toFixed(5) + ")";
      if (bar.current && bar.current.getAttribute("aria-valuenow") !== String(value)) bar.current.setAttribute("aria-valuenow", String(value));
    },
  }), [copy.locale, inspected, text]);

  return (
    <div ref={root} className={styles.assembly} data-assembly data-selected-template={template.slug} style={{opacity:0,visibility:"hidden"}} inert aria-hidden="true" role="group" aria-label={text.title}>
      <svg className={styles.connections} width="100%" height="100%" aria-hidden="true">
        {ASSEMBLY_KEYS.map((key,index) => <path key={key} data-assembly-route={key} ref={(node) => { if(node)paths.current.set(index,node);else paths.current.delete(index); }} />)}
      </svg>
      <div className={styles.queue} role="group" aria-label={text.picker}>
        {ASSEMBLY_KEYS.map((key,index) => {const Icon=ICONS[index]!;return (
          <button key={key} type="button" className={styles.card} data-assembly-card={key} data-phase="next" data-ui aria-label={text.inspect(text.labels[index]!)} aria-pressed={inspected===index} onClick={() => setInspected(inspected===index?null:index)} ref={(node) => {if(node)cards.current.set(index,node);else cards.current.delete(index);}}>
            <Icon className={styles.cardIcon} size={24} aria-hidden="true" /><span className={styles.cardName}>{text.labels[index]}</span>
            <span className={styles.phase}><Check size={17} className={styles.done} aria-hidden="true" /><span data-assembly-phase>{text.next}</span></span>
          </button>
        );})}
      </div>
      <select ref={picker} className={styles.picker} defaultValue="0" aria-label={text.picker} onChange={(event) => setInspected(Number(event.target.value))} data-ui>
        {ASSEMBLY_KEYS.map((key,index)=><option key={key} value={index}>{text.labels[index]}</option>)}
      </select>
      <div ref={landing} className={styles.landing} data-assembly-landing aria-hidden="true" />
      <div ref={traveler} className={styles.traveler} aria-hidden="true"><Layers3 size={21} /></div>
      {ASSEMBLY_KEYS.map((key,index)=><i key={key} className={styles.port} data-assembly-port={key} ref={(node)=>{if(node)ports.current.set(index,node);else ports.current.delete(index);}} aria-hidden="true" />)}
      <div ref={status} className={styles.status} data-assembly-status data-ui>
        <h3>{text.title}</h3>
        <div className={styles.current}><Layers3 size={24} aria-hidden="true" /><span ref={active}>{text.adding(text.labels[0]!)}</span></div>
        <div className={styles.progressRow}><div ref={bar} className={styles.progress} role="progressbar" aria-label={text.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span ref={fill} /></div><span ref={percent}>0%</span></div>
        <p ref={count} className={styles.count} aria-live="polite">{text.count(0)}</p>
        <div className={styles.assurances}><p><Check size={18} aria-hidden="true" />{text.links}</p><p><Check size={18} aria-hidden="true" />{text.words}</p></div>
        <p className={styles.compactProof}><Check size={15} aria-hidden="true" />{text.combined}</p>
        <div className={styles.template}><FileText size={26} aria-hidden="true" /><p><strong>{template.name}</strong><span>{text.template}</span></p></div>
      </div>
    </div>
  );
});
