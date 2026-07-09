"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Save, Sparkles, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Skill = {
  id: string;
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string | null;
};

export function SkillsTab() {
  const [items, setItems] = useState<Skill[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Skill[]>("/user/skills")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setItems((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        name,
        level: "INTERMEDIATE",
        category: null,
      },
    ]);
    setDraft("");
  };

  const remove = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/skills", { items });
      toast.success("Skills saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Skills
        </CardTitle>
        <CardDescription>
          Highlight the skills you want AI to prioritize on resumes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Type a skill and press Enter"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <Button onClick={add} size="sm" variant="outline" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No skills yet. Add at least 5 for best AI suggestions.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label={`Remove ${s.name}`}
                  className="rounded-full p-0.5 hover:bg-violet-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save skills"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Don&apos;t see what you need? Use the trash icon on a skill to remove it
          before saving.
        </p>
      </CardContent>
    </Card>
  );
}