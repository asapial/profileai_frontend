"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type {
  ResumeEducation,
  ResumeDetail,
} from "@/lib/hooks/useResumes";

type Props = {
  educations: ResumeEducation[];
  onChange: (next: ResumeEducation[]) => void;
};

function newEntry(): ResumeEducation {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    description: "",
  };
}

export function EducationSection({ educations, onChange }: Props) {
  function patch(id: string | number, patch: Partial<ResumeEducation>) {
    onChange(educations.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-violet-500" />
          <h3 className="text-base font-semibold">Education</h3>
        </div>
        <button
          type="button"
          onClick={() => onChange([...educations, newEntry()])}
          className="flex items-center gap-1 rounded-md border border-dashed border-violet-300 px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add school
        </button>
      </header>

      <div className="space-y-3">
        {educations.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No education entries yet.
          </p>
        ) : null}
        {educations.map((e, idx) => (
          <div
            key={e.id ?? idx}
            className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
          >
            <input
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              value={e.institution ?? ""}
              placeholder="Institution"
              onChange={(ev) => patch(e.id ?? idx, { institution: ev.target.value })}
            />
            <input
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              value={e.degree ?? ""}
              placeholder="Degree (e.g. B.Sc.)"
              onChange={(ev) => patch(e.id ?? idx, { degree: ev.target.value })}
            />
            <input
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              value={e.field ?? ""}
              placeholder="Field of study"
              onChange={(ev) => patch(e.id ?? idx, { field: ev.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="month"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                value={e.startDate ?? ""}
                onChange={(ev) => patch(e.id ?? idx, { startDate: ev.target.value })}
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="month"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                value={e.endDate ?? ""}
                onChange={(ev) => patch(e.id ?? idx, { endDate: ev.target.value })}
              />
            </div>
            <textarea
              rows={2}
              className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              placeholder="Honors, thesis, GPA…"
              value={e.description ?? ""}
              onChange={(ev) => patch(e.id ?? idx, { description: ev.target.value })}
            />
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="button"
                aria-label="Remove education"
                onClick={() =>
                  onChange(educations.filter((x) => (x.id ?? x) !== (e.id ?? e)))
                }
                className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
