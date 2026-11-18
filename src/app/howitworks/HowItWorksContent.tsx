import { Navbar1 } from "@/components/navbar1";
import { Footer } from "@/components/layout/Footer";
import { JourneyLink } from "./JourneyLink";
import { JobDiscoveryDemo, ResumeCreationDemo } from "./WorkflowDemos";
import { Chip, Guide, SectionHeading, WindowBar, WorkflowIcon as Icon } from "./workflow-ui";
import s from "./HowItWorks.module.css";

const chapters = [
  { id: "step-1", title: "Your career profile", icon: "person" },
  { id: "resume-process", title: "Resume creation", icon: "file" },
  { id: "job-process", title: "Job discovery", icon: "search" },
  { id: "application-process", title: "Applications & control", icon: "briefcase" },
] as const;

const resumeSteps = [
  ["Choose format & style", "Select Resume or CV and a real catalog template."],
  ["Review your profile", "Check contact details, roles, projects, skills and education."],
  ["Add the target role", "Select a saved job or enter the role. Add a description when available."],
  ["Generate & refine", "Review the summary, bullets and job-description gaps. Edit what matters."],
  ["Preview & export", "Keep a role-specific version. Download the approved PDF or DOCX."],
] as const;

const jobSteps = [
  ["Set your preferences", "Specify roles, workplace, locations and relevant skills."],
  ["Choose the sources", "Use public providers or enable a connected-browser source."],
  ["Review the findings", "Check the original listing, freshness, duplicates and role context."],
  ["Shortlist & tailor", "Save a promising role. Check alignment and build a focused application."],
] as const;

const modes = [
  { icon: "search", title: "Research only", copy: "Find and save opportunities. Keep applications for later." },
  { icon: "file", title: "Prepare applications", copy: "Build documents and drafts for the roles you choose." },
  { icon: "check", title: "Review and submit", copy: "Review supported forms and approve the final action." },
  { icon: "spark", title: "Approved auto apply", copy: "Optional. Requires a separate policy and allowed supported sites." },
] as const;

const questions = [
  ["How does ProfileAI create the resume?", "It combines your profile, selected template and target role into a structured draft. You review the summary, experience and other sections before exporting."],
  ["Where does the job search look?", "Public-source search includes Remotive, Jobicy, Arbeitnow, Greenhouse and Lever. Optional browser sources require permission. LinkedIn uses a manual handoff."],
  ["Can ProfileAI submit applications automatically?", "Submission depends on the mode you authorize and the supported site. Review-and-submit keeps a final approval step. Approved auto apply requires a separate policy, allowed domains and explicit consent."],
  ["What can I download or connect?", "Preview and export PDF or DOCX. If you choose to connect Google services, documents can go to Drive, tracking to Sheets, and reviewable unsent drafts to Gmail."],
] as const;

function Hero() {
  return <section className={s.hero} aria-labelledby="how-title" data-how-hero>
    <div className={s.heroInner}>
      <div>
        <p className={s.introLabel}>How ProfileAI works</p>
        <h1 id="how-title">Your experience.<br />A clearer next move.</h1>
        <p className={s.lede}>Bring your experience, understand the role, and review every suggestion. Build an application that still sounds like you.</p>
        <div className={s.heroActions}>
          <JourneyLink className={s.primary} href="#step-1">Start with your experience <Icon name="up" size={18} /></JourneyLink>
          <JourneyLink className={s.textAction} href="#steps">Explore the 4 steps <Icon name="arrow" size={17} /></JourneyLink>
        </div>
        <p className={s.assurance}><Icon name="check" size={15} />Your experience stays the source.</p>
      </div>
      <div className={s.heroArt}>
        <div className={s.artScene} role="img" aria-label="A portfolio of real experience, a neural sphere and an A4 resume on a reflective studio floor" />
        <div className={s.artKey}><span>Real experience</span><i /><span>Thoughtful AI</span><i /><span>Your next chapter</span></div>
      </div>
    </div>
  </section>;
}

function ProfileFoundation() {
  return <section className={s.foundation} id="step-1" tabIndex={-1} aria-labelledby="foundation-title">
    <div className={`${s.container} ${s.foundationInner}`}>
      <div>
        <p className={s.label}>The foundation</p>
        <h2 id="foundation-title">One career profile.<br />A connected workflow.</h2>
        <p className={s.body}>Your roles, projects, education and skills become the source for your documents and the opportunities you pursue.</p>
        <div className={s.sourceTags}>{["Experience", "Projects", "Skills", "Education"].map(t => <Chip key={t}>{t}</Chip>)}</div>
      </div>
      <div className={s.map} role="group" aria-label="Your profile supports resumes and job discovery, which meet in the application workspace">
        <svg className={s.mapLines} viewBox="0 0 640 260" preserveAspectRatio="none" aria-hidden="true"><path d="M184 130C235 130 215 60 262 60M184 130C235 130 215 200 262 200M421 60C468 60 449 130 492 130M421 200C468 200 449 130 492 130" /></svg>
        <div className={s.mapProfile}><span className={s.avatar}>AM</span><strong>Your profile</strong><small>Confirmed experience</small><span className={s.confirm}><Icon name="check" size={13} />Your source</span></div>
        <div className={s.mapBranch}>
          <article><Icon name="file" size={22} /><div><strong>Resume & CV</strong><small>Tailor, edit, export</small></div></article>
          <article className={s.jobsBranch}><Icon name="search" size={22} /><div><strong>Job discovery</strong><small>Search, review, shortlist</small></div></article>
        </div>
        <div className={s.mapResult}><Icon name="briefcase" size={26} /><strong>Applications</strong><small>Documents, drafts<br />and next actions</small></div>
      </div>
    </div>
    <p className={s.mapCaption}>Start with your profile or a saved role. The same context follows every next step.</p>
  </section>;
}

function ApplicationWorkspace() {
  return <div className={s.window}>
    <WindowBar title="Application workspace" />
    <div className={s.applicationLayout}>
      <div className={s.roleSummary}>
        <span className={s.company}><Icon name="briefcase" size={24} /></span>
        <span className={s.fieldLabel}>Selected opportunity</span>
        <h3>Frontend Engineer</h3><p>Example Studio · Remote</p>
        <JourneyLink href="#job-process"><Icon name="link" size={14} />Original listing</JourneyLink>
        <div className={s.facts}>
          <div><small>Relevant evidence</small><span>React components, dashboard project</span></div>
          <div><small>Resume for this role</small><span>Orbit · A4 · Reviewed draft</span></div>
        </div>
      </div>
      <div className={s.applicationKit}>
        <h3>Prepare the right materials</h3>
        <article><Icon name="file" size={19} /><div><strong>Role-specific resume</strong><p>Your selected template and approved wording.</p></div><Chip>PDF / DOCX</Chip></article>
        <article><Icon name="mail" size={19} /><div><strong>Application or outreach draft</strong><p>Review the subject and message before use.</p></div><Chip>Draft</Chip></article>
        <article><Icon name="person" size={19} /><div><strong>Interview preparation</strong><p>Carry the same project examples into the conversation.</p></div></article>
      </div>
      <div className={s.statusPane}>
        <h3>Track the next action</h3>
        <ol>{[
          ["Saved", "Original role and source kept."],
          ["Preparing", "Resume and draft under review."],
          ["Applied", "Record a confirmed submission."],
          ["Interview", "Keep notes and next actions."],
        ].map(([title, copy], index) => <li key={title} className={index === 1 ? s.current : undefined}>
          <i>{index === 0 && <Icon name="check" size={10} />}</i><div><strong>{title}</strong><p>{copy}</p></div>
        </li>)}</ol>
      </div>
    </div>
    <div className={s.workspaceSync}>
      <div><strong>Connect your workspace, optionally.</strong><span>Only after you connect and grant access.</span></div>
      <p><Icon name="folder" size={17} />Drive <small>documents</small></p>
      <p><Icon name="sheet" size={17} />Sheets <small>tracker</small></p>
      <p><Icon name="mail" size={17} />Gmail <small>unsent drafts</small></p>
    </div>
  </div>;
}

export default function HowItWorksContent() {
  return <div className={s.page} data-how-page>
    <Navbar1 />
    <main id="main">
      <Hero />
      <nav className={s.jump} id="steps" tabIndex={-1} aria-label="Explore how ProfileAI works">
        {chapters.map(({ id, title, icon }) => <JourneyLink key={id} href={`#${id}`}><Icon name={icon} size={18} /><span>{title}</span><Icon name="chevron" size={14} /></JourneyLink>)}
      </nav>
      <ProfileFoundation />
      <section className={`${s.chapter} ${s.resume}`} id="resume-process" tabIndex={-1} aria-labelledby="resume-title">
        <div className={s.container}>
          <SectionHeading id="resume-title" label="Resume creation" title={<>From real experience<br />to a resume that fits.</>} text="Choose a document type and template, add the role, then review a draft built from your profile. Your words remain editable at every stage." />
          <ResumeCreationDemo />
          <Guide steps={resumeSteps} />
          <div className={s.explainRail}>
            {([
              { icon: "person", title: "You provide", text: "Profile, template and role context." },
              { icon: "spark", title: "ProfileAI prepares", text: "Structured, role-focused content." },
              { icon: "check", title: "You approve", text: "Wording, layout and final export." },
            ] as const).map(({ icon, title, text }) => <div key={title}><Icon name={icon} size={18} /><p><strong>{title}</strong><span>{text}</span></p></div>)}
          </div>
        </div>
      </section>
      <section className={`${s.chapter} ${s.jobs}`} id="job-process" tabIndex={-1} aria-labelledby="jobs-title">
        <div className={s.container}>
          <SectionHeading id="jobs-title" label="Job discovery" title={<>Find the opportunity.<br />Keep the full context.</>} text="Define the roles you want and choose where to search. Review the listing, its original source and the evidence before moving forward." />
          <JobDiscoveryDemo />
          <div className={s.screening}>
            {[
              ["Listing checks", "Keep the original URL, availability context and duplicate identity."],
              ["Preference fit", "Use your role, skills, workplace, location and work-authorization preferences."],
              ["Alignment before tailoring", "Open the selected role to review requirement coverage and evidence gaps."],
            ].map(([title, text], index) => <article key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
          </div>
          <Guide steps={jobSteps} />
          <div className={s.noteBand}><span><Icon name="clock" size={19} /></span><p><strong>Search on your schedule.</strong> Run manually, or choose an optional 12-hour or 24-hour public-search schedule.</p><span className={s.noteTag}>Your saved preferences</span></div>
        </div>
      </section>
      <section className={`${s.chapter} ${s.applications}`} id="application-process" tabIndex={-1} aria-labelledby="applications-title">
        <div className={s.container}>
          <SectionHeading id="applications-title" label="From shortlist to next step" title={<>One opportunity.<br />Everything it needs.</>} text="Keep the role, tailored documents, outreach drafts and next actions connected. Move into preparation, submission or interview work with the same context." />
          <ApplicationWorkspace />
        </div>
      </section>
      <section className={s.control} aria-labelledby="control-title">
        <div className={s.container}>
          <div className={s.controlHeading}><div><span className={s.label}>Your control</span><h2 id="control-title">Choose what happens next.</h2></div><p>Preparation and submission are separate. Pick the mode, sources and permissions that fit your workflow.</p></div>
          <div className={s.modes}>{modes.map(({ icon, title, copy }, i) => <article key={title}><span><Icon name={icon} size={22} /></span><h3>{title}{i === 3 && <small>Optional</small>}</h3><p>{copy}</p></article>)}</div>
          <div className={s.controlFoot}>
            <span><Icon name="pause" size={16} />Pause or stop a run.</span>
            <span><Icon name="browser" size={16} />Sign-in and verification return to you.</span>
            <span><Icon name="check" size={16} />Supported site capabilities define the available actions.</span>
          </div>
        </div>
      </section>
      <section className={s.faq} aria-labelledby="faq-title">
        <div className={`${s.container} ${s.faqInner}`}>
          <div><span className={s.label}>A few practical answers</span><h2 id="faq-title">Clear before<br />you begin.</h2></div>
          <div>{questions.map(([q, a]) => <details key={q}><summary>{q}<Icon name="plus" size={16} /></summary><p>{a}</p></details>)}</div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
