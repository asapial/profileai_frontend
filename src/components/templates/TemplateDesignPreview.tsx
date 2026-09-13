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

function escapeStyleEndTag(value: string): string {
  return value.replace(/<\/style/gi, "<\\/style");
}

function copyApplicationStyles(frame: HTMLIFrameElement): void {
  const frameDocument = frame.contentDocument;
  const templateStyle = frameDocument?.querySelector(
    "style[data-template-preview-style]",
  );
  if (!frameDocument || !templateStyle) return;

  frameDocument
    .querySelectorAll("[data-template-app-style]")
    .forEach((source) => source.remove());

  document.head
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((source) => {
      const clone = source.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-template-app-style", "");
      templateStyle.before(clone);
    });
}

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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const rendered = useMemo(
    () => safeInterpolate(template.htmlLayout, TEMPLATE_SAMPLE_DATA),
    [template.htmlLayout],
  );

  const srcDoc = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <style data-template-preview-style>
      html, body {
        margin: 0;
        width: ${A4_PREVIEW_WIDTH}px;
        min-height: ${A4_PREVIEW_HEIGHT}px;
        overflow: hidden;
        background: #ffffff;
        color-scheme: light;
      }
      *, *::before, *::after { box-sizing: border-box; }
      .profileai-template-stage {
        width: ${A4_PREVIEW_WIDTH}px;
        min-height: ${A4_PREVIEW_HEIGHT}px;
        overflow: hidden;
        background: #ffffff;
      }
      ${escapeStyleEndTag(template.cssStyles)}
    </style>
  </head>
  <body>
    <article class="profileai-template-stage">${rendered}</article>
  </body>
</html>`,
    [rendered, template.cssStyles],
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resize = () => {
      const width = host.getBoundingClientRect().width;
      if (width <= 0) return;
      host.style.setProperty(
        "--template-preview-scale",
        String(width / A4_PREVIEW_WIDTH),
      );
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const syncStyles = () => copyApplicationStyles(frame);
    frame.addEventListener("load", syncStyles);
    // The srcDoc may finish loading before React hydrates and attaches an
    // onLoad handler, so always synchronize the already-loaded document too.
    syncStyles();

    return () => frame.removeEventListener("load", syncStyles);
  }, [srcDoc]);

  return (
    <div
      ref={hostRef}
      className={`relative aspect-[210/297] w-full overflow-hidden bg-white ${className}`}
      role="img"
      aria-label={`${template.name} template preview`}
      data-priority-preview={priority || undefined}
      style={
        { "--template-preview-scale": "0.4" } as React.CSSProperties
      }
    >
      <iframe
        ref={frameRef}
        title={`${template.name} template document`}
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        loading={priority ? "eager" : "lazy"}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
        style={{
          width: A4_PREVIEW_WIDTH,
          height: A4_PREVIEW_HEIGHT,
          transform: "scale(var(--template-preview-scale))",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
