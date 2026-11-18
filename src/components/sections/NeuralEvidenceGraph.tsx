"use client";

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CARDS, clamp01, smoothstep } from "@/lib/career-cinema";
import {
  NEURAL_DEFAULT_INPUT, NEURAL_EDGES, NEURAL_INPUTS, NEURAL_NODES, NEURAL_OUTPUTS,
  neuralFocus, neuralLayout, neuralRoute, sampleNeuralPoints, type NeuralPoint,
} from "@/lib/career-neural";
import type { StoryLocale } from "@/lib/story-i18n";
import styles from "./NeuralEvidenceGraph.module.css";

export type NeuralGraphHandle = {
  update: (p: number, width: number, height: number, anchors: NeuralPoint[], calm: boolean) => void;
};

const OUTPUT_CARDS = NEURAL_OUTPUTS.map((id) => CARDS.find((card) => card.id === id)!);

export const NeuralEvidenceGraph = forwardRef<NeuralGraphHandle, { locale: StoryLocale }>(function NeuralEvidenceGraph({ locale }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, SVGGElement>());
  const edges = useRef(new Map<number, SVGPathElement>());
  const inputs = useRef(new Map<number, HTMLButtonElement>());
  const outputs = useRef(new Map<number, HTMLButtonElement>());
  const labels = useRef(new Map<number, HTMLParagraphElement>());
  const routePath = useRef<SVGPathElement>(null);
  const signalPath = useRef<SVGPathElement>(null);
  const sourcePanel = useRef<HTMLDivElement>(null);
  const mobilePicker = useRef<HTMLDivElement>(null);
  const previous = useRef({ p: -1, width: 0, height: 0, selected: -1 });
  const [selected, setSelected] = useState(NEURAL_DEFAULT_INPUT);
  const route = neuralRoute(selected);
  const activeNodes = new Set(route);
  const evidence = NEURAL_INPUTS[selected]!;
  const gradient = `neural-${useId().replace(/:/g, "")}`;
  const bn = locale === "bn";
  const stageLabels = bn
    ? ["আপনার প্রমাণ", "যাচাইকৃত সংযোগ", "রেজুমের বিভাগ"]
    : ["Your evidence", "Verified connections", "Resume sections"];

  useImperativeHandle(ref, () => ({
    update(p, width, height, anchors, calm) {
      const element = root.current;
      if (!element) return;
      const focus = neuralFocus(p);
      element.dataset.unit = p.toFixed(4);
      element.style.setProperty("--ng-annotations", smoothstep(clamp01((focus - .82) / .18)).toFixed(4));
      element.style.setProperty("--ng-structure", smoothstep(clamp01((focus - .45) / .55)).toFixed(4));
      element.style.opacity = Math.min(1, focus * 2.5).toFixed(4);
      element.style.visibility = focus > .005 ? "visible" : "hidden";
      element.inert = focus < .98;
      element.setAttribute("aria-hidden", focus < .98 ? "true" : "false");
      element.dataset.calm = calm ? "1" : "0";
      if (focus <= .005) return;
      const last = previous.current;
      if (Math.abs(p - last.p) < .0001 && width === last.width && height === last.height && selected === last.selected) return;
      previous.current = { p, width, height, selected };
      const layout = neuralLayout(width, height);
      const points = sampleNeuralPoints(p, layout.points, anchors);
      element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : "wide";
      for (const [index, node] of nodes.current) {
        const point = points[index]!;
        const layer = NEURAL_NODES[index]!.layer;
        node.style.opacity = layer === 4 && NEURAL_OUTPUTS[NEURAL_NODES[index]!.row] === "card-summary" && p > 2.2 ? (1 - smoothstep(clamp01((p - 2.2) / .35))).toFixed(4) : "1";
        const scale = layer === 4 ? 1 + (1 - focus) * (p < 2 ? 2.5 : 0) : layer === 0 ? 1 : .4 + focus * .6;
        node.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) scale(${scale.toFixed(4)})`);
      }
      for (const [index, path] of edges.current) {
        const edge = NEURAL_EDGES[index]!;
        const from = points[edge.from]!, to = points[edge.to]!;
        path.setAttribute("d", `M${from.x.toFixed(2)} ${from.y.toFixed(2)}L${to.x.toFixed(2)} ${to.y.toFixed(2)}`);
      }
      const routeD = route.map((index, step) => `${step ? "L" : "M"}${points[index]!.x.toFixed(2)} ${points[index]!.y.toFixed(2)}`).join("");
      routePath.current?.setAttribute("d", routeD);
      signalPath.current?.setAttribute("d", routeD);
      inputs.current.forEach((button, row) => {
        const index = NEURAL_NODES.findIndex((node) => node.layer === 0 && node.row === row);
        const point = points[index]!;
        button.style.left = `${point.x.toFixed(2)}px`;
        button.style.top = `${point.y.toFixed(2)}px`;
      });
      outputs.current.forEach((button, row) => {
        const index = NEURAL_NODES.findIndex((node) => node.layer === 4 && node.row === row);
        const point = points[index]!;
        if (layout.portrait) {
          const targetX = layout.gutter + (row % 2) * (width - layout.gutter * 2 + 12) / 2;
          button.style.left = `${targetX}px`;
          button.style.top = `${layout.bottom + 32 + Math.floor(row / 2) * 46}px`;
        } else {
          button.style.left = `${point.x.toFixed(2)}px`;
          button.style.top = `${point.y.toFixed(2)}px`;
          button.style.width = `${Math.max(130, width - point.x - layout.gutter - 24)}px`;
        }
      });
      labels.current.forEach((label, index) => {
        label.style.left = `${layout.xs[index === 0 ? 0 : index === 1 ? 2 : 4]}px`;
        label.style.top = `${layout.top - 80}px`;
      });
      if (sourcePanel.current) {
        sourcePanel.current.style.top = width >= 1300 ? `${Math.max(360, height * .5)}px` : "116px";
      }
      if (mobilePicker.current) mobilePicker.current.style.top = `${Math.max(208, layout.top - 106)}px`;
    },
  }), [selected, route]);

  return (
    <div className={styles.graph} ref={root} role="group" data-neural-graph data-selected-input={evidence.id} aria-label={bn ? "প্রমাণ থেকে রেজুমে: নিউরাল গ্রাফ" : "Source evidence connected to resume sections"} style={{ opacity: 0, visibility: "hidden" }} inert aria-hidden="true">
      <svg className={styles.network} width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id={gradient} cx="30%" cy="24%" r="78%">
            <stop offset="0" className={styles.neuronLight} />
            <stop offset=".45" className={styles.neuronMid} />
            <stop offset="1" className={styles.neuronShade} />
          </radialGradient>
        </defs>
        <g className={styles.edges}>
          {NEURAL_EDGES.map((edge, index) => <path key={edge.id} ref={(node) => { if (node) edges.current.set(index, node); else edges.current.delete(index); }} />)}
        </g>
        <path className={styles.activeRoute} ref={routePath} data-neural-route />
        <path className={styles.signal} ref={signalPath} pathLength="100" />
        {NEURAL_NODES.map((node, index) => (
          <g key={node.id} data-neuron={node.id} data-active={activeNodes.has(index) ? "1" : "0"} className={styles.neuron} ref={(el) => { if (el) nodes.current.set(index, el); else nodes.current.delete(index); }}>
            <circle className={styles.activeRing} r="16" />
            <circle className={styles.neuronBody} r="11" fill={`url(#${gradient})`} />
            <circle className={styles.neuronSpark} cx="-3" cy="-4" r="2.5" />
          </g>
        ))}
      </svg>
      {stageLabels.map((label, index) => <p key={index} className={styles.stageLabel} ref={(node) => { if (node) labels.current.set(index, node); else labels.current.delete(index); }}>{label}</p>)}
      {NEURAL_INPUTS.map((input, index) => (
        <button key={input.id} className={styles.input} type="button" data-neural-input={input.id} aria-pressed={selected === index} onClick={() => setSelected(index)} ref={(node) => { if (node) inputs.current.set(index, node); else inputs.current.delete(index); }}>{input.label}</button>
      ))}
      {OUTPUT_CARDS.map((card, row) => (
        <button key={card.id} className={styles.output} type="button" data-neural-output={card.id} aria-pressed={evidence.output === card.id} onClick={() => setSelected(NEURAL_INPUTS.findIndex((input) => input.output === card.id))} ref={(node) => { if (node) outputs.current.set(row, node); else outputs.current.delete(row); }}>
          <span className={styles.outputDot} aria-hidden="true" /><span><strong>{card.title}</strong><small>{card.note}</small></span>
        </button>
      ))}
      <div className={styles.source} ref={sourcePanel} data-ui aria-live="polite" aria-atomic="true">
        <strong>{bn ? "প্রমাণের উৎস" : "Source evidence"}</strong>
        <p>{evidence.source}</p><p>{evidence.detail}</p>
        <span><Check size={15} aria-hidden="true" />{bn ? "উৎস যাচাইকৃত" : "Source verified"}</span>
      </div>
      <div className={styles.mobilePicker} ref={mobilePicker}>
        <label htmlFor={`${gradient}-source`}>{stageLabels[0]}</label>
        <select id={`${gradient}-source`} value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
          {NEURAL_INPUTS.map((input, index) => <option key={input.id} value={index}>{input.label}</option>)}
        </select>
        <p>{evidence.source} · {bn ? "যাচাইকৃত" : "Verified"}</p>
      </div>
    </div>
  );
});
