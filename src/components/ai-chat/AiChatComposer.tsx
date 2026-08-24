"use client";

import { Send, Square } from "lucide-react";
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
    <form onSubmit={submit} className="border-t border-border/70 bg-background/80 p-3 backdrop-blur-xl">
      <label htmlFor="ai-chat-composer" className="sr-only">Message ProFile Assistant</label>
      <div className="flex items-end gap-2 rounded-2xl border border-border/80 bg-card/75 p-2 shadow-sm">
        <textarea
          id="ai-chat-composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          rows={2}
          maxLength={6000}
          placeholder="Ask about this page…"
          className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {isSending ? (
          <Button type="button" size="icon-lg" variant="outline" onClick={onCancel} aria-label="Cancel response generation">
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon-lg" disabled={!value.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line · AI suggestions require your review.</p>
    </form>
  );
}
