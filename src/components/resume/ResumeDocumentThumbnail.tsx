"use client";

import { useLayoutEffect, useRef } from "react";
import type {
  ResumeContentData,
  ResumeTemplateRef,
} from "@/lib/hooks/useResumes";
import { interpolateWithTokens } from "@/lib/resume/interpolate";
import { ResumePreviewPane } from "@/components/resume/ResumePreviewPane";

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

function copyApplicationStyles(frame: HTMLIFrameElement): void {
  const frameDocument = frame.contentDocument;
  const templateStyle = frameDocument?.querySelector(
    "style[data-resume-template-style]"
  );
  if (!frameDocument || !templateStyle) return;

  frameDocument
    .querySelectorAll("[data-resume-app-style]")
    .forEach((source) => source.remove());

  // The editor lives in the application document, so its template HTML can
  // use both template CSS and global utility/font styles. Clone those same
  // style sources into the isolated preview before the template stylesheet.
  const styleSources = document.head.querySelectorAll(
    'link[rel="stylesheet"], style'
  );
  styleSources.forEach((source) => {
    const clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-resume-app-style", "");
    templateStyle.before(clone);
  });
}

/**
 * A responsive, non-interactive A4 thumbnail of the same document rendered in
 * the editor. The iframe prevents one resume template's CSS from affecting
 * another card, while copied app stylesheet links preserve utility classes and
 * fonts that the editor's template HTML relies on.
 */
export function ResumeDocumentThumbnail({ resume }: { resume: ThumbnailResume }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const template = resume.template;

  let rendered: string | null = null;
  if (template?.htmlLayout) {
    try {
      rendered = interpolateWithTokens(template.htmlLayout, [
        resume.contentData as Record<string, unknown>,
      ]).html;
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
      .resume-sheet__inner {
        width: ${A4_WIDTH_PX}px;
        min-height: ${A4_HEIGHT_PX}px;
        margin: 0 auto;
      }
      ${escapeStyleEndTag(template.cssStyles)}
    </style>
  </head>
  <body>
    <article class="resume-sheet__inner">${rendered}</article>
  </body>
</html>`
    : null;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || !srcDoc) return;

    const syncStyles = () => copyApplicationStyles(frame);
    frame.addEventListener("load", syncStyles);
    syncStyles();

    return () => frame.removeEventListener("load", syncStyles);
  }, [srcDoc]);

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
        <div
          className="absolute left-0 top-0 bg-white"
          style={{
            width: A4_WIDTH_PX,
            minHeight: A4_HEIGHT_PX,
            transform: "scale(var(--resume-thumbnail-scale))",
            transformOrigin: "top left",
          }}
        >
          <ResumePreviewPane
            content={resume.contentData}
            className="min-h-[1123px] rounded-none border-0 shadow-none"
          />
        </div>
      )}
    </div>
  );
}
