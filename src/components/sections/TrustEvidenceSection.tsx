"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, FileText, Link2, PencilLine, ShieldCheck } from "lucide-react";
import styles from "./TrustEvidenceSection.module.css";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

const PRINCIPLES = [
  { id: "trace", title: "Trace every claim", copy: "See the project note, source document, or career evidence behind each important line.", icon: Link2 },
  { id: "voice", title: "Keep your voice", copy: "Shape stronger language without turning your experience into somebody else's story.", icon: PencilLine },
  { id: "control", title: "Stay in control", copy: "Review the result, reject a suggestion, and decide what belongs in the final document.", icon: ShieldCheck },
] as const;

/** The first reading section carries the same evidence into a real source disclosure. */
export function TrustEvidenceSection() {
  const inspector = useRef<HTMLDivElement>(null), metric = useRef<HTMLElement>(null);
  const source = useRef<HTMLDetailsElement>(null), quote = useRef<HTMLQuoteElement>(null);
  const route = useRef<SVGPathElement>(null), start = useRef<SVGCircleElement>(null), end = useRef<SVGCircleElement>(null);
  const [sourceOpen, setSourceOpen] = useState(true);

  useEffect(() => {
    const host = inspector.current, token = metric.current, evidence = source.current;
    if (!host || !token || !evidence) return;
    let frame = 0, alive = true;
    const measure = () => {
      frame = 0;
      if (!alive) return;
      const box = host.getBoundingClientRect(), claim = token.getBoundingClientRect(), target = evidence.getBoundingClientRect();
      const from = { x: claim.left + claim.width / 2 - box.left, y: claim.bottom - box.top + 4 };
      const to = { x: target.left - box.left + target.width * .62, y: target.top - box.top + 1 };
      const bend = Math.max(20, (to.y - from.y) * .6);
      route.current?.setAttribute("d", `M${from.x.toFixed(2)},${from.y.toFixed(2)} C${from.x.toFixed(2)},${(from.y + bend).toFixed(2)} ${to.x.toFixed(2)},${(to.y - bend).toFixed(2)} ${to.x.toFixed(2)},${to.y.toFixed(2)}`);
      start.current?.setAttribute("cx", String(from.x)); start.current?.setAttribute("cy", String(from.y));
      end.current?.setAttribute("cx", String(to.x)); end.current?.setAttribute("cy", String(to.y));
      host.dataset.routeReady = "true";
    };
    const schedule = () => { if (!frame && alive) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(host); observer.observe(evidence);
    const claim = host.querySelector("[data-trust-claim]"); if (claim) observer.observe(claim);
    evidence.addEventListener("toggle", schedule);
    window.addEventListener("resize", schedule, { passive: true });
    void document.fonts.ready.then(schedule);
    schedule();
    return () => { alive = false; cancelAnimationFrame(frame); observer.disconnect(); evidence.removeEventListener("toggle", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  const viewSource = () => {
    if (!source.current || !quote.current) return;
    source.current.open = true;
    setSourceOpen(true);
    quote.current.focus({ preventScroll: true });
    const bounds = quote.current.getBoundingClientRect();
    if (bounds.top < 96 || bounds.bottom > window.innerHeight - 24) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!source.current.closest(".story-page--reduced");
      quote.current.scrollIntoView({ block: "center", behavior: calm ? "instant" : "smooth" });
    }
  };

  return (
    <section className={`${styles.section} ${sectionEnvironmentClass} static-section trust-section`} aria-labelledby="trust-title" data-trust-evidence>
      <SectionEnvironment kind="trust"/>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <h2 id="trust-title" className={styles.title}>Your words.<br />Your evidence.</h2>
          <p className={styles.lede}>Keep the source, the suggestion and the final decision together. Every change starts with work you can explain.</p>
        </div>

        <div ref={inspector} className={styles.inspector} data-trust-inspector aria-label="Illustrative resume claim and its source">
          <article className={styles.claim} data-trust-claim data-ui>
            <div className={styles.context}><span>Illustrative resume draft</span><span className={styles.linked}><Check size={16} aria-hidden="true" />Source linked</span></div>
            <h3 className={styles.claimTitle}>Customer Dashboard</h3>
            <p className={styles.statement}>Developed reusable <mark>React components</mark>, improving load performance by <mark ref={metric} data-trust-metric>31%</mark>.<span className={styles.inlineAction}><button type="button" onClick={viewSource} aria-controls="trust-source-evidence" aria-expanded={sourceOpen} data-trust-view-source><Link2 size={20} aria-hidden="true" />View source</button></span></p>
          </article>
          <svg className={styles.route} aria-hidden="true" width="100%" height="100%">
            <path ref={route} data-trust-route /><circle ref={start} r="5" data-trust-route-start /><circle ref={end} r="6" data-trust-route-end />
          </svg>
          <details ref={source} id="trust-source-evidence" className={styles.source} open={sourceOpen} onToggle={(event) => setSourceOpen(event.currentTarget.open)} data-trust-source data-ui>
            <summary className={styles.sourceHeader}>
              <span className={styles.sourceIcon}><FileText size={30} aria-hidden="true" /></span>
              <span className={styles.sourceHeading}><strong>Source evidence</strong><span>Lighthouse report · Q3</span></span>
              <span className={styles.sourceAction}>View source<ChevronDown size={19} aria-hidden="true" /></span>
            </summary>
            <div className={styles.sourceBody}><blockquote ref={quote} className={styles.quote} tabIndex={-1} data-trust-quote>LCP improved from 2.9s to 2.0s after the lazy-load rework.</blockquote></div>
          </details>
          <p className={styles.note}>Your source stays beside the draft. You review every change.</p>
        </div>

        <div className={styles.principles}>
          {PRINCIPLES.map(({ id, title, copy, icon: Icon }, index) => (
            <article key={id} className={`${styles.principle} ${index === 0 ? styles.active : ""}`} data-trust-principle={id}>
              <span className={styles.principleIcon}><Icon size={27} aria-hidden="true" /></span>
              <div><h3 className={styles.principleTitle}>{title}</h3><p>{copy}</p></div>
            </article>
          ))}
        </div>
        <Link className={`story-primary ${styles.cta}`} href="/register" data-trust-cta>Build my resume<ArrowUpRight size={19} aria-hidden="true" /></Link>
      </div>
      <svg className={styles.floor} viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-90 115 C230 18 1160 16 1435 73 S1070 148 600 135" />
        <path d="M-80 145 C160 57 1140 29 1490 116" />
        <circle cx="168" cy="92" r="3" /><circle cx="1280" cy="123" r="3" />
      </svg>
    </section>
  );
}
