"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Props = {
  title: string;
  items: string[];
  emoji?: string;
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function ChipListSection({ title, items, emoji, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...items, v]);
    setDraft("");
  }

  function remove(value: string) {
    onChange(items.filter((i) => i !== value));
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2">
        {emoji ? <span>{emoji}</span> : null}
        <h3 className="text-base font-semibold">{title}</h3>
      </header>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="group inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => remove(item)}
              className="opacity-60 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">No items yet.</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Add an item"}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-md border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </section>
  );
}
