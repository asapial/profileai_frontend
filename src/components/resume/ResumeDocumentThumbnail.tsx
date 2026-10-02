"use client";

import { useLayoutEffect, useRef } from "react";
import type {
  ResumeContentData,
  ResumeTemplateRef,
} from "@/lib/hooks/useResumes";
import { safeInterpolate } from "@/lib/resume/interpolate";
import { toTemplateData } from "@/lib/resume/normalize";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

type ThumbnailResume = {
  title: string;
  contentData: ResumeContentData;
  template: ResumeTemplateRef | null;
};

function escapeStyleEndTag(value: string): string {
  return value.replace(/<\/style/gi, "<\\/style");
}

/**
 * A responsive, non-interactive A4 thumbnail of the same document rendered in
 * the editor. The iframe prevents dashboard styles from changing the selected
 * template. It uses the same normalized variable projection as the editor.
 */
export function ResumeDocumentThumbnail({ resume }: { resume: ThumbnailResume }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const template = resume.template;

  let rendered: string | null = null;
  if (template?.htmlLayout) {
    try {
      rendered = safeInterpolate(template.htmlLayout, toTemplateData(resume.contentData));
    } catch {
      rendered = null;
    }
  }

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resize = () => {
      const width = host.getBoundingClientRect().width;
      if (width > 0) {
        host.style.setProperty(
          "--resume-thumbnail-scale",
          String(width / A4_WIDTH_PX)
        );
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const srcDoc = rendered && template?.cssStyles
    ? `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light">
    <style data-resume-template-style>
      html, body {
        margin: 0;
        width: ${A4_WIDTH_PX}px;
        min-height: ${A4_HEIGHT_PX}px;
        overflow: hidden;
        background: #fff;
        color-scheme: light;
      }
      *, *::before, *::after { box-sizing: border-box; }
      .profileai-template-stage {
        width: ${A4_WIDTH_PX}px;
        min-height: ${A4_HEIGHT_PX}px;
        margin: 0 auto;
      }
      ${escapeStyleEndTag(template.cssStyles)}
    </style>
  </head>
  <body>
    <article class="profileai-template-stage">${rendered}</article>
  </body>
</html>`
    : null;

  return (
    <div
      ref={hostRef}
      className="relative aspect-[210/297] w-full overflow-hidden bg-white"
      role="img"
      aria-label={`${resume.title} resume preview`}
      style={
        { "--resume-thumbnail-scale": "0.4" } as React.CSSProperties
      }
    >
      {srcDoc ? (
        <iframe
          ref={frameRef}
          title={`${resume.title} resume document`}
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            transform: "scale(var(--resume-thumbnail-scale))",
            transformOrigin: "top left",
          }}
        />
      ) : (
        <div className="grid h-full place-items-center bg-amber-50 p-5 text-center text-xs text-amber-900">
          This template preview is unavailable. Open the editor to choose a valid template.
        </div>
      )}
    </div>
  );
}
