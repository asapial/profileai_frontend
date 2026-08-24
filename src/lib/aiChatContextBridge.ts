import type { AiChatPageContext } from "@/types/aiChat";

type ContextOverride = Partial<AiChatPageContext>;
type Listener = (context: ContextOverride) => void;

let current: ContextOverride = {};
const listeners = new Set<Listener>();

export const setAiChatPageContext = (context: ContextOverride): void => {
  current = context;
  for (const listener of listeners) listener(current);
};

export const subscribeAiChatPageContext = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
};
