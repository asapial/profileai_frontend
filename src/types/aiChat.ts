export type ChatRole = "VISITOR" | "USER" | "ADMIN";
export type ResourceType = "none" | "resume" | "cover_letter" | "application" | "invoice" | "support_ticket" | "user" | "template" | "report";

export type AiChatSource = {
  type: "HELP_ARTICLE" | "CURRENT_PAGE" | "ACCOUNT_DATA";
  id?: string;
  title: string;
  targetUrl?: string;
};

export type AiChatSuggestedAction = {
  id: string;
  label: string;
  type: "NAVIGATE" | "SEND_MESSAGE" | "OPEN_HELP_ARTICLE" | "PREVIEW_CHANGE" | "REQUEST_CONFIRMATION" | "OPEN_SUPPORT_TICKET";
  payload?: Record<string, unknown>;
};

export type AiChatPendingAction = {
  required: boolean;
  actionType?: string;
  confirmationToken?: string;
  summary?: string;
  warning?: string;
};

export type AiChatResponse = {
  answer: string;
  intent: string;
  suggestedActions: AiChatSuggestedAction[];
  sources: AiChatSource[];
  escalation: {
    recommended: boolean;
    reason?: string;
    category?: string;
    priority?: string;
  };
  pendingAction: AiChatPendingAction;
  ui: {
    showUsageWarning: boolean;
    showHumanSupportButton: boolean;
    preserveComposerText: boolean;
  };
  conversationId: string;
  messageId: string;
  role: ChatRole;
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
  };
};

export type AiChatUiMessage = {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  response?: AiChatResponse;
  failed?: boolean;
};

export type AiChatConfig = {
  enabled: boolean;
  role: ChatRole;
  toolsEnabled: boolean;
  title: string;
};

export type AiChatPageContext = {
  route: string;
  resourceType: ResourceType;
  resourceId?: string;
  selectedSection?: string;
};
