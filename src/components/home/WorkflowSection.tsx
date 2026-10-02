import type { ManagedHomepageSection } from "@/lib/homepage";
const STEPS = [
  {
    title: "Bring your experience.",
    description:
      "Add your background, skills and the work you’re proud of. Start with what you have.",
  },
  {
    title: "Find the right words.",
    description:
      "Choose a design and tailor your draft to the role. Review every suggestion and make it yours.",
  },
  {
    title: "Make your next move.",
    description:
      "Export your resume and keep track of applications, notes and next steps in one place.",
  },
];
export function WorkflowSection({
  content,
}: {
  content?: ManagedHomepageSection;
}) {
  const steps = content?.items || STEPS;
  return (
    <section id="workflow" className="studio-workflow">
      <div className="studio-container">
        <div className="studio-section-heading">
          <p className="studio-eyebrow">THE PROCESS</p>
          <h2>
            {content?.title || (
              <>
                Less blank page.
                <br />
                <em>More possibility.</em>
              </>
            )}
          </h2>
          <p>
            {content?.description ||
              "A little structure makes the next step easier. Here’s how to get from your experience to your next application."}
          </p>
        </div>
        <ol className="studio-steps">
          {steps.map((step, index) => (
            <li key={index}>

              <h3>{String(step.title)}</h3>
              <p>{String(step.description)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
