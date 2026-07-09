"use client";

import { Sparkles } from "lucide-react";

type Props = {
  value: string;
  targetJobTitle?: string | null;
  onChange: (v: string) => void;
  onAiRewrite: (instruction: string) => Promise<void> | void;
};

export function SummarySection({ value, targetJobTitle, onChange, onAiRewrite }: Props) {
  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <h3 className="text-base font-semibold">Summary</h3>
      </header>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A 2–3 sentence summary that proves why you fit the role."
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            void onAiRewrite(
              targetJobTitle
                ? `Make the summary sharper for the role of ${targetJobTitle}. Keep voice professional.`
                : "Make the summary more concise and outcome-driven."
            )
          }
          className="flex items-center gap-1 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:from-violet-700 hover:to-fuchsia-600"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Rewrite with AI
        </button>
      </div>
    </section>
  );
}
