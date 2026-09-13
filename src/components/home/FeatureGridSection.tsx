import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  ScanLine,
  BriefcaseBusiness,
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
    href: "/dashboard/applications",
    icon: BriefcaseBusiness,
    label: "Application tracker",
  },
];
export function FeatureGridSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  return (
    <section id="features" className="studio-features">
      <div className="studio-container">
        <div className="studio-section-heading" data-aos="fade-up">
          <p className="studio-eyebrow">02 / YOUR TOOLKIT</p>
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
          {(content?.items || FEATURES).map((item, index) => {
            const base = FEATURES[index % FEATURES.length];
            const Icon = base.icon;
            return (
              <Link
                href={
                  "href" in item && typeof item.href === "string"
                    ? item.href
                    : content?.items
                      ? "/dashboard"
                      : base.href
                }
                className="studio-feature-row"
                key={index}
                data-aos="fade-up"
              >
                <span className="studio-feature-icon">
                  <Icon size={24} strokeWidth={1.4} />
                </span>
                <div>
                  <span className="studio-eyebrow">{base.label}</span>
                  <h3>{String(item.title)}</h3>
                  <p>{String(item.description)}</p>
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
