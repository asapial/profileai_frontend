"use client";

import { Bot, Loader2, MessageCircle, RotateCcw, Sparkles, Trash2 } from "lucide-react";
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
        size="icon-lg"
        onClick={() => { track({ name: "ai_chat_opened", properties: { role: chat.config?.role ?? "VISITOR" } }); chat.setIsOpen(true); }}
        className="fixed bottom-5 right-5 z-40 size-14 rounded-full shadow-[0_18px_50px_-12px_rgba(124,58,237,0.85)] md:bottom-7 md:right-7"
        aria-label={`Open ${chat.config?.title ?? "ProFile Assistant"}`}
      >
        <MessageCircle className="size-6" />
      </Button>

      <Sheet open={chat.isOpen} onOpenChange={chat.setIsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[100svh] w-full gap-0 p-0" : "w-full gap-0 p-0 sm:max-w-md"}
          aria-describedby="ai-chat-description"
        >
          <SheetHeader className="border-b border-border/70 bg-background/80 pr-14 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><Sparkles className="size-5" /></div>
              <div className="min-w-0">
                <SheetTitle>{chat.config?.title}</SheetTitle>
                <SheetDescription id="ai-chat-description" className="truncate">
                  {chat.config?.role === "ADMIN" ? "Permission-aware analysis and drafts" : chat.config?.role === "USER" ? "Secure help for this page and your career workspace" : "Public product and help guidance"}
                </SheetDescription>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" onClick={() => void chat.clear()} aria-label="Clear conversation"><Trash2 /></Button>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-3 py-4" aria-live="polite" aria-relevant="additions text">
              <div className="space-y-3">
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
                  <div className="grid gap-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try asking</p>
                    {chat.quickActions.map((action) => (
                      <Button key={action} type="button" variant="outline" className="min-h-11 justify-start whitespace-normal text-left" onClick={() => void chat.send(action)}>{action}</Button>
                    ))}
                  </div>
                ) : null}

                {chat.isSending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/70 bg-card/85 px-3.5 py-3 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> ProFile Assistant is thinking…
                    </div>
                  </div>
                ) : null}

                {chat.error ? (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm">
                    <div className="flex items-start gap-2"><Bot className="mt-0.5 size-4 shrink-0" /><div><p>{chat.error.message}</p>{chat.error.code && <p className="mt-1 text-xs text-muted-foreground">Code: {chat.error.code}</p>}</div></div>
                    {chat.error.retryable && chat.retry ? <Button type="button" size="sm" variant="outline" className="mt-2 min-h-11" onClick={() => void chat.retry?.()}><RotateCcw />Retry</Button> : null}
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
