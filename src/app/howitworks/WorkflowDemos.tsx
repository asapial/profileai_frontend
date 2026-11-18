"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Chip, WindowBar, WorkflowIcon as Icon } from "./workflow-ui";
import s from "./HowItWorks.module.css";

const templates = [
  { slug: "orbit", name: "Orbit" },
  { slug: "gridline", name: "Gridline" },
  { slug: "kinship", name: "Kinship" },
] as const;
const original = "Worked on frontend development tasks and fixed bugs.";
const suggestion = "Built reusable React components for a customer dashboard.";

/** Local examples explain the workflow without writing to a visitor's account. */
export function ResumeCreationDemo() {
  const [template, setTemplate] = useState<(typeof templates)[number]>(templates[0]);
  const [documentType, setDocumentType] = useState("Resume");
  const [status, setStatus] = useState<"suggested" | "accepted" | "original" | "editing" | "edited">("suggested");
  const [wording, setWording] = useState(suggestion);
  const [edit, setEdit] = useState(suggestion);
  const notes = {
    suggested: "Read, revise or remove suggestions. You approve the version you export.",
    accepted: "Wording accepted in this example. Your account has not been changed.",
    original: "Original wording kept in this example. You can still choose or edit the suggestion.",
    editing: "Edit this example in your voice. Changes stay in this demo.",
    edited: "Your wording is shown in this example. Changes stay in this demo.",
  };

  return <div className={s.window} data-resume-demo>
    <WindowBar title="Resume workspace" />
    <div className={s.resumeLayout}>
      <aside className={s.resumeSettings} aria-label="Example resume settings">
        <span className={s.fieldLabel} id="document-type-label">Document type</span>
        <div className={s.segment} role="group" aria-labelledby="document-type-label">{["Resume", "CV"].map(type => <button key={type} type="button" aria-pressed={documentType === type} onClick={() => setDocumentType(type)}>{type}</button>)}</div>
        <span className={s.fieldLabel} id="template-label">Choose a template</span>
        <div className={s.templates} role="group" aria-labelledby="template-label">{templates.map(t => <button key={t.slug} type="button" className={template.slug === t.slug ? s.selected : undefined} aria-pressed={template.slug === t.slug} aria-label={`Preview ${t.name} template`} onClick={() => setTemplate(t)}>
          <Image src={`/templates/story/${t.slug}.png`} alt="" width={794} height={1123} unoptimized /><small>{t.name}</small>
        </button>)}</div>
        <label className={s.fieldLabel} htmlFor="example-depth">Content depth</label>
        <select className={s.value} id="example-depth" defaultValue="Standard" aria-label="Example content depth">{["Concise", "Standard", "Detailed", "Comprehensive"].map(d => <option key={d}>{d}</option>)}</select>
        <span className={s.fieldLabel}>Target role</span><div className={s.value}>Frontend Engineer</div>
        <div className={s.sourceMini}><Icon name="person" size={18} /><div><strong>Alex Morgan</strong><small>Roles, projects & skills</small></div><Icon name="check" size={14} /></div>
      </aside>
      <div className={s.documentArea}>
        <div className={s.documentTitle}><span>{documentType} preview</span><small>A4</small></div>
        <div className={s.paperShadow} key={template.slug}><Image src={`/templates/story/${template.slug}.png`} alt={`A4 example rendered from the existing ${template.name} catalog template`} width={794} height={1123} unoptimized /></div>
        <span className={s.pageCaption}>{template.name} catalog layout · A4 proportions</span>
      </div>
      <aside className={s.reviewPane} aria-label="Example wording review">
        <div className={s.paneTitle}><Icon name="spark" size={18} /><strong>A role-specific draft</strong><Chip>{status === "accepted" ? "Accepted" : "Review"}</Chip></div>
        <div className={s.original}><small>Original experience</small><p>{original}</p></div>
        <div className={s.rewrite}>
          <small>{status === "original" ? "Original wording kept" : "Suggested wording"}</small>
          {status === "editing" ? <form onSubmit={event => { event.preventDefault(); if (edit.trim()) { setWording(edit.trim()); setStatus("edited"); } }}>
            <label className={s.srOnly} htmlFor="example-wording">Edit example wording</label>
            <textarea id="example-wording" value={edit} maxLength={400} rows={4} onChange={event => setEdit(event.target.value)} required />
            <div className={s.reviewActions}><button className={s.button} type="submit">Save wording</button><button type="button" onClick={() => setStatus("suggested")}>Cancel</button></div>
          </form> : <p key={status}>{status === "original" ? original : wording === suggestion ? <>Built <mark>reusable React components</mark> for a <mark>customer dashboard.</mark></> : wording}</p>}
          <span><Icon name="link" size={13} />Source: Customer Dashboard project</span>
        </div>
        {status !== "editing" && <div className={s.reviewActions}>
          <button className={s.button} type="button" onClick={() => setStatus("accepted")}><Icon name="check" size={14} />Accept</button>
          <button type="button" onClick={() => { setEdit(status === "original" ? original : wording); setStatus("editing"); }}>Edit wording</button>
          <button type="button" onClick={() => setStatus("original")}>Keep original</button>
        </div>}
        <div className={s.coverage}><strong>Job-description check</strong><div><span>React & UI components</span><Chip positive>Evidence found</Chip></div><div><span>System design</span><Chip>Needs evidence</Chip></div></div>
        <p className={s.paneNote} role="status" aria-live="polite">{notes[status]}</p>
      </aside>
    </div>
    <div className={s.windowFooter}><span><Icon name="layers" size={15} />Save a version for this role</span><div><span>Create yours to export</span><Link href="/dashboard/resumes/new" prefetch={false} aria-label="Create a resume to export PDF"><Icon name="download" size={14} />PDF</Link><Link href="/dashboard/resumes/new" prefetch={false} aria-label="Create a resume to export DOCX">DOCX</Link></div></div>
  </div>;
}

const exampleJobs = [
  { title: "Frontend Engineer", company: "Example Studio", source: "Remotive", skills: "React · TypeScript", freshness: "Source available", available: true },
  { title: "React Engineer", company: "Example Team", source: "Lever", skills: "React · UI systems", freshness: "Source available", available: true },
  { title: "UI Engineer", company: "Example Company", source: "Greenhouse", skills: "Accessible interfaces", freshness: "Check availability", available: false },
] as const;

export function JobDiscoveryDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className={s.window} data-jobs-demo>
    <WindowBar title="Job discovery" subtitle="Illustrative listings" />
    <div className={s.jobsLayout}>
      <aside className={s.searchSettings} aria-label="Example job search preferences">
        <span className={s.fieldLabel}>Role or keywords</span><div className={s.searchInput}><Icon name="search" size={16} />Frontend engineer, React</div>
        <div className={s.preferences}><Chip>Remote</Chip><Chip>Selected locations</Chip><Chip>Full time</Chip></div>
        <span className={s.fieldLabel}>Public sources</span>
        <div className={s.sources}>{["Remotive", "Jobicy", "Arbeitnow", "Greenhouse", "Lever"].map(t => <span key={t}><Icon name="check" size={13} />{t}</span>)}</div>
        <Link className={`${s.button} ${s.searchButton}`} href="/dashboard/jobs" prefetch={false}><Icon name="search" size={17} />Search jobs</Link>
        <div className={s.browserPath}><span><Icon name="browser" size={18} /><strong>Your connected browser</strong></span><p>Optional, with your permission.</p><div><Chip>Facebook</Chip><Chip>BDJobs</Chip><Chip>LinkedIn</Chip></div><small>LinkedIn uses a manual handoff. Sign-in and verification steps return to you.</small></div>
      </aside>
      <div className={s.jobResults}>
        <div className={s.resultsHead}><div><strong>Review your opportunities</strong><p>Keep the source and freshness visible.</p></div><Chip>Example search</Chip></div>
        {exampleJobs.map(job => <article className={s.jobRow} key={job.title}>
          <div className={s.company}><Icon name="briefcase" size={20} /></div>
          <div className={s.jobContent}><div className={s.jobTitle}><h3>{job.title}</h3><Chip>{job.source}</Chip></div><p>{job.company}<span>Remote</span></p><div className={s.jobMeta}><span>{job.skills}</span><b className={job.available ? s.fresh : s.stale}><Icon name={job.available ? "link" : "clock"} size={12} />{job.freshness}</b></div></div>
          <button type="button" className={s.shortlist} aria-pressed={selected === job.title} aria-label={`${selected === job.title ? "Remove" : "Shortlist"} ${job.title} in this example`} onClick={() => setSelected(selected === job.title ? null : job.title)}><Icon name={selected === job.title ? "check" : "plus"} size={14} />{selected === job.title ? "Shortlisted" : "Shortlist"}</button>
        </article>)}
        <div className={s.selectedJob}>
          <span role="status" aria-live="polite"><Icon name="link" size={17} />{selected ? `${selected} · example shortlist` : "Shortlisted role"}</span>
          <strong>Use this job as your resume brief</strong><p>{selected ? "Example only; nothing is saved to your account. Open your workspace to tailor a resume for a real role." : "The saved role and description can fill the next resume workflow."}</p>
          <Link href="/dashboard/resumes/new" prefetch={false}>Tailor a resume <Icon name="arrow" size={15} /></Link>
        </div>
      </div>
    </div>
    <div className={s.qualityRail}><span><Icon name="link" size={15} />Keep the original URL</span><span><Icon name="layers" size={15} />Combine duplicate listings</span><span><Icon name="clock" size={15} />Record source freshness</span></div>
  </div>;
}
