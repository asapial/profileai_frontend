"use client";

import { useMemo } from "react";
import type { ResumeDetail } from "@/lib/hooks/useResumes";
import { safeInterpolate } from "@/lib/resume/interpolate";
import { normalizeContentData, toTemplateData } from "@/lib/resume/normalize";
import { ResumePreviewPane } from "@/components/resume/ResumePreviewPane";

/**
 * In-app preview that uses the resume's chosen template design
 * (htmlLayout + cssStyles), interpolating the same way the public viewer
 * (`/r/[slug]`) does. Falls back to the generic `ResumePreviewPane` when
 * the template can't be loaded — so users always see *something*.
 */
export function TemplateRenderedPreview({
  resume,
  scale = 1,
  className = "",
}: {
  resume: ResumeDetail;
  scale?: number;
  className?: string;
}) {
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

  const styleVars = useMemo(
    () => ({ "--resume-scale": String(scale) }) as React.CSSProperties,
    [scale],
  );

  if (!rendered || !resume.template?.cssStyles) {
    // Fallback: keep the previous readable layout so the user is never
    // staring at an empty box.
    return (
      <ResumePreviewPane
        content={content}
        scale={scale}
        className={className}
      />
    );
  }

  return (
    <div
      className={`resume-sheet relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${className}`}
      style={styleVars}
    >
      <div
        className="origin-top transition-transform"
        style={{ transform: `scale(var(--resume-scale))` }}
      >
        <style
          dangerouslySetInnerHTML={{ __html: resume.template.cssStyles }}
        />
        <article
          className="resume-sheet__inner mx-auto w-full"
          style={{ width: "min(210mm, 100%)" }}
        >
          <div dangerouslySetInnerHTML={{ __html: rendered }} />
        </article>
      </div>
    </div>
  );
}
