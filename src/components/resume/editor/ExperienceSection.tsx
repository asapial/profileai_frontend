"use client";

import { useState } from "react";
import { Briefcase, Plus, Sparkles, Trash2 } from "lucide-react";
import type {
  ResumeDetail,
  ResumeExperience,
} from "@/lib/hooks/useResumes";

type Props = {
  experiences: ResumeExperience[];
  onChange: (next: ResumeExperience[]) => void;
  onAiRewrite: (
    experienceId: string,
    instruction: string
  ) => Promise<void> | void;
};

function newExperience(): ResumeExperience {
  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""],
  };
}

export function ExperienceSection({ experiences, onChange, onAiRewrite }: Props) {
  const [aiTarget, setAiTarget] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [rewritingId, setRewritingId] = useState<string | null>(null);

  function patch(id: string | number, patch: Partial<ResumeExperience>) {
    onChange(
      experiences.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  function patchBullet(id: string | number, index: number, value: string) {
    onChange(
      experiences.map((e) => {
        if ((e.id ?? -1) !== id && e.id !== id) return e;
        const bullets = [...(e.bullets ?? [])];
        bullets[index] = value;
        return { ...e, bullets };
      })
    );
  }

  function addBullet(id: string | number) {
    onChange(
      experiences.map((e) =>
        (e.id ?? -1) === id || e.id === id
          ? { ...e, bullets: [...(e.bullets ?? []), ""] }
          : e
      )
    );
  }

  function removeBullet(id: string | number, index: number) {
    onChange(
      experiences.map((e) => {
        if ((e.id ?? -1) !== id && e.id !== id) return e;
        const bullets = (e.bullets ?? []).filter((_, i) => i !== index);
        return { ...e, bullets: bullets.length ? bullets : [""] };
      })
    );
  }

  async function commitRewrite(id: string) {
    if (!aiInstruction.trim()) return;
    setRewritingId(id);
    try {
      await onAiRewrite(id, aiInstruction.trim());
      setAiTarget(null);
      setAiInstruction("");
    } finally {
      setRewritingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-violet-500" />
          <h3 className="text-base font-semibold">Experience</h3>
        </div>
        <button
          type="button"
          onClick={() => onChange([...experiences, newExperience()])}
          className="flex items-center gap-1 rounded-md border border-dashed border-violet-300 px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add role
        </button>
      </header>

      <div className="space-y-4">
        {experiences.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No experience yet. Add your first role above.
          </p>
        ) : null}
        {experiences.map((e, idx) => (
          <div
            key={e.id ?? idx}
            className="space-y-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <input
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  value={e.title ?? ""}
                  placeholder="Job title"
                  onChange={(ev) => patch(e.id ?? idx, { title: ev.target.value })}
                />
                <input
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  value={e.company ?? ""}
                  placeholder="Company"
                  onChange={(ev) => patch(e.id ?? idx, { company: ev.target.value })}
                />
                <input
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  value={e.location ?? ""}
                  placeholder="Location"
                  onChange={(ev) => patch(e.id ?? idx, { location: ev.target.value })}
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
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
                    value={e.endDate ?? ""}
                    disabled={e.current}
                    onChange={(ev) => patch(e.id ?? idx, { endDate: ev.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                aria-label="Remove role"
                onClick={() =>
                  onChange(experiences.filter((x) => (x.id ?? x) !== (e.id ?? e)))
                }
                className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Highlights
              </span>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-input"
                  checked={e.current ?? false}
                  onChange={(ev) => patch(e.id ?? idx, { current: ev.target.checked })}
                />
                I currently work here
              </label>
            </div>

            <div className="space-y-2">
              {(e.bullets ?? []).map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <textarea
                    rows={2}
                    value={b}
                    placeholder="Describe a quantifiable achievement or impact."
                    onChange={(ev) => patchBullet(e.id ?? idx, i, ev.target.value)}
                    className="flex-1 resize-y rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  />
                  <button
                    type="button"
                    aria-label="Remove highlight"
                    onClick={() => removeBullet(e.id ?? idx, i)}
                    className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addBullet(e.id ?? idx)}
                className="flex items-center gap-1 text-xs font-medium text-violet-600"
              >
                <Plus className="h-3 w-3" /> Add highlight
              </button>
            </div>

            <div className="rounded-md bg-muted/50 p-2">
              {aiTarget === (e.id ?? `__idx_${idx}`) ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={aiInstruction}
                    onChange={(ev) => setAiInstruction(ev.target.value)}
                    placeholder='e.g. "Make this more metric-driven" or "Tailor toward product engineering roles"'
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiTarget(null);
                        setAiInstruction("");
                      }}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void commitRewrite(e.id ?? `__idx_${idx}`)}
                      disabled={rewritingId === (e.id ?? `__idx_${idx}`)}
                      className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-violet-700 disabled:opacity-60"
                    >
                      <Sparkles className="h-3 w-3" />
                      {rewritingId === (e.id ?? `__idx_${idx}`) ? "Rewriting…" : "Rewrite"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAiTarget(e.id ?? `__idx_${idx}`)}
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  <Sparkles className="h-3 w-3" /> AI rewrite highlights
                </button>
              )}
            </div>
            {idx < experiences.length - 1 ? null : null}
          </div>
        ))}
      </div>
    </section>
  );
}
