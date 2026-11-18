"use client";

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { BarChart3, BriefcaseBusiness, Check, Circle, FileText, FolderKanban, GraduationCap, Link2, Trophy } from "lucide-react";
import { JOB_ROWS } from "@/lib/career-cinema";
import { ALIGNMENT_CARDS, ALIGNMENT_ROUTES, alignmentCardPoint, alignmentCurve, alignmentLayout, alignmentState } from "@/lib/career-alignment";
import type { NeuralPoint } from "@/lib/career-neural";
import type { StoryCopy } from "@/lib/story-i18n";
import styles from "./CareerAlignment.module.css";

export type AlignmentHandle = {
  update: (p: number, width: number, height: number, incoming: Map<string, NeuralPoint>, outgoing: { evidence: NeuralPoint; job: NeuralPoint } | undefined, calm: boolean) => void;
};

const CARD_ICONS = [BarChart3, FolderKanban, BriefcaseBusiness, Trophy, GraduationCap];

export const CareerAlignment = forwardRef<AlignmentHandle, { copy: StoryCopy }>(function CareerAlignment({ copy }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const panel = useRef<HTMLDivElement>(null);
  const paths = useRef(new Map<number, { line?: SVGPathElement; signal?: SVGPathElement }>());
  const picker = useRef<HTMLDivElement>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(0);
  const [selectedCard, setSelectedCard] = useState<string | null>("card-skills");
  const previous = useRef({ p: -1, width: 0, height: 0, selectedRow: -1 as number | null, selectedCard: "" as string | null });
  const id = useId();
  const bn = copy.locale === "bn";
  const route = ALIGNMENT_ROUTES.find((item) => item.row === selectedRow);
  const selectedMeta = ALIGNMENT_CARDS.find((card) => card.id === selectedCard);

  const chooseRow = (row: number) => {
    setSelectedRow(row);
    setSelectedCard(ALIGNMENT_ROUTES.find((item) => item.row === row)?.card ?? null);
  };
  const chooseCard = (card: string) => {
    setSelectedCard(card);
    setSelectedRow(ALIGNMENT_ROUTES.find((item) => item.card === card)?.row ?? null);
  };

  useImperativeHandle(ref, () => ({
    update(p, width, height, incoming, outgoing, calm) {
      const element = root.current;
      if (!element) return;
      const state = alignmentState(p);
      element.dataset.unit = p.toFixed(4);
      element.style.opacity = (Math.min(1, state.arrive * 3) * (1 - state.depart)).toFixed(4);
      element.style.visibility = state.presence > .001 ? "visible" : "hidden";
      element.inert = state.presence < .98;
      element.setAttribute("aria-hidden", state.presence < .98 ? "true" : "false");
      element.dataset.calm = calm ? "1" : "0";
      if (state.presence <= .001) return;
      const last = previous.current;
      if (Math.abs(p - last.p) < .0001 && width === last.width && height === last.height && selectedRow === last.selectedRow && selectedCard === last.selectedCard) return;
      previous.current = { p, width, height, selectedRow, selectedCard };
      const layout = alignmentLayout(width, height, selectedRow);
      element.dataset.layout = layout.portrait ? "portrait" : layout.short ? "short" : width < 1100 ? "tablet" : "wide";
      element.dataset.compact = layout.compactPhone ? "1" : "0";
      element.style.setProperty("--alignment-copy", state.annotations.toFixed(4));
      element.style.setProperty("--alignment-panel", state.panel.toFixed(4));
      element.style.setProperty("--alignment-lines", state.connections.toFixed(4));
      const points = new Map<string, NeuralPoint>();
      for (const card of layout.cards) {
        const point = layout.portrait ? { x: card.x, y: card.y } : alignmentCardPoint(p, card, incoming.get(card.id), outgoing?.evidence);
        points.set(card.id, point);
        const button = cards.current.get(card.id);
        if (!button) continue;
        const growX = (28 + (layout.cardWidth - 28) * state.arrive) / layout.cardWidth * (1 - state.depart * .55);
        const growY = (24 + (layout.cardHeight - 24) * state.arrive) / layout.cardHeight * (1 - state.depart * .55);
        button.style.width = `${layout.cardWidth}px`;
        button.style.height = `${layout.cardHeight}px`;
        button.style.transform = `translate3d(${point.x.toFixed(2)}px,${point.y.toFixed(2)}px,0) translate(-100%,-50%) scale(${growX.toFixed(4)},${growY.toFixed(4)})`;
      }
      const panelCenter = { x: layout.panel.x + layout.panel.width / 2, y: layout.panel.y + layout.panel.height / 2 };
      const target = outgoing?.job ?? panelCenter;
      const center = { x: panelCenter.x + (target.x - panelCenter.x) * state.depart + 64 * (1 - state.arrive), y: panelCenter.y + (target.y - panelCenter.y) * state.depart };
      const scale = (.9 + .1 * state.arrive) * (1 - .6 * state.depart);
      if (panel.current) {
        const style = panel.current.style;
        style.width = `${layout.panel.width}px`;
        style.height = `${layout.panel.height}px`;
        style.transform = `translate3d(${center.x.toFixed(2)}px,${center.y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scale.toFixed(4)})`;
        style.setProperty("--alignment-padding", `${layout.padding}px`);
        style.setProperty("--alignment-header", `${layout.header}px`);
        style.setProperty("--alignment-footer", `${layout.footer}px`);
        style.setProperty("--alignment-row", `${layout.rowHeight}px`);
        style.setProperty("--alignment-detail", `${layout.detail}px`);
      }
      for (const [index, entry] of paths.current) {
        const link = ALIGNMENT_ROUTES[index]!;
        const from = points.get(link.card)!;
        const row = layout.rows[link.row]!;
        const to = { x: center.x + (row.x - panelCenter.x) * scale, y: center.y + (row.y - panelCenter.y) * scale };
        const d = alignmentCurve(from, to, layout.portrait);
        const visible = !layout.portrait || link.card === selectedCard && link.row === selectedRow;
        for (const path of [entry.line, entry.signal]) if (path) {
          path.setAttribute("d", d);
          path.style.visibility = visible ? "visible" : "hidden";
        }
      }
      if (picker.current) {
        picker.current.style.top = `${layout.top}px`;
        picker.current.style.height = `${layout.cardHeight}px`;
      }
    },
  }), [selectedRow, selectedCard]);

  return (
    <div ref={root} className={styles.alignment} role="group" aria-label={bn ? "প্রমাণ ও চাকরির চাহিদার মিল" : "Career evidence matched to job requirements"} data-alignment data-selected-row={selectedRow ?? "none"} data-selected-card={selectedCard ?? "none"} style={{ opacity: 0, visibility: "hidden" }} inert aria-hidden="true">
      <svg className={styles.connections} width="100%" height="100%" aria-hidden="true">
        {ALIGNMENT_ROUTES.map((link, index) => (
          <g key={`${link.card}-${link.row}`} className={styles.route} data-tone={link.tone} data-active={selectedRow === link.row ? "1" : "0"}>
            <path data-alignment-route={link.row} ref={(node) => { const entry = paths.current.get(index) ?? {}; entry.line = node ?? undefined; paths.current.set(index, entry); }} />
            <path className={styles.signal} pathLength="100" ref={(node) => { const entry = paths.current.get(index) ?? {}; entry.signal = node ?? undefined; paths.current.set(index, entry); }} />
          </g>
        ))}
      </svg>
      {ALIGNMENT_CARDS.map((card, index) => {
        const Icon = CARD_ICONS[index]!;
        return (
          <button key={card.id} type="button" className={styles.evidenceCard} data-alignment-card={card.id} aria-pressed={selectedCard === card.id} onClick={() => chooseCard(card.id)} data-ui ref={(node) => { if (node) cards.current.set(card.id, node); else cards.current.delete(card.id); }}>
            <span className={styles.cardContent}><span className={styles.cardIcon} data-tone={card.tone}><Icon size={24} aria-hidden="true" /></span><span><strong>{card.title}</strong><small>{card.note}</small></span></span>
            <i className={styles.port} aria-hidden="true" />
          </button>
        );
      })}
      <div className={styles.mobileEvidence} ref={picker} data-ui>
        <label htmlFor={`${id}-evidence`}>{bn ? "আপনার প্রমাণ" : "Your evidence"}</label>
        <select id={`${id}-evidence`} value={selectedCard ?? ""} onChange={(event) => chooseCard(event.target.value)}>
          {!selectedCard ? <option value="">{bn ? "সংযুক্ত উৎস নেই" : "No source linked"}</option> : null}
          {ALIGNMENT_CARDS.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}
        </select>
        <p>{selectedMeta?.note ?? (bn ? "এই চাহিদার পক্ষে প্রমাণ প্রয়োজন।" : "This requirement needs supporting evidence.")}</p>
        <i className={styles.port} aria-hidden="true" />
      </div>
      <div className={styles.jobPanel} ref={panel} data-alignment-panel data-ui>
        <div className={styles.panelContent}>
          <header className={styles.jobHeader}><h3>{copy.job.title}</h3><span>Frontend Engineer</span></header>
          <div className={styles.requirements}>
            {JOB_ROWS.map((row, index) => {
              const selected = selectedRow === index;
              const rowRoute = ALIGNMENT_ROUTES.find((item) => item.row === index);
              return (
                <button key={row.requirement} className={styles.requirement} type="button" data-alignment-row={index} data-tone={row.tone} aria-pressed={selected} onClick={() => chooseRow(index)}>
                  {rowRoute ? <i className={styles.requirementPort} aria-hidden="true" /> : null}
                  <span className={styles.rowMain}>
                    {row.tone === "missing" ? <Circle size={20} aria-hidden="true" /> : <Check size={20} aria-hidden="true" />}
                    <strong>{row.requirement}</strong>
                    <span className={styles.rowState}>{row.tone === "missing" ? bn ? "প্রমাণ প্রয়োজন" : "Needs proof" : copy.matchLabel(row.state)}</span>
                  </span>
                  {selected ? <span className={styles.sourceDetail} data-alignment-source>
                    {rowRoute ? <><FileText size={14} aria-hidden="true" /><span>{rowRoute.source}</span><span className={styles.verified}><Check size={14} aria-hidden="true" />{bn ? "উৎস যাচাইকৃত" : "Source verified"}</span></>
                      : <><Link2 size={14} aria-hidden="true" /><span>{bn ? "এই চাহিদার পক্ষে কোনো উৎস সংযুক্ত নেই।" : "No supporting source linked yet."}</span></>}
                  </span> : null}
                </button>
              );
            })}
          </div>
          <p className={styles.panelNote}>{selectedRow === null ? bn ? "এই উদাহরণে নির্বাচিত প্রমাণের সঙ্গে কোনো চাহিদা যুক্ত নেই।" : "No linked requirement for this evidence in this example." : bn ? "প্রমাণের মিল, চাকরি পাওয়ার সম্ভাবনা নয়।" : "Evidence coverage, not hiring probability."}</p>
        </div>
      </div>
      <p className={styles.srOnly} aria-live="polite">{selectedRow === null ? selectedMeta?.title : `${JOB_ROWS[selectedRow]!.requirement}. ${route?.source ?? "Needs proof"}`}</p>
    </div>
  );
});
