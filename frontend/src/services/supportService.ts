import type { SupportConversation, SupportMessage } from "@/types/support";

/* ============================================================
   TYPES
============================================================ */

export type SupportSource = "OPENROUTER" | "TRAINING" | "HUMAN";

/**
 * Response returned by the player support chat endpoint.
 */
export interface SupportChatResponse {
  conversation: SupportConversation;

  message: SupportMessage;

  escalated: boolean;

  source: SupportSource;

  intent: string | null;

  confidence: number;
}

/**
 * Response returned by the player's current
 * conversation endpoint.
 */
export interface SupportConversationResponse {
  conversation: SupportConversation | null;

  messages: SupportMessage[];
}

/**
 * Response returned by admin conversation list.
 */
export interface AdminSupportListResponse {
  conversations: SupportConversation[];
}

/**
 * Response returned by admin conversation messages.
 */
export interface AdminSupportMessagesResponse {
  conversation: SupportConversation;

  messages: SupportMessage[];
}

/**
 * Response returned by admin reply.
 */
export interface AdminSupportReplyResponse {
  message: SupportMessage;
}

/**
 * Response returned by admin close.
 */
export interface AdminSupportCloseResponse {
  success?: boolean;

  conversation?: SupportConversation;
}

/* ============================================================
   API ERROR
============================================================ */

interface ApiErrorResponse {
  error?: unknown;

  message?: unknown;
}

/* ============================================================
   HELPERS
============================================================ */

/**
 * Extract a useful error message from an API response.
 */
function getApiErrorMessage(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Support request failed";
  }

  const errorData = data as ApiErrorResponse;

  if (typeof errorData.error === "string" && errorData.error.trim()) {
    return errorData.error;
  }

  if (typeof errorData.message === "string" && errorData.message.trim()) {
    return errorData.message;
  }

  return "Support request failed";
}

/**
 * Runtime validation for the support source.
 *
 * This prevents unexpected backend values from
 * breaking the frontend.
 */
function normalizeSupportSource(value: unknown): SupportSource {
  if (value === "OPENROUTER") {
    return "OPENROUTER";
  }

  if (value === "TRAINING") {
    return "TRAINING";
  }

  if (value === "HUMAN") {
    return "HUMAN";
  }

  /*
   * The backend should always return a valid
   * source. If an old backend is temporarily
   * deployed without `source`, treat the
   * response as OPENROUTER for backward
   * compatibility.
   */
  return "OPENROUTER";
}

/**
 * Generic API request helper.
 */
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      credentials: "include",

      ...init,

      headers: {
        "Content-Type": "application/json",

        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    /*
     * Network-level error.
     */
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to connect to support service.");
  }

  /*
   * Some backend errors may return an
   * empty response body.
   */
  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data));
  }

  return data as T;
}

/* ============================================================
   SUPPORT SERVICE
============================================================ */

export const supportService = {
  /* ==========================================================
     PLAYER CHAT
  ========================================================== */

  chat: (message: string): Promise<SupportChatResponse> =>
    api<SupportChatResponse>("/api/support/chat", {
      method: "POST",

      body: JSON.stringify({
        message,
      }),
    }).then(
      (response): SupportChatResponse => ({
        ...response,

        /*
         * Normalize source at the service
         * boundary so all frontend consumers
         * receive a valid value.
         */
        source: normalizeSupportSource(response?.source),

        /*
         * Keep confidence predictable.
         */
        confidence:
          typeof response?.confidence === "number" ? response.confidence : 0,

        /*
         * Keep intent predictable.
         */
        intent: typeof response?.intent === "string" ? response.intent : null,
      }),
    ),

  /* ==========================================================
     PLAYER CURRENT CONVERSATION
  ========================================================== */

  conversation: (): Promise<SupportConversationResponse> =>
    api<SupportConversationResponse>("/api/support/conversations"),

  /* ==========================================================
     ADMIN LIST
  ========================================================== */

  adminList: (): Promise<AdminSupportListResponse> =>
    api<AdminSupportListResponse>("/api/admin/support"),

  /* ==========================================================
     ADMIN MESSAGES
  ========================================================== */

  adminMessages: (id: number): Promise<AdminSupportMessagesResponse> => {
    if (!Number.isInteger(id) || id <= 0) {
      return Promise.reject(new Error("Invalid conversation ID."));
    }

    return api<AdminSupportMessagesResponse>(
      `/api/admin/support/messages?conversationId=${encodeURIComponent(
        String(id),
      )}`,
    );
  },

  /* ==========================================================
     ADMIN REPLY
  ========================================================== */

  adminReply: (
    conversationId: number,
    message: string,
  ): Promise<AdminSupportReplyResponse> => {
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return Promise.reject(new Error("Invalid conversation ID."));
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return Promise.reject(new Error("Message cannot be empty."));
    }

    return api<AdminSupportReplyResponse>("/api/admin/support/reply", {
      method: "POST",

      body: JSON.stringify({
        conversationId,

        message: trimmedMessage,
      }),
    });
  },

  /* ==========================================================
     ADMIN CLOSE
  ========================================================== */

  adminClose: (conversationId: number): Promise<AdminSupportCloseResponse> => {
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return Promise.reject(new Error("Invalid conversation ID."));
    }

    return api<AdminSupportCloseResponse>("/api/admin/support/close", {
      method: "POST",

      body: JSON.stringify({
        conversationId,
      }),
    });
  },
};
