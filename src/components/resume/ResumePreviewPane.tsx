"use client";

import { useMemo } from "react";
import {
  Briefcase,
  GraduationCap,
  Languages,
  Sparkles,
} from "lucide-react";
import type { ResumeContentData } from "@/lib/hooks/useResumes";

/**
 * Visual rendering of structured resume content. The real exported PDF uses the
 * template's htmlLayout + cssStyles, but for in-app preview we render a clean,
 * readable layout so the user can review content state across steps.
 */
export function ResumePreviewPane({
  content,
  fullName,
  email,
  headline,
  className = "",
  scale = 1,
}: {
  content: ResumeContentData | null | undefined;
  fullName?: string | null;
  email?: string | null;
  headline?: string | null;
  className?: string;
  scale?: number;
}) {
  const personal = content?.personalInfo ?? {};
  const name =
    fullName ||
    [personal.firstName, personal.lastName].filter(Boolean).join(" ") ||
    "Your Name";
  const mail =
    email || personal.email || "";
  const summary = content?.summary ?? "";
  const experience = content?.experience ?? [];
  const education = content?.education ?? [];
  const skills = content?.skills ?? [];
  const languages = content?.languages ?? [];
  const certifications = content?.certifications ?? [];

  const styleVars = useMemo(
    () => ({ "--resume-scale": String(scale) }) as React.CSSProperties,
    [scale]
  );

  return (
    <div
      className={`theme-paper relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${className}`}
      style={styleVars}
    >
      <div
        className="origin-top text-slate-800 transition-transform"
        style={{ transform: `scale(var(--resume-scale))` }}
      >
        <div className="space-y-5 p-7 text-[13px] leading-relaxed">
          {/* Header */}
          <header className="space-y-1 border-b border-slate-200 pb-4">
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            {(headline || personal.headline) && (
              <p className="text-sm font-medium text-violet-700">
                {headline ?? personal.headline}
              </p>
            )}
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {mail && <li>{mail}</li>}
              {personal.phone && <li>• {personal.phone}</li>}
              {personal.location && <li>• {personal.location}</li>}
              {personal.linkedIn && <li>• {personal.linkedIn}</li>}
              {personal.github && <li>• {personal.github}</li>}
            </ul>
          </header>

          {/* Summary */}
          {summary ? (
            <section>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Summary
              </p>
              <p className="mt-1 text-slate-700">{summary}</p>
            </section>
          ) : null}

          {/* Experience */}
          {experience.length > 0 ? (
            <section>
              <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <Briefcase className="h-3.5 w-3.5" /> Experience
              </p>
              <div className="mt-2 space-y-3">
                {experience.map((exp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {exp.role || "Role"}{" "}
                        <span className="font-normal text-slate-500">
                          {exp.company ? `· ${exp.company}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {[exp.from, exp.to || (exp.current ? "Present" : "")]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 ? (
                      <ul className="list-disc space-y-0.5 pl-5 text-slate-700">
                        {exp.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Education */}
          {education.length > 0 ? (
            <section>
              <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <GraduationCap className="h-3.5 w-3.5" /> Education
              </p>
              <div className="mt-2 space-y-2">
                {education.map((ed, i) => (
                  <div key={i} className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {ed.degree || "Degree"}
                        {ed.field ? `, ${ed.field}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">{ed.school}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {[ed.from, ed.to].filter(Boolean).join(" — ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Skills */}
          {skills.length > 0 ? (
            <section>
              <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <Sparkles className="h-3.5 w-3.5" /> Skills
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Languages */}
          {languages.length > 0 ? (
            <section>
              <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <Languages className="h-3.5 w-3.5" /> Languages
              </p>
              <p className="mt-1 text-slate-700">{languages.join(", ")}</p>
            </section>
          ) : null}

          {/* Certifications */}
          {certifications.length > 0 ? (
            <section>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Certifications
              </p>
              <ul className="mt-1 space-y-0.5 text-slate-700">
                {certifications.map((c, i) => (
                  <li key={i}>
                    {c.name}
                    {c.issuer ? ` — ${c.issuer}` : ""}
                    {c.year ? ` (${c.year})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Empty state */}
          {!(
            summary ||
            experience.length ||
            education.length ||
            skills.length ||
            languages.length ||
            certifications.length
          ) ? (
            <div className="grid h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
              Generated content will appear here.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
