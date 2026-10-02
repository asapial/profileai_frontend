"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { subscribeAiChatPageContext } from "@/lib/aiChatContextBridge";
import type {
  AiChatConfig,
  AiChatPageContext,
  AiChatResponse,
  AiChatUiMessage,
  ChatRole,
  ResourceType,
} from "@/types/aiChat";

const routeResource = (route: string): AiChatPageContext => {
  const patterns: Array<[RegExp, ResourceType]> = [
    [/\/(?:resume|resumes)\/([^/]+)\/edit(?:\/|$)/, "resume"],
    [/\/cover-letters\/([^/]+)(?:\/|$)/, "cover_letter"],
    [/\/applications\/([^/]+)(?:\/|$)/, "application"],
    [/\/admin\/users\/([^/]+)(?:\/|$)/, "user"],
    [/\/templates\/([^/]+)(?:\/|$)/, "template"],
  ];
  for (const [pattern, resourceType] of patterns) {
    const match = route.match(pattern);
    if (match?.[1] && !["create", "new"].includes(match[1])) return { route, resourceType, resourceId: decodeURIComponent(match[1]) };
  }
  return { route, resourceType: "none" };
};

export const isAiChatRouteSupported = (route: string): boolean =>
  /^\/$|^\/(?:pricing|help|login|register|forgot-password|reset-password|verify-email|templates|dashboard|admin|resume)(?:\/|$)/.test(route);

export const quickActionsFor = (role: ChatRole, route: string): string[] => {
  if (role === "VISITOR") {
    if (route.startsWith("/pricing")) return ["Compare the plans", "Which plan fits a focused job search?", "What is included in the free plan?"];
    if (/login|forgot-password|reset-password/.test(route)) return ["I cannot log in", "How does password recovery work?", "How is my data protected?"];
    if (route.startsWith("/templates")) return ["Show me ATS-friendly templates", "Which template fits my profession?", "How do templates work?"];
    return ["How does ATS scoring work?", "How do I create a resume?", "Compare the plans"];
  }
  if (role === "ADMIN") {
    if (route.startsWith("/admin/tickets")) return ["Summarize the current support workspace", "Help me draft a support reply", "Which tickets need attention?"];
    if (route.startsWith("/admin/analytics")) return ["Explain the platform metrics", "Summarize recent AI usage", "What should I investigate?"];
    if (route.startsWith("/admin/feature-flags")) return ["Explain these feature flags", "What are the rollout risks?", "Draft a rollout checklist"];
    return ["Summarize this admin page", "Explain the available metrics", "What should I review next?"];
  }
  if (/resume/.test(route) && /edit/.test(route)) return ["Improve this section", "Find weak language", "Check ATS compatibility", "Make this bullet more measurable"];
  if (route.includes("cover-letters")) return ["Improve the opening", "Make the tone more professional", "Check for unsupported claims"];
  if (route.includes("applications/")) return ["Prepare interview questions", "Summarize the application timeline", "Suggest the next step"];
  if (route.includes("applications")) return ["Which applications need follow-up?", "Help me organize my pipeline", "Explain each status"];
  if (route.includes("billing")) return ["Explain my current plan", "Why did I reach my limit?", "Show available upgrade options"];
  if (route.includes("profile")) return ["Which profile information is missing?", "Improve my professional summary", "Explain my security settings"];
  return ["What should I complete next?", "Why is my AI usage high?", "Show my upcoming application reminders"];
};

const welcomeFor = (role: ChatRole, route: string): string => {
  if (role === "ADMIN") return `I'm your permission-aware Admin Copilot. I can explain ${route.startsWith("/admin") ? "this workspace" : "platform operations"}, summarize authorized context, and prepare drafts. Sensitive changes stay outside chat.`;
  if (role === "USER") return "I'm your ProFile career assistant. I can explain this page and use only account or document context that the backend confirms belongs to you.";
  return "Hi! I'm ProfileAI Assistant. I can explain the product, plans, templates, ATS scoring, account access, and published help resources.";
};

const friendlyChatError = (caught: unknown): { message: string; code?: string; retryable: boolean } => {
  if (!(caught instanceof ApiError)) {
    return {
      message: "The assistant could not connect. Check your connection and try again.",
      code: "CONNECTION_ERROR",
      retryable: true,
    };
  }
  if (caught.status === 401) {
    return { message: "Your session has expired. Sign in again to continue.", code: "SESSION_EXPIRED", retryable: false };
  }
  if (caught.status === 429) {
    return { message: "The assistant is taking a short breather. Please try again in a moment.", code: "RATE_LIMITED", retryable: true };
  }
  if (caught.status >= 500) {
    return { message: "The assistant is temporarily unavailable. Please try again in a moment.", code: "ASSISTANT_UNAVAILABLE", retryable: true };
  }
  return { message: caught.message || "The assistant could not respond.", ...(caught.code ? { code: caught.code } : {}), retryable: caught.retryable };
};

export function useAiChat() {
  const pathname = usePathname();
  const router = useRouter();
  const basePageContext = useMemo(() => routeResource(pathname), [pathname]);
  const [contextOverride, setContextOverride] = useState<Partial<AiChatPageContext>>({});
  const pageContext = useMemo(() => ({ ...basePageContext, ...contextOverride, route: pathname }), [basePageContext, contextOverride, pathname]);
  const supported = isAiChatRouteSupported(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatUiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [composer, setComposer] = useState("");
  const [error, setError] = useState<{ message: string; code?: string; retryable: boolean }>();
  const [lastFailedMessage, setLastFailedMessage] = useState<string>();
  const abortRef = useRef<AbortController | undefined>(undefined);
  const historyLoaded = useRef<string | undefined>(undefined);

  useEffect(() => {
    return subscribeAiChatPageContext(setContextOverride);
  }, [pathname]);

  const configQuery = useQuery({
    queryKey: ["ai-chat-config"],
    queryFn: () => api.get<AiChatConfig>("/ai/chat/config"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const config = configQuery.data;

  useEffect(() => {
    if (!config || historyLoaded.current === config.role) return;
    historyLoaded.current = config.role;
    let active = true;
    const key = `profileai-ai-chat:${config.role}`;
    const saved = window.sessionStorage.getItem(key);
    if (!saved) {
      queueMicrotask(() => {
        if (active) setMessages([{ id: "welcome", sender: "ASSISTANT", content: welcomeFor(config.role, pathname) }]);
      });
      return () => { active = false; };
    }
    void api.get<{ id: string; messages: Array<{ id: string; sender: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL"; content: string; structuredData?: AiChatResponse }> }>(`/ai/chat/${saved}`)
      .then((history) => {
        if (!active) return;
        setConversationId(history.id);
        const restored = history.messages.filter((message) => message.sender === "USER" || message.sender === "ASSISTANT").map((message) => ({ id: message.id, sender: message.sender as "USER" | "ASSISTANT", content: message.content, ...(message.sender === "ASSISTANT" && message.structuredData ? { response: { ...message.structuredData, conversationId: history.id, messageId: message.id, role: config.role } } : {}) }));
        setMessages(restored.length ? restored : [{ id: "welcome", sender: "ASSISTANT", content: welcomeFor(config.role, pathname) }]);
      })
      .catch(() => {
        if (!active) return;
        window.sessionStorage.removeItem(key);
        setMessages([{ id: "welcome", sender: "ASSISTANT", content: welcomeFor(config.role, pathname) }]);
      });
    return () => { active = false; };
  }, [config, pathname]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      return api.post<AiChatResponse>("/ai/chat", {
        ...(conversationId ? { conversationId } : {}),
        message,
        pageContext,
        clientRequestId: crypto.randomUUID(),
      }, { signal: controller.signal });
    },
  });

  const send = useCallback(async (raw?: string) => {
    const message = (raw ?? composer).trim();
    if (!message || sendMutation.isPending || !config?.enabled) return;
    setError(undefined);
    setLastFailedMessage(undefined);
    setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "USER", content: message }]);
    setComposer("");
    try {
      const response = await sendMutation.mutateAsync(message);
      setConversationId(response.conversationId);
      window.sessionStorage.setItem(`profileai-ai-chat:${response.role}`, response.conversationId);
      setMessages((current) => [...current, { id: response.messageId, sender: "ASSISTANT", content: response.answer, response }]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError({ message: "Generation cancelled. Your message is still available to retry.", code: "CANCELLED", retryable: true });
      } else {
        setError(friendlyChatError(caught));
      }
      setLastFailedMessage(message);
      setComposer(message);
      setMessages((current) => current.map((item, index) => index === current.length - 1 && item.sender === "USER" ? { ...item, failed: true } : item));
    } finally {
      abortRef.current = undefined;
    }
  }, [composer, config?.enabled, sendMutation]);

  const clear = useCallback(async () => {
    if (conversationId) await api.delete(`/ai/chat/${conversationId}`).catch(() => undefined);
    if (config) window.sessionStorage.removeItem(`profileai-ai-chat:${config.role}`);
    setConversationId(undefined);
    setMessages(config ? [{ id: crypto.randomUUID(), sender: "ASSISTANT", content: welcomeFor(config.role, pathname) }] : []);
    setError(undefined);
  }, [config, conversationId, pathname]);

  const confirmAction = useCallback(async (token: string) => {
    const result = await api.post<{ ticket?: { id: string; subject: string; status: string } }>("/ai/chat/actions/confirm", { confirmationToken: token, clientRequestId: crypto.randomUUID() });
    setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "ASSISTANT", content: result.ticket ? `Support ticket "${result.ticket.subject}" was created successfully.` : "The confirmed action completed successfully." }]);
    return result;
  }, []);

  const cancelAction = useCallback(async (token: string) => {
    await api.post("/ai/chat/actions/cancel", { confirmationToken: token });
    setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "ASSISTANT", content: "The proposed action was cancelled. Nothing was changed." }]);
  }, []);

  const feedback = useCallback((messageId: string, rating: -1 | 1) =>
    api.post("/ai/chat/feedback", { messageId, rating }), []);

  const retry = useCallback(async () => {
    if (!lastFailedMessage) return;
    setMessages((current) => current.filter((message) => !message.failed));
    await send(lastFailedMessage);
  }, [lastFailedMessage, send]);

  return {
    isOpen, setIsOpen, messages, composer, setComposer, error, config,
    enabled: Boolean(config?.enabled && supported),
    isLoadingConfig: configQuery.isLoading,
    isSending: sendMutation.isPending,
    quickActions: config ? quickActionsFor(config.role, pathname) : [],
    pageContext,
    send,
    retry: lastFailedMessage ? retry : undefined,
    cancelGeneration: () => abortRef.current?.abort(),
    clear,
    confirmAction,
    cancelAction,
    feedback,
    navigate: (route: string) => router.push(route),
  };
}
