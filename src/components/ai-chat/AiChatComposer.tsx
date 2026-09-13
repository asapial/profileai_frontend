"use client";

import { ArrowUp, LockKeyhole, Square } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
};

export function AiChatComposer({ value, onChange, onSend, onCancel, isSending }: Props) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };
  return (
    <form onSubmit={submit} className="border-t border-white/70 bg-white/75 p-3.5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75">
      <label htmlFor="ai-chat-composer" className="sr-only">Message ProFile Assistant</label>
      <div className="group flex items-end gap-2 rounded-[22px] border border-slate-200/80 bg-white p-2 shadow-[0_12px_35px_-18px_rgba(15,23,42,0.35)] transition focus-within:border-violet-400 focus-within:shadow-[0_16px_45px_-20px_rgba(124,58,237,0.5)] dark:border-white/10 dark:bg-white/[0.06]">
        <textarea
          id="ai-chat-composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          rows={2}
          maxLength={6000}
          placeholder="Ask your career assistant…"
          className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-relaxed outline-none placeholder:text-slate-400"
        />
        {isSending ? (
          <Button type="button" size="icon-lg" variant="outline" className="rounded-2xl" onClick={onCancel} aria-label="Cancel response generation">
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon-lg" disabled={!value.trim()} className="rounded-2xl bg-slate-950 text-white shadow-lg shadow-violet-500/15 hover:bg-violet-700 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100" aria-label="Send message">
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground">
        <p className="flex items-center gap-1.5"><LockKeyhole className="size-3" />Private, permission-aware context</p>
        <p>{value.length ? `${value.length}/6000` : "Enter to send"}</p>
      </div>
    </form>
  );
}
