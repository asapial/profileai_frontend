"use client";

import { ArrowUpRight, Bot, LockKeyhole, MessageCircle, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { AiChatComposer } from "@/components/ai-chat/AiChatComposer";
import { AiChatMessage } from "@/components/ai-chat/AiChatMessage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAiChat } from "@/lib/hooks/useAiChat";
import { track } from "@/lib/analytics";

export function AiChat() {
  const chat = useAiChat();
  const isMobile = useIsMobile();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat.isOpen) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.isOpen, chat.messages, chat.isSending]);

  if (!chat.enabled || chat.isLoadingConfig) return null;

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => { track({ name: "ai_chat_opened", properties: { role: chat.config?.role ?? "VISITOR" } }); chat.setIsOpen(true); }}
        className="group fixed bottom-5 right-5 z-40 h-14 overflow-visible rounded-full border border-white/20 bg-slate-950 px-3 text-white shadow-[0_24px_60px_-16px_rgba(79,70,229,0.75)] transition duration-300 hover:-translate-y-1 hover:bg-slate-900 hover:shadow-[0_28px_70px_-15px_rgba(124,58,237,0.85)] md:bottom-7 md:right-7 md:px-4"
        aria-label={`Open ${chat.config?.title ?? "ProFile Assistant"}`}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-violet-500/40 blur-xl transition group-hover:bg-fuchsia-500/50" />
        <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-inner">
          <MessageCircle className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
        </span>
        <span className="hidden pr-1 text-sm font-semibold tracking-tight md:inline">Career Assistant</span>
      </Button>

      <Sheet open={chat.isOpen} onOpenChange={chat.setIsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[100svh] w-full gap-0 overflow-hidden p-0" : "w-full gap-0 overflow-hidden p-0 sm:max-w-[460px]"}
          aria-describedby="ai-chat-description"
        >
          <SheetHeader className="relative overflow-hidden border-b border-white/70 bg-white/80 px-5 pb-4 pt-5 pr-14 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80">
            <div className="pointer-events-none absolute -left-16 -top-24 size-52 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 top-4 size-40 rounded-full bg-fuchsia-400/15 blur-3xl" />
            <div className="relative flex items-center gap-3.5">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 via-violet-900 to-violet-600 text-white shadow-[0_12px_30px_-10px_rgba(109,40,217,0.7)] dark:from-white dark:via-violet-100 dark:to-fuchsia-200 dark:text-slate-950">
                <Sparkles className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base tracking-tight">{chat.config?.title}</SheetTitle>
                  <span className="rounded-full border border-violet-200/80 bg-violet-50/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200">AI</span>
                </div>
                <SheetDescription id="ai-chat-description" className="mt-0.5 truncate text-xs">
                  {chat.config?.role === "ADMIN" ? "Permission-aware analysis and drafts" : chat.config?.role === "USER" ? "Private guidance for your career workspace" : "Product, template and ATS guidance"}
                </SheetDescription>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" className="rounded-xl text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10" onClick={() => void chat.clear()} aria-label="Clear conversation"><Trash2 className="size-4" /></Button>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <LockKeyhole className="size-3" /> Secure context · You control every action
            </div>
          </SheetHeader>

          <div className="relative flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.96))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.10),transparent_70%)]" />
            <div className="relative flex-1 overflow-y-auto px-4 py-5" aria-live="polite" aria-relevant="additions text">
              <div className="space-y-4">
                {chat.messages.map((message) => (
                  <AiChatMessage
                    key={message.id}
                    message={message}
                    onSend={(value) => void chat.send(value)}
                    onNavigate={chat.navigate}
                    onConfirm={chat.confirmAction}
                    onCancel={chat.cancelAction}
                    onFeedback={chat.feedback}
                  />
                ))}

                {chat.messages.length <= 1 && chat.quickActions.length ? (
                  <div className="grid gap-2 pt-1">
                    <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Suggested for this page</p>
                    {chat.quickActions.map((action) => (
                      <button key={action} type="button" className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left text-sm font-medium shadow-[0_8px_28px_-20px_rgba(15,23,42,0.45)] backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-[0_14px_34px_-18px_rgba(124,58,237,0.38)] dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-violet-500/50 dark:hover:bg-white/[0.08]" onClick={() => void chat.send(action)}>
                        <span>{action}</span><ArrowUpRight className="size-4 shrink-0 text-slate-400 transition group-hover:text-violet-600" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {chat.isSending ? (
                  <div className="flex items-end gap-2.5">
                    <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950"><Sparkles className="size-3.5" /></div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200/80 bg-white/90 px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                      {[0, 1, 2].map((dot) => <span key={dot} className="size-1.5 animate-pulse rounded-full bg-violet-500" style={{ animationDelay: `${dot * 160}ms` }} />)}
                      <span className="sr-only">ProFile Assistant is thinking</span>
                    </div>
                  </div>
                ) : null}

                {chat.error ? (
                  <div role="alert" className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white/90 shadow-[0_12px_35px_-22px_rgba(225,29,72,0.4)] dark:border-rose-900/60 dark:bg-rose-950/20">
                    <div className="flex items-start gap-3 p-4">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"><Bot className="size-4" /></div>
                      <div className="min-w-0 flex-1"><p className="font-semibold text-foreground">Couldn&apos;t complete that</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{chat.error.message}</p></div>
                    </div>
                    {chat.error.retryable && chat.retry ? <div className="border-t border-rose-100 px-4 py-3 dark:border-rose-900/50"><Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => void chat.retry?.()}><RotateCcw className="size-3.5" />Try again</Button></div> : null}
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            </div>

            <AiChatComposer
              value={chat.composer}
              onChange={chat.setComposer}
              onSend={() => void chat.send()}
              onCancel={chat.cancelGeneration}
              isSending={chat.isSending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
