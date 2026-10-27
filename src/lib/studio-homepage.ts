import type { ManagedHomepageSection } from "./homepage";
const LEGACY: Record<
  string,
  { title: string; description: string; items?: [string, string][] }
> = {
  hero: {
    title: "Build a job-winning resume with AI.",
    description:
      "Create, tailor, score, and export a professional resume in minutes. ProfileAI helps you beat applicant tracking systems and land more interviews.",
  },
  features: {
    title: "Everything you need to land the interview",
    description:
      "Six powerful tools, one simple workflow. Built for job seekers who want to stop guessing and start getting callbacks.",
    items: [
      [
        "AI resume generation",
        "Create a focused resume from your experience and the job description.",
      ],
      [
        "Instant ATS score",
        "See a clear score and practical improvements before you apply.",
      ],
      [
        "Premium templates",
        "Choose from 50 résumé and 50 CV designs, including 40 new layouts with distinct structures and palettes.",
      ],
      [
        "One-click export",
        "Export polished PDF and DOCX files for people and ATS parsers.",
      ],
      [
        "Cover letters that match",
        "Generate a role-specific letter aligned with your resume.",
      ],
      [
        "Application tracker",
        "Track statuses, follow-ups, notes and interview reminders.",
      ],
    ],
  },
  workflow: {
    title: "From blank page to interview-ready in 4 steps",
    description:
      "A guided workflow designed to remove the friction between you and your next job.",
    items: [
      [
        "Create your free account",
        "Sign up in seconds and keep your work securely saved.",
      ],
      [
        "Tell us about the role",
        "Paste the job description and add your background.",
      ],
      [
        "Tailor and score",
        "Edit every section and improve your ATS match in real time.",
      ],
      ["Export and apply", "Download your resume and track the application."],
    ],
  },
  finalCta: {
    title: "Your next interview starts with a better resume.",
    description:
      "Create tailored resumes, beat ATS filters and apply with confidence.",
  },
};
/** Upgrade only shipped values. Authored fields and links survive independently. */
export function studioSection(
  section: ManagedHomepageSection,
): ManagedHomepageSection {
  const legacy = LEGACY[section.id];
  if (!legacy) return section;
  const items = section.items?.map((item) =>
    item.title === "Premium templates" &&
    item.description ===
      "Choose from 30 résumé and 30 CV designs, each editable and recruiter-friendly."
      ? {
          ...item,
          description:
            "Choose from 50 résumé and 50 CV designs, including 40 new layouts with distinct structures and palettes.",
          ...(item.label === "60 designs" ? { label: "100 designs" } : {}),
        }
      : item,
  );
  const hasDefaultItems =
    legacy.items &&
    items?.length === legacy.items.length &&
    items.every(
      (item, index) =>
        item.title === legacy.items![index][0] &&
        item.description === legacy.items![index][1],
    );
  const hasDefaultCta =
    section.primaryCta?.label === "Get Started Free" &&
    section.primaryCta.href === "/register";
  const hasLegacyDescription =
    section.description === legacy.description ||
    (section.id === "hero" &&
      section.description ===
        "Create, tailor, score, and export a professional resume in minutes. ProFile AI helps you beat applicant tracking systems and land more interviews.");
  return {
    ...section,
    title: section.title === legacy.title ? "" : section.title,
    description: hasLegacyDescription ? "" : section.description,
    items: hasDefaultItems ? undefined : items,
    primaryCta: hasDefaultCta ? undefined : section.primaryCta,
  };
}
