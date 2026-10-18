import Link from "next/link";
import { ArrowUpRight, Check, FileText, Link2 } from "lucide-react";

/**
 * The three proof sections that carry the story into the standard landing:
 * product screens, one customer story, and the template collection. They sit
 * between the workspace flow and the plans table, and read from the same
 * evidence-first position as the cinema — no scores, no invented outcomes.
 */

const alignmentRows = [
  { label: "React development", status: "Strong match", tone: "matched" },
  { label: "System design", status: "Needs proof", tone: "missing" },
  { label: "Mentoring juniors", status: "Related work", tone: "partial" },
] as const;

const storyNotes = [
  "Four years of projects turned into one evidence-linked master resume.",
  "Every AI suggestion reviewed line by line before it reaches the document.",
  "The same proof carried into applications, versions and interview stories.",
];

const templateCards = [
  { id: "technical", name: "Technical", role: "Frontend engineer", description: "Clear structure. Confident detail." },
  { id: "editorial", name: "Editorial", role: "Product designer", description: "Timeless typography. Quiet presence." },
  { id: "minimal", name: "Minimal", role: "Data analyst", description: "Focused content. Room to breathe." },
] as const;

export function StoryShowcaseSection() {
  return (
    <section className="static-section showcase-section" aria-labelledby="showcase-title">
      <div className="static-section-heading">
        <div>
          <h2 id="showcase-title">One workspace.<br /><em>Every claim in view.</em></h2>
        </div>
        <p className="static-lede">The evidence behind the story follows you into the document, the role fit, and the export — nothing appears without a source.</p>
      </div>

      <div className="showcase-grid">
        <article className="showcase-screen showcase-screen--wide">
          <div className="showcase-frame" aria-hidden="true">
            <span className="showcase-frame__bar"><i>Resume · Senior Frontend</i><b>Evidence on</b></span>
            <div className="showcase-doc">
              <span className="showcase-line is-linked">Rebuilt the checkout flow — LCP improved 31%</span>
              <span className="showcase-line is-linked">Mentored two juniors through their first releases</span>
              <span className="showcase-line" />
              <span className="showcase-line is-short" />
            </div>
            <div className="showcase-source">
              <FileText size={16} aria-hidden />
              <div>
                <strong>Lighthouse report · Q3</strong>
                <span>&ldquo;LCP 2.9s &rarr; 2.0s after the lazy-load rework&rdquo;</span>
              </div>
              <Link2 size={14} aria-hidden />
            </div>
          </div>
          <div>
            <h3>Evidence, attached</h3>
            <p>Open any line in the document and the project note, report or outcome it came from is right there.</p>
          </div>
        </article>

        <article className="showcase-screen">
          <div className="showcase-frame" aria-hidden="true">
            <span className="showcase-frame__bar"><i>Alignment · Frontend Engineer</i></span>
            <ul className="showcase-rows">
              {alignmentRows.map((row) => (
                <li key={row.label} data-tone={row.tone}>
                  <span>{row.label}</span><em>{row.status}</em>
                </li>
              ))}
            </ul>
          </div>
          <h3>Alignment, explained</h3>
          <p>Matched, missing, or needs proof — every requirement lands in one of three honest states.</p>
        </article>

        <article className="showcase-screen">
          <div className="showcase-frame" aria-hidden="true">
            <span className="showcase-frame__bar"><i>Export</i></span>
            <div className="showcase-files">
              <span><FileText size={16} aria-hidden /> Resume.pdf <em>Ready</em></span>
              <span><FileText size={16} aria-hidden /> Resume.docx <em>Editable</em></span>
              <span><Link2 size={16} aria-hidden /> Share link <em>Private</em></span>
            </div>
          </div>
          <h3>Ready to send</h3>
          <p>A clean A4 document, an editable copy, or a private link — the format each application asks for.</p>
        </article>
      </div>
    </section>
  );
}

export function StoryCustomerStorySection() {
  return (
    <section className="static-section story-section" aria-labelledby="story-title">
      <h2 id="story-title">A clearer resume.<br /><em>A calmer search.</em></h2>
      <div className="story-grid">
        <figure className="story-quote">
          <blockquote>&ldquo;I stopped guessing what to cut. Every line now points to something I actually did — and I can explain it in the interview.&rdquo;</blockquote>
          <figcaption>
            <strong>Maya Chen</strong>
            <span>Product designer · Uses ProfileAI for applications and interview prep</span>
          </figcaption>
        </figure>
        <ul className="story-notes">
          {storyNotes.map((note) => (
            <li key={note}><Check size={15} aria-hidden />{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function StoryTemplatesSection() {
  return (
    <section className="static-section templates-section" aria-labelledby="templates-title">
      <div className="static-section-heading">
        <div>
          <h2 id="templates-title">Three presentations.<br /><em>One body of evidence.</em></h2>
        </div>
        <p className="static-lede">Change the type and the rhythm without rewriting a line — every template reads from the same verified content.</p>
      </div>

      <div className="template-row">
        {templateCards.map((card) => (
          <Link key={card.id} href="/templates" className="template-card">
            <span className="template-paper" data-variant={card.id} aria-hidden="true">
              <b className="template-paper__name">Alex Morgan</b>
              <em className="template-paper__role">{card.role}</em>
              <i /><i /><i /><i />
            </span>
            <span className="template-card__body">
              <h3>{card.name}</h3>
              <span>{card.description}</span>
              <em>Preview template <ArrowUpRight size={13} aria-hidden /></em>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
