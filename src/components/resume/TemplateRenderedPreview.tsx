"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { ResumeDetail } from "@/lib/hooks/useResumes";
import { safeInterpolate } from "@/lib/resume/interpolate";
import { normalizeContentData, toTemplateData } from "@/lib/resume/normalize";

const DOCUMENT_WIDTH = 794;
const DOCUMENT_HEIGHT = 1123;

/**
 * In-app preview that uses the resume's chosen template design
 * (htmlLayout + cssStyles), interpolating the same way the public viewer
 * (`/r/[slug]`) does. The template runs in an isolated A4 document so
 * dashboard/global styles cannot change its fonts, colours or spacing.
 */
export function TemplateRenderedPreview({
  resume,
  scale = 1,
  fitToContainer = true,
  className = "",
}: {
  resume: ResumeDetail;
  scale?: number;
  fitToContainer?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const content = useMemo(
    () => normalizeContentData(resume.contentData),
    [resume.contentData],
  );

  const rendered = useMemo(() => {
    const tpl = resume.template;
    if (!tpl?.htmlLayout) return null;
    return safeInterpolate(
      tpl.htmlLayout,
      toTemplateData(content),
      undefined,
    );
  }, [resume.template, content]);

  const srcDoc = useMemo(() => !rendered || !resume.template?.cssStyles ? null : `<!doctype html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><style>
@page{size:A4;margin:0}html,body{margin:0;width:${DOCUMENT_WIDTH}px;min-height:${DOCUMENT_HEIGHT}px;background:#fff;color-scheme:light;-webkit-print-color-adjust:exact;print-color-adjust:exact}*,*::before,*::after{box-sizing:border-box}.profileai-template-stage{width:${DOCUMENT_WIDTH}px;min-height:${DOCUMENT_HEIGHT}px;background:#fff;overflow:hidden}${resume.template.cssStyles.replace(/<\/style/gi, "<\\/style")}
</style></head><body><main class="profileai-template-stage">${rendered}</main></body></html>`, [rendered, resume.template]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const frame = frameRef.current;
    if (!host || !frame || !srcDoc) return;
    const sync = () => {
      const available = host.getBoundingClientRect().width;
      const fitted = fitToContainer
        ? Math.min(scale, available / DOCUMENT_WIDTH)
        : scale;
      const contentHeight = Math.max(DOCUMENT_HEIGHT, frame.contentDocument?.documentElement.scrollHeight ?? DOCUMENT_HEIGHT);
      host.style.height = `${contentHeight * fitted}px`;
      frame.style.transform = `scale(${fitted})`;
      frame.style.height = `${contentHeight}px`;
    };
    frame.addEventListener("load", sync);
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    sync();
    return () => { frame.removeEventListener("load", sync); observer.disconnect(); };
  }, [fitToContainer, scale, srcDoc]);

  if (!srcDoc || !resume.template) {
    return (
      <div className={`rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 ${className}`}>
        The selected template cannot be rendered. Choose another template; no substitute design has been applied.
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={`resume-sheet relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${className}`}
      style={
        fitToContainer
          ? { aspectRatio: `${DOCUMENT_WIDTH} / ${DOCUMENT_HEIGHT}` }
          : {
              width: DOCUMENT_WIDTH * scale,
              height: DOCUMENT_HEIGHT * scale,
              flex: "0 0 auto",
            }
      }
    >
      <iframe ref={frameRef} title={`${resume.template.name} document preview`} srcDoc={srcDoc} sandbox="allow-same-origin" className="pointer-events-none absolute left-0 top-0 border-0 bg-white" style={{ width: DOCUMENT_WIDTH, height: DOCUMENT_HEIGHT, transformOrigin: "top left" }} />
    </div>
  );
}
