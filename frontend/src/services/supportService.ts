/*
 * ============================================================
 * SUPPORT SERVICE
 * ============================================================
 */

import type {
  SupportConversation,
  SupportMessage,
} from "@/types/support";

/*
 * ============================================================
 * SUPPORT SOURCE
 * ============================================================
 */

export type SupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

/*
 * ============================================================
 * CHAT RESPONSE
 * ============================================================
 */

export interface SupportChatResponse {
  success: boolean;

  conversation:
    | SupportConversation
    | null;

  message: SupportMessage;

  escalated: boolean;

  source: SupportSource;

  intent: string | null;

  confidence: number;
}

/*
 * ============================================================
 * CONVERSATION RESPONSE
 * ============================================================
 */

export interface SupportConversationResponse {
  success: boolean;

  conversation:
    | SupportConversation
    | null;

  messages: SupportMessage[];
}

/*
 * ============================================================
 * ADMIN LIST RESPONSE
 * ============================================================
 */

export interface AdminSupportListResponse {
  success: boolean;

  conversations:
    SupportConversation[];
}

/*
 * ============================================================
 * ADMIN MESSAGES RESPONSE
 * ============================================================
 */

export interface AdminSupportMessagesResponse {
  success: boolean;

  conversation:
    SupportConversation;

  messages:
    SupportMessage[];
}

/*
 * ============================================================
 * ADMIN REPLY RESPONSE
 * ============================================================
 */

export interface AdminSupportReplyResponse {
  success: boolean;

  conversation?:
    | SupportConversation
    | null;

  message:
    SupportMessage;
}

/*
 * ============================================================
 * ADMIN CLOSE RESPONSE
 * ============================================================
 */

export interface AdminSupportCloseResponse {
  success: boolean;

  conversation?:
    | SupportConversation
    | null;
}

/*
 * ============================================================
 * API ERROR
 * ============================================================
 */

function getApiErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (
    typeof data ===
      "object" &&
    data !== null
  ) {
    const value =
      data as {
        error?: unknown;
        message?: unknown;
      };

    if (
      typeof value.error ===
      "string"
    ) {
      return value.error;
    }

    if (
      typeof value.message ===
      "string"
    ) {
      return value.message;
    }
  }

  return fallback;
}

/*
 * ============================================================
 * NORMALIZE SOURCE
 * ============================================================
 */

function normalizeSupportSource(
  value: unknown,
): SupportSource {
  switch (value) {
    case "OPENROUTER":
      return "OPENROUTER";

    case "TRAINING":
      return "TRAINING";

    case "HUMAN":
      return "HUMAN";

    default:
      return "HUMAN";
  }
}

/*
 * ============================================================
 * API REQUEST
 * ============================================================
 */

async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          credentials:
            "include",

          ...init,

          headers: {
            "Content-Type":
              "application/json",

            ...(init?.headers ||
              {}),
          },
        },
      );
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to connect to the support service.",
    );
  }

  let data: unknown = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data,
        `Support request failed (${response.status}).`,
      ),
    );
  }

  return data as T;
}

/*
 * ============================================================
 * CHAT
 * ============================================================
 */

async function chat(
  message: string,
): Promise<SupportChatResponse> {
  const trimmed =
    message.trim();

  if (!trimmed) {
    throw new Error(
      "Please enter a support message.",
    );
  }

  const response =
    await api<SupportChatResponse>(
      "/api/support/chat",
      {
        method: "POST",

        body: JSON.stringify({
          message: trimmed,
        }),
      },
    );

  return {
    ...response,

    source:
      normalizeSupportSource(
        response.source,
      ),

    escalated:
      response.escalated ===
      true,

    intent:
      typeof response.intent ===
      "string"
        ? response.intent
        : null,

    confidence:
      Number.isFinite(
        Number(
          response.confidence,
        ),
      )
        ? Number(
            response.confidence,
          )
        : 0,
  };
}

/*
 * ============================================================
 * PLAYER CONVERSATION
 * ============================================================
 */

async function conversation(): Promise<
  SupportConversationResponse
> {
  return api<SupportConversationResponse>(
    "/api/support/conversations",
  );
}

/*
 * ============================================================
 * ADMIN LIST
 * ============================================================
 */

async function adminList(): Promise<
  AdminSupportListResponse
> {
  return api<AdminSupportListResponse>(
    "/api/admin/support",
  );
}

/*
 * ============================================================
 * ADMIN MESSAGES
 * ============================================================
 */

async function adminMessages(
  id: number,
): Promise<AdminSupportMessagesResponse> {
  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid support conversation ID.",
    );
  }

  return api<AdminSupportMessagesResponse>(
    `/api/admin/support/messages?conversationId=${encodeURIComponent(
      String(id),
    )}`,
  );
}

/*
 * ============================================================
 * ADMIN REPLY
 * ============================================================
 */

async function adminReply(
  conversationId: number,
  message: string,
): Promise<AdminSupportReplyResponse> {
  if (
    !Number.isInteger(
      conversationId,
    ) ||
    conversationId <= 0
  ) {
    throw new Error(
      "Invalid support conversation ID.",
    );
  }

  const trimmed =
    message.trim();

  if (!trimmed) {
    throw new Error(
      "Reply message cannot be empty.",
    );
  }

  return api<AdminSupportReplyResponse>(
    "/api/admin/support/reply",
    {
      method: "POST",

      body: JSON.stringify({
        conversationId,
        message: trimmed,
      }),
    },
  );
}

/*
 * ============================================================
 * ADMIN CLOSE
 * ============================================================
 */

async function adminClose(
  conversationId: number,
): Promise<AdminSupportCloseResponse> {
  if (
    !Number.isInteger(
      conversationId,
    ) ||
    conversationId <= 0
  ) {
    throw new Error(
      "Invalid support conversation ID.",
    );
  }

  return api<AdminSupportCloseResponse>(
    "/api/admin/support/close",
    {
      method: "POST",

      body: JSON.stringify({
        conversationId,
      }),
    },
  );
}

/*
 * ============================================================
 * SERVICE
 * ============================================================
 */

export const supportService = {
  chat,

  conversation,

  adminList,

  adminMessages,

  adminReply,

  adminClose,
};