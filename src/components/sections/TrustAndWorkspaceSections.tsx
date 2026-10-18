import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, FileCheck2, Fingerprint, LockKeyhole, MessageSquareText, ScanSearch } from "lucide-react";

const trustItems = [
  { icon: FileCheck2, title: "Trace every claim", copy: "See the project note, source document, or career evidence behind each important line." },
  { icon: Fingerprint, title: "Keep your voice", copy: "Shape stronger language without turning your experience into somebody else's story." },
  { icon: LockKeyhole, title: "Stay in control", copy: "Review the result, reject a suggestion, and decide what belongs in the final document." },
];

const workspaceSteps = [
  { icon: FileCheck2, number: "01", title: "Resume", copy: "One evidence-grounded master story." },
  { icon: ScanSearch, number: "02", title: "Alignment", copy: "See which proof matters for the role." },
  { icon: BriefcaseBusiness, number: "03", title: "Applications", copy: "Keep every opportunity and version connected." },
  { icon: MessageSquareText, number: "04", title: "Interviews", copy: "Carry the same truth into STAR stories." },
];

export function TrustAndWorkspaceSections() {
  return (
    <>
      <section className="static-section trust-section" aria-labelledby="trust-title">
        <div className="static-section-heading">
          <div><p className="static-kicker">WHY PROFILEAI</p><h2 id="trust-title">Polished language.<br /><em>Visible foundations.</em></h2></div>
          <p className="static-lede">Premium does not mean mysterious. ProfileAI keeps the reasoning, evidence, and final decision close to you.</p>
        </div>
        <div className="trust-grid">
          {trustItems.map(({ icon: Icon, title, copy }) => (
            <article className="trust-card" key={title}>
              <Icon size={21} aria-hidden />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="static-section workspace-section" aria-labelledby="workspace-title">
        <div className="workspace-section__intro">
          <p className="static-kicker">ONE CONNECTED WORKSPACE</p>
          <h2 id="workspace-title">One career story.<br /><em>Every next move.</em></h2>
          <p className="static-lede">Your resume is not the end. The same verified career data follows the job search from discovery to conversation.</p>
          <Link className="story-text-link" href="/dashboard">Explore the workspace <ArrowUpRight size={14} /></Link>
        </div>
        <div className="workspace-flow" aria-label="Connected ProfileAI workflow">
          {workspaceSteps.map(({ icon: Icon, number, title, copy }) => (
            <article className="workspace-flow__step" key={title}>
              <div><span>{number}</span><Icon size={18} aria-hidden /></div>
              <h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
