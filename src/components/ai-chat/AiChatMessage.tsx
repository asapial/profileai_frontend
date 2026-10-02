"use client";

import Link from "next/link";
import { Check, ExternalLink, FilePenLine, LifeBuoy, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { AiChatSuggestedAction, AiChatUiMessage } from "@/types/aiChat";

type Props = {
  message: AiChatUiMessage;
  onSend: (message: string) => void;
  onNavigate: (route: string) => void;
  onConfirm: (token: string) => Promise<unknown>;
  onCancel: (token: string) => Promise<void>;
  onFeedback: (messageId: string, rating: -1 | 1) => Promise<unknown>;
};

const routeFrom = (action: AiChatSuggestedAction): string | undefined => {
  const value = action.payload?.route ?? action.payload?.targetUrl;
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
};

function PreviewCard({ action }: { action: AiChatSuggestedAction }) {
  const [visible, setVisible] = useState(false);
  const before = typeof action.payload?.before === "string" ? action.payload.before : undefined;
  const after = typeof action.payload?.after === "string" ? action.payload.after : typeof action.payload?.suggestion === "string" ? action.payload.suggestion : undefined;
  return (
    <div className="rounded-xl border border-violet-200/70 bg-violet-50/70 p-3 text-xs dark:border-violet-900/60 dark:bg-violet-950/25">
      <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left font-medium" onClick={() => setVisible((current) => !current)}>
        <FilePenLine className="size-4 text-violet-600" />
        {action.label}
      </button>
      {visible && (
        <div className="space-y-2 border-t border-violet-200/60 pt-2 dark:border-violet-900/60">
          {before && <div><span className="font-semibold text-muted-foreground">Current</span><p className="mt-1 whitespace-pre-wrap line-through opacity-70">{before}</p></div>}
          {after && <div><span className="font-semibold text-violet-700 dark:text-violet-300">Suggested preview</span><p className="mt-1 whitespace-pre-wrap">{after}</p></div>}
          <p className="text-muted-foreground">This is a preview only. Review and apply it in the editor; chat has not changed the document.</p>
        </div>
      )}
    </div>
  );
}

export function AiChatMessage({ message, onSend, onNavigate, onConfirm, onCancel, onFeedback }: Props) {
  const [actionState, setActionState] = useState<"idle" | "working" | "confirmed" | "cancelled">("idle");
  const [feedback, setFeedback] = useState<-1 | 0 | 1>(0);
  const response = message.response;
  const pending = response?.pendingAction;

  const confirm = async () => {
    if (!pending?.confirmationToken) return;
    setActionState("working");
    try { await onConfirm(pending.confirmationToken); setActionState("confirmed"); }
    catch { setActionState("idle"); }
  };
  const cancel = async () => {
    if (!pending?.confirmationToken) return;
    setActionState("working");
    try { await onCancel(pending.confirmationToken); setActionState("cancelled"); }
    catch { setActionState("idle"); }
  };

  return (
    <article className={cn("flex items-end gap-2.5", message.sender === "USER" ? "justify-end" : "justify-start")}>
      {message.sender === "ASSISTANT" ? (
        <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-violet-700 text-white shadow-md dark:from-white dark:to-violet-100 dark:text-slate-950">
          <Sparkles className="size-3.5" />
        </div>
      ) : null}
      <div className={cn(
        "max-w-[86%] rounded-[20px] px-4 py-3 text-sm",
        message.sender === "USER"
          ? "rounded-br-md bg-gradient-to-br from-slate-950 via-violet-950 to-violet-700 text-white shadow-[0_12px_30px_-15px_rgba(109,40,217,0.7)] dark:from-violet-500 dark:to-fuchsia-600"
          : "rounded-bl-md border border-slate-200/80 bg-white/90 text-card-foreground shadow-[0_10px_30px_-22px_rgba(15,23,42,0.42)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06]",
        message.failed && "ring-2 ring-destructive/50",
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

        {response?.sources.length ? (
          <div className="mt-3 border-t border-border/60 pt-2.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {response.sources.map((source, index) => source.targetUrl ? (
                <Button key={`${source.type}-${source.id ?? index}`} asChild size="xs" variant="outline">
                  <Link href={source.targetUrl} onClick={() => track({ name: "ai_chat_help_article_opened", properties: { sourceType: source.type, sourceId: source.id ?? null } })}><ExternalLink className="size-3" />{source.title}</Link>
                </Button>
              ) : <Badge key={`${source.type}-${source.id ?? index}`} variant="secondary">{source.title}</Badge>)}
            </div>
          </div>
        ) : null}

        {response?.suggestedActions.length ? (
          <div className="mt-3 space-y-2">
            {response.suggestedActions.map((action) => {
              if (action.type === "PREVIEW_CHANGE") return <PreviewCard key={action.id} action={action} />;
              const route = routeFrom(action);
              return (
                <Button key={action.id} size="sm" variant="outline" className="mr-1.5 min-h-11 whitespace-normal" onClick={() => route ? onNavigate(route) : onSend(action.label)}>
                  {action.type === "OPEN_SUPPORT_TICKET" ? <LifeBuoy /> : null}{action.label}
                </Button>
              );
            })}
          </div>
        ) : null}

        {pending?.required && pending.confirmationToken ? (
          <div className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
            <p className="font-semibold">Confirmation required</p>
            <p className="mt-1 text-xs leading-relaxed">{pending.summary}</p>
            {pending.warning && <p className="mt-1 text-xs opacity-75">{pending.warning}</p>}
            {actionState === "confirmed" || actionState === "cancelled" ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold">{actionState === "confirmed" ? <Check className="size-4" /> : <X className="size-4" />}{actionState === "confirmed" ? "Confirmed" : "Cancelled"}</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void confirm()} disabled={actionState === "working"}>Confirm</Button>
                <Button size="sm" variant="outline" onClick={() => void cancel()} disabled={actionState === "working"}>Cancel</Button>
              </div>
            )}
          </div>
        ) : null}

        {response?.ui.showUsageWarning && response.usage ? (
          <p className="mt-3 rounded-lg bg-amber-100/70 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {response.usage.remaining} of {response.usage.limit} AI calls remain until {new Date(response.usage.resetAt).toLocaleDateString()}.
          </p>
        ) : null}

        {message.sender === "ASSISTANT" && message.id !== "welcome" ? (
          <div className="mt-3 flex items-center gap-1 border-t border-border/50 pt-2.5">
            <span className="mr-1 text-xs text-muted-foreground">Helpful?</span>
            <Button size="icon-xs" variant={feedback === 1 ? "secondary" : "ghost"} aria-label="Mark response helpful" onClick={() => { setFeedback(1); void onFeedback(message.id, 1); }}><ThumbsUp /></Button>
            <Button size="icon-xs" variant={feedback === -1 ? "secondary" : "ghost"} aria-label="Mark response not helpful" onClick={() => { setFeedback(-1); void onFeedback(message.id, -1); }}><ThumbsDown /></Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
