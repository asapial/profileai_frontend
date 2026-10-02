import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  ScanLine,
  BriefcaseBusiness,
  MessageSquareText,
  LayoutTemplate,
  ChartNoAxesCombined,
} from "lucide-react";
import type { ManagedHomepageSection } from "@/lib/homepage";
const FEATURES = [
  {
    title: "A resume that sounds like you.",
    description:
      "Shape your experience into a clear story. Edit each section, explore different layouts, and export when it feels right.",
    href: "/dashboard/resumes",
    icon: FileText,
    label: "Resume studio",
  },
  {
    title: "Read between the lines.",
    description:
      "Break down a job description into the skills, keywords and experience to focus on. Give your next draft a clear direction.",
    href: "/dashboard/ats",
    icon: ScanLine,
    label: "Role insights",
  },
  {
    title: "Keep the big picture in view.",
    description:
      "Applications, cover letters and follow-ups. Give every opportunity a place, so the next step is always easy to find.",
    href: "/dashboard/jobs",
    icon: BriefcaseBusiness,
    label: "Application tracker",
  },
  {
    title: "Write with evidence behind every claim.",
    description: "Prepare cover letters and outreach from confirmed experience, with every draft kept under your control.",
    href: "/dashboard/cover-letters",
    icon: MessageSquareText,
    label: "Cover Letters",
  },
  {
    title: "Choose a layout with real structure.",
    description: "Preview polished A4 designs with your content before committing to a template.",
    href: "/dashboard/templates",
    icon: LayoutTemplate,
    label: "Templates",
  },
  {
    title: "Learn from the work already in motion.",
    description: "Understand which documents and opportunities are creating momentum across your search.",
    href: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
    label: "Analytics",
  },
];
export function FeatureGridSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const featureItems = FEATURES.map((fallback, index) => ({
    ...fallback,
    ...(content?.items?.[index] ?? {}),
  }));
  return (
    <section id="features" className="studio-features">
      <div className="studio-container">
        <div className="studio-section-heading">
          <p className="studio-eyebrow">YOUR TOOLKIT</p>
          <h2>
            {content?.title || (
              <>
                A place for your
                <br />
                <em>work in progress.</em>
              </>
            )}
          </h2>
          <p>
            {content?.description ||
              "Useful tools, thoughtfully connected. From the first draft to the next conversation."}
          </p>
        </div>
        <div className="studio-feature-list">
          {featureItems.map((item, index) => {
            const base = FEATURES[index]!;
            const Icon = base.icon;
            return (
              <Link
                href={
                  "href" in item && typeof item.href === "string"
                    ? item.href
                    : base.href
                }
                className={`studio-feature-row toolkit-card toolkit-card-${index % 3}`}
                key={index}
              >
                <span className="studio-feature-icon">
                  <Icon size={24} strokeWidth={1.4} />
                </span>
                <div>
                  <span className="studio-eyebrow">{base.label}</span>
                  <h3>{String(item.title)}</h3>
                  <p>{String(item.description)}</p>
                </div>
                <div className="toolkit-art" aria-hidden="true">
                  {index % 3 === 0 ? <div className="toolkit-paper"><span>YOUR NAME</span><strong>A story worth telling.</strong><i/><i/><i/><div><span>Experience</span><span>Skills</span><span>Education</span></div></div> : index % 3 === 1 ? <div className="toolkit-keywords"><span>React</span><span>Design systems</span><span>Collaboration</span><small>A clearer picture of your fit</small></div> : <div className="toolkit-progress"><span><i/> Preparing</span><span><i/> Applied</span><span><i/> Interview</span></div>}
                </div>
                <ArrowUpRight size={24} className="studio-feature-arrow" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
