"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { safeInterpolate } from "@/lib/resume/interpolate";

const A4_PREVIEW_WIDTH = 794;
const A4_PREVIEW_HEIGHT = 1123;

type RenderableTemplate = {
  id: string;
  name: string;
  htmlLayout: string;
  cssStyles: string;
};

export const TEMPLATE_SAMPLE_DATA: Record<string, unknown> = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  phone: "+1 415 555 0142",
  location: "San Francisco, CA",
  website: "alexmorgan.design",
  linkedIn: "linkedin.com/in/alexmorgan",
  headline: "Senior Product & Technology Leader",
  bio: "Outcome-focused leader with eight years of experience building useful digital products, developing high-performing teams, and turning complex customer needs into measurable growth.",
  skills: ["Product strategy", "Team leadership", "Analytics", "Research", "TypeScript", "AI systems"],
  languages: ["English", "Spanish"],
  experience: [
    {
      role: "Director of Product",
      company: "Northstar Labs",
      from: "2022",
      to: "",
      current: true,
      bullets: [
        "Led a cross-functional portfolio used by 2M+ customers.",
        "Improved activation by 31% through research-led product strategy.",
      ],
    },
    {
      role: "Senior Product Manager",
      company: "Meridian Studio",
      from: "2018",
      to: "2022",
      current: false,
      bullets: ["Launched three enterprise products across global markets."],
    },
  ],
  education: [
    {
      degree: "M.S.",
      field: "Human–Computer Interaction",
      school: "Carnegie Mellon University",
      from: "2016",
      to: "2018",
      gpa: "3.9",
    },
  ],
  certifications: [
    { name: "Product Leadership", issuer: "Reforge", year: "2024" },
  ],
};

export function TemplateDesignPreview({
  template,
  className = "",
  priority = false,
}: {
  template: RenderableTemplate;
  className?: string;
  priority?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendered = useMemo(
    () => safeInterpolate(template.htmlLayout, TEMPLATE_SAMPLE_DATA),
    [template.htmlLayout],
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    const stage = document.createElement("div");

    style.textContent = `
      :host {
        display: block;
        position: relative;
        overflow: hidden;
        background: #ffffff;
        color-scheme: light;
        isolation: isolate;
      }
      *, *::before, *::after { box-sizing: border-box; }
      .profileai-template-stage {
        position: absolute;
        inset: 0 auto auto 0;
        width: ${A4_PREVIEW_WIDTH}px;
        min-height: ${A4_PREVIEW_HEIGHT}px;
        overflow: hidden;
        background: #ffffff;
        transform-origin: top left;
        will-change: transform;
      }
      ${template.cssStyles}
    `;

    stage.className = "profileai-template-stage";
    stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = rendered;
    shadowRoot.replaceChildren(style, stage);

    const resize = () => {
      const width = host.getBoundingClientRect().width;
      if (width <= 0) return;
      stage.style.transform = `scale(${width / A4_PREVIEW_WIDTH})`;
      stage.style.opacity = "1";
    };

    stage.style.opacity = "0";
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => observer.disconnect();
  }, [rendered, template.cssStyles]);

  return (
    <div
      ref={hostRef}
      className={`relative aspect-[210/297] w-full overflow-hidden bg-white ${className}`}
      role="img"
      aria-label={`${template.name} template preview`}
      data-priority-preview={priority || undefined}
    />
  );
}
