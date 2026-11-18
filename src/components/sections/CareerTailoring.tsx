"use client";

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { BarChart3, Check, FileText, Link2, Sparkles } from "lucide-react";
import { alignmentLayout } from "@/lib/career-alignment";
import { TAILORING_ORIGINAL, TAILORING_PARTS, tailoringCenter, tailoringCurve, tailoringLayout, tailoringState, type TailoringDecision, type TailoringRect } from "@/lib/career-tailoring";
import type { NeuralPoint } from "@/lib/career-neural";
import type { GalleryRect } from "@/lib/career-gallery";
import type { StoryCopy } from "@/lib/story-i18n";
import styles from "./CareerTailoring.module.css";

export type TailoringHandle = {
  update: (p: number, width: number, height: number, outgoing: { core: NeuralPoint; document: NeuralPoint; documentRect?: GalleryRect } | undefined) => void;
};

type Props = { copy: StoryCopy; decision: TailoringDecision; onDecide: (decision: "accepted" | "rejected") => void };

export const CareerTailoring = forwardRef<TailoringHandle, Props>(function CareerTailoring({ copy, decision, onDecide }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLDivElement>(null);
  const evidence = useRef<HTMLDivElement>(null);
  const suggestion = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const routes = useRef(new Map<string, SVGPathElement>());
  const ports = useRef(new Map<string, HTMLElement>());
  const picker = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState<"original" | "evidence">("original");
  const previous = useRef({ p: -1, width: 0, height: 0, input: "" });
  const id = useId();
  const bn = copy.locale === "bn";

  useImperativeHandle(ref, () => ({
    update(p, width, height, outgoing) {
      const element = root.current;
      if (!element) return;
      const state = tailoringState(p);
      element.dataset.unit = p.toFixed(4);
      element.style.opacity = (Math.min(1, state.arrive * 2.5) * (1 - state.depart)).toFixed(4);
      element.style.visibility = state.presence > .001 ? "visible" : "hidden";
      element.inert = state.presence < .98;
      element.setAttribute("aria-hidden", state.presence < .98 ? "true" : "false");
      if (state.presence <= .001) return;
      const last = previous.current;
      if (Math.abs(last.p - p) < .0001 && last.width === width && last.height === height && last.input === input) return;
      previous.current = { p, width, height, input };
      const layout = tailoringLayout(width, height);
      const prior = alignmentLayout(width, height);
      element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : width < 1100 ? "tablet" : "wide";
      element.dataset.compact = layout.compact ? "1" : "0";
      element.style.setProperty("--tailoring-copy", state.copy.toFixed(4));
      element.style.setProperty("--tailoring-surface", state.surface.toFixed(4));
      element.style.setProperty("--tailoring-lines", state.lines.toFixed(4));
      const centers = new Map<string, { center: NeuralPoint; scaleX: number; scaleY: number }>();
      const inputTarget = outgoing?.core ?? layout.core;
      const place = (key: string, node: HTMLDivElement | null, rect: TailoringRect, start: NeuralPoint, end: NeuralPoint, initialScale: number) => {
        const rest = tailoringCenter(rect);
        const center = {
          x: start.x + (rest.x - start.x) * state.arrive + (end.x - rest.x) * state.depart,
          y: start.y + (rest.y - start.y) * state.arrive + (end.y - rest.y) * state.depart,
        };
        const initial = initialScale + (1 - initialScale) * state.arrive;
        const target = key === "suggestion" ? outgoing?.documentRect : undefined;
        const scaleX = initial * (1 + ((target ? target.width / rect.width : .34) - 1) * state.depart);
        const scaleY = initial * (1 + ((target ? target.height / rect.height : .34) - 1) * state.depart);
        centers.set(key, { center, scaleX, scaleY });
        if (!node) return;
        node.style.width = `${rect.width}px`;
        node.style.height = `${rect.height}px`;
        node.style.transform = `translate3d(${center.x.toFixed(2)}px,${center.y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scaleX.toFixed(4)},${scaleY.toFixed(4)})`;
      };
      const sourceStart = layout.portrait ? tailoringCenter(layout.evidence) : { x: prior.cards[0]!.x - prior.cardWidth / 2, y: prior.cards[2]!.y };
      place("original", original.current, layout.original, { ...tailoringCenter(layout.original), y: layout.original.y + layout.original.height / 2 + 24 }, inputTarget, .92);
      place("evidence", evidence.current, layout.evidence, sourceStart, inputTarget, .48);
      place("suggestion", suggestion.current, layout.suggestion, tailoringCenter(prior.panel), outgoing?.document ?? tailoringCenter(layout.suggestion), .84);
      const corePoint = { x: layout.core.x + (inputTarget.x - layout.core.x) * state.depart, y: layout.core.y + (inputTarget.y - layout.core.y) * state.depart };
      const coreScale = (.5 + .5 * state.arrive) * (1 - .6 * state.depart);
      if (core.current) {
        core.current.style.width = `${layout.diameter}px`;
        core.current.style.height = `${layout.diameter}px`;
        core.current.style.transform = `translate3d(${corePoint.x.toFixed(2)}px,${corePoint.y.toFixed(2)}px,0) translate(-50%,-50%) scale(${coreScale.toFixed(4)})`;
      }
      const points = new Map<string, NeuralPoint>();
      for (const [key, point] of Object.entries(layout.ports)) {
        let center: NeuralPoint;
        let scaleX: number, scaleY: number;
        let rest: NeuralPoint;
        if (["original", "evidence", "suggestion"].includes(key)) {
          ({ center, scaleX, scaleY } = centers.get(key)!);
          rest = tailoringCenter(layout[key as "original" | "evidence" | "suggestion"]);
        } else { center = corePoint; scaleX = coreScale; scaleY = coreScale; rest = layout.core; }
        const projected = { x: center.x + (point.x - rest.x) * scaleX, y: center.y + (point.y - rest.y) * scaleY };
        points.set(key, projected);
        const port = ports.current.get(key);
        if (port) port.style.transform = `translate3d(${projected.x.toFixed(2)}px,${projected.y.toFixed(2)}px,0) translate(-50%,-50%)`;
      }
      for (const [key, from, to] of [["original", "original", "originalIn"], ["evidence", "evidence", "evidenceIn"], ["suggestion", "output", "suggestion"]]) {
        const path = routes.current.get(key!);
        if (!path) continue;
        path.setAttribute("d", tailoringCurve(points.get(from!)!, points.get(to!)!, layout.portrait));
        path.style.visibility = layout.portrait && (key === "original" && (!layout.compact || input !== "original") || layout.compact && input === "original" && key === "evidence") ? "hidden" : "visible";
      }
      for (const [key, node] of [["original", original.current], ["evidence", evidence.current]] as const) if (node) {
        const hidden = layout.compact && key !== input;
        node.style.visibility = hidden ? "hidden" : "inherit";
        node.setAttribute("aria-hidden", hidden ? "true" : "false");
      }
      if (picker.current) { picker.current.style.left = `${layout.gutter + 10}px`; picker.current.style.top = `${layout.top + 8}px`; }
    },
  }), [input]);

  const registerPort = (key: string) => (node: HTMLElement | null) => { if (node) ports.current.set(key, node); else ports.current.delete(key); };
  const status = decision === "accepted" ? copy.tailor.statusAccepted : decision === "rejected" ? copy.tailor.statusRejected : bn ? "নমুনা · প্রতিটি পরিবর্তন আপনার নিয়ন্ত্রণে।" : "Illustrative example · You review every change.";

  return (
    <div ref={root} className={styles.tailoring} role="group" aria-label={bn ? "প্রমাণ থেকে টেইলরড লেখা" : "Review an evidence-grounded writing suggestion"} data-tailoring data-decision={decision} data-input={input} style={{ opacity: 0, visibility: "hidden" }} inert aria-hidden="true">
      <svg className={styles.connections} width="100%" height="100%" aria-hidden="true">
        {["original", "evidence", "suggestion"].map((key) => <path key={key} data-tailoring-route={key} ref={(node) => { if (node) routes.current.set(key, node); else routes.current.delete(key); }} />)}
      </svg>
      <div ref={original} id={`${id}-original`} className={`${styles.panel} ${styles.original}`} data-panel="original" data-ui>
        <div className={styles.content}>
          <p className={styles.kicker}>{copy.tailor.kickerOriginal}</p><h3>{copy.tailor.titleOriginal}</h3>{/* taste-skill-ignore: Context label inside the user-approved product interface. */}
          <blockquote>{TAILORING_ORIGINAL}</blockquote>
        </div>
      </div>
      <div ref={evidence} id={`${id}-evidence`} className={`${styles.panel} ${styles.evidence}`} data-tailoring-evidence data-ui>
        <div className={styles.content}>
          <header className={styles.evidenceHeader}><h3>{bn ? "সোর্স প্রমাণ" : "Source evidence"}</h3><span className={styles.phoneVerified}><Check size={14} />{bn ? "যাচাইকৃত" : "Verified"}</span></header>
          <div className={styles.sourceRows}>
            <div><FileText size={22} aria-hidden="true" /><p><span>React components</span><small>Customer Dashboard</small></p></div>
            <div><BarChart3 size={22} aria-hidden="true" /><p><span>Load performance</span><small>Improved 31%</small></p></div>
          </div>
          <span className={styles.verified}><Check size={17} aria-hidden="true" />{bn ? "উৎস যাচাইকৃত" : "Source verified"}</span>
        </div>
      </div>
      <div ref={core} className={styles.core} data-tailoring-core aria-hidden="true"><div><Sparkles size={32} /><strong>AI</strong></div><p>{copy.orb.label}</p></div>
      <div ref={suggestion} className={`${styles.panel} ${styles.suggestion}`} data-panel="suggestion" data-ui>
        <div className={styles.content}>
          <header className={styles.suggestionHeader}><div><p className={styles.kicker}>{copy.tailor.kickerSuggestion}</p><h3>{copy.tailor.titleSuggestion}</h3></div><span className={`${styles.verified} ${decision === "accepted" ? styles.acceptChip : ""}`}><Check size={17} aria-hidden="true" />{decision === "accepted" ? bn ? "প্রিভিউতে যোগ হয়েছে" : "Added to preview" : bn ? "প্রমাণ সংযুক্ত" : "Evidence linked"}</span></header>{/* taste-skill-ignore: Approved product context, not a page eyebrow. */}
          <blockquote>{TAILORING_PARTS.map((part, index) => part.fresh ? <mark key={index} className={styles.diffNew}>{part.text}</mark> : <span key={index}>{part.text}</span>)}</blockquote>
          <p className={styles.legend}><Link2 size={18} aria-hidden="true" /><span>{copy.tailor.legend}</span></p>
          <div className={styles.reviewFooter}>
            <div className={styles.reviewActions}>
              <button type="button" aria-pressed={decision === "rejected"} onClick={() => onDecide("rejected")}>{decision === "rejected" ? copy.tailor.rejectKept : copy.tailor.reject}</button>
              <button type="button" aria-pressed={decision === "accepted"} onClick={() => onDecide("accepted")}><Check size={20} aria-hidden="true" />{decision === "accepted" ? copy.tailor.accepted : copy.tailor.accept}</button>
            </div>
            <p className={styles.reviewStatus} aria-live="polite">{status}</p>
          </div>
        </div>
      </div>
      <div ref={picker} className={styles.inputPicker} role="group" aria-label={bn ? "ইনপুট দেখুন" : "View the original wording or its source evidence"} data-ui>
        <button type="button" aria-pressed={input === "original"} aria-controls={`${id}-original`} onClick={() => setInput("original")}>{copy.tailor.kickerOriginal}</button>
        <button type="button" aria-pressed={input === "evidence"} aria-controls={`${id}-evidence`} onClick={() => setInput("evidence")}>{bn ? "সোর্স প্রমাণ" : "Source evidence"}</button>
      </div>
      {Object.keys(tailoringLayout(1440, 900).ports).map((key) => <i key={key} className={styles.port} data-tailoring-port={key} ref={registerPort(key)} aria-hidden="true" />)}
    </div>
  );
});
