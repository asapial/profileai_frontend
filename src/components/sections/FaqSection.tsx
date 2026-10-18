"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  ["What can I do on the Free plan?", "You can save up to 15 applications each month and use 3 alignment analyses, 2 tailored summaries, and 5 application drafts. No card is required to begin."],
  ["Does an alignment score predict an interview?", "No. It is a directional view of how clearly your existing evidence maps to a role—not a guarantee or hiring prediction."],
  ["Will the studio invent achievements or metrics?", "No. ProfileAI is built to clarify your real experience. Suggested claims remain traceable to the source material in your Evidence Bank."],
  ["Does ProFile AI send applications automatically?", "No. Nothing is submitted without you. You review, edit, and choose when and where to send every application."],
  ["Where do discovered jobs come from?", "Jobs can come from sources you choose to track and roles you add yourself. Your workspace keeps the source and status visible."],
  ["Can I take my data with me?", "Yes. Your resumes and workspace information remain yours, with export options designed to keep you in control."],
];

export function FaqSection() {
  return (
    <section className="static-section faq-section" aria-labelledby="faq-title">
      <p className="static-kicker">FAQ</p>
      <h2 id="faq-title">Frequently asked <em>questions.</em></h2>
      <Accordion type="single" collapsible className="faq-list">
        {faqs.map(([question, answer], index) => (
          <AccordionItem value={`item-${index}`} key={question} className="faq-item">
            <AccordionTrigger className="faq-trigger">{question}</AccordionTrigger>
            <AccordionContent className="faq-answer">{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
