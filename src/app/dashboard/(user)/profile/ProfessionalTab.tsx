"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Briefcase,
  GraduationCap,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useProjects } from "@/lib/hooks/useProjects";
import { useReferences } from "@/lib/hooks/useReferences";

type Experience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
};

type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number | null;
};

export function ProfessionalTab() {
  return (
    <div className="space-y-6">
      <ExperienceSection />
      <EducationSection />
      <ProjectsSection />
      <ReferencesSection />
    </div>
  );
}

function ExperienceSection() {
  const [items, setItems] = useState<Experience[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Experience[]>("/user/experiences")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/experiences", { items });
      toast.success("Experience saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const add = () =>
    setItems((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        company: "",
        role: "",
        startDate: "",
        endDate: null,
        current: false,
        description: "",
      },
    ]);

  const remove = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-violet-500" />
            Work experience
          </CardTitle>
          <CardDescription>
            Most recent first. Mark current roles to keep them on top.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No experience yet. Add your first role.
          </p>
        ) : (
          items.map((it, idx) => (
            <ExperienceRow
              key={it.id}
              item={it}
              onChange={(next) =>
                setItems((s) => s.map((row, i) => (i === idx ? next : row)))
              }
              onRemove={() => remove(it.id)}
            />
          ))
        )}
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ExperienceRow({
  item,
  onChange,
  onRemove,
}: {
  item: Experience;
  onChange: (next: Experience) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">Position</p>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          placeholder="Role"
          value={item.role}
          onChange={(e) => onChange({ ...item, role: e.target.value })}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <input
          placeholder="Company"
          value={item.company}
          onChange={(e) => onChange({ ...item, company: e.target.value })}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <input
          type="month"
          value={item.startDate?.slice(0, 7) ?? ""}
          onChange={(e) =>
            onChange({ ...item, startDate: e.target.value + "-01" })
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <input
          type="month"
          disabled={item.current}
          value={item.endDate?.slice(0, 7) ?? ""}
          onChange={(e) =>
            onChange({ ...item, endDate: e.target.value + "-01" })
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
        />
        <textarea
          placeholder="Highlights & responsibilities"
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          rows={2}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 sm:col-span-2"
        />
        <label className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={item.current}
            onChange={(e) => onChange({ ...item, current: e.target.checked })}
            className="h-4 w-4 rounded border-input text-violet-600 focus:ring-violet-500/40"
          />
          I currently work here
        </label>
      </div>
    </div>
  );
}

function EducationSection() {
  const [items, setItems] = useState<Education[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Education[]>("/user/educations")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const add = () =>
    setItems((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        school: "",
        degree: "",
        field: "",
        startYear: new Date().getFullYear(),
        endYear: null,
      },
    ]);
  const remove = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/educations", { items });
      toast.success("Education saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-violet-500" />
            Education
          </CardTitle>
          <CardDescription>Degrees, bootcamps, certifications.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No education added.
          </p>
        ) : (
          items.map((it, idx) => (
            <div
              key={it.id}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium">School</p>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="School"
                  value={it.school}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((r, i) =>
                        i === idx ? { ...r, school: e.target.value } : r
                      )
                    )
                  }
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <input
                  placeholder="Degree"
                  value={it.degree}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((r, i) =>
                        i === idx ? { ...r, degree: e.target.value } : r
                      )
                    )
                  }
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <input
                  placeholder="Field of study"
                  value={it.field}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((r, i) =>
                        i === idx ? { ...r, field: e.target.value } : r
                      )
                    )
                  }
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Start year"
                    value={it.startYear}
                    onChange={(e) =>
                      setItems((s) =>
                        s.map((r, i) =>
                          i === idx
                            ? { ...r, startYear: Number(e.target.value) }
                            : r
                        )
                      )
                    }
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                  <input
                    type="number"
                    placeholder="End year"
                    value={it.endYear ?? ""}
                    onChange={(e) =>
                      setItems((s) =>
                        s.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                endYear: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              }
                            : r
                        )
                      )
                    }
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            </div>
          ))
        )}
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectsSection() {
  const { data } = useProjects();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured projects</CardTitle>
        <CardDescription>
          Highlight personal or open-source work on your resume.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No projects added yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  {p.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                  {p.techStack?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.techStack.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ReferencesSection() {
  const { data } = useReferences();
  return (
    <Card>
      <CardHeader>
        <CardTitle>References</CardTitle>
        <CardDescription>People who can vouch for your work.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No references added yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border p-3 text-sm"
              >
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.relationship}
                  {r.company ? ` · ${r.company}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}