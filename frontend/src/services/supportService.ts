import type {
  SupportChatResponse,
  SupportConversation,
  SupportMessage,
} from "@/types/support";

/*
 * ============================================================
 * API ERROR
 * ============================================================
 */

async function parseResponseBody(
  response: Response,
): Promise<Record<string, unknown>> {
  try {
    const data =
      await response.json();

    if (
      data &&
      typeof data === "object"
    ) {
      return data as Record<
        string,
        unknown
      >;
    }
  } catch {
    // Ignore invalid/empty JSON.
  }

  return {};
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
  const response =
    await fetch(url, {
      credentials: "include",

      ...init,

      headers: {
        "Content-Type":
          "application/json",

        ...(init?.headers || {}),
      },
    });

  const data =
    await parseResponseBody(
      response,
    );

  if (!response.ok) {
    const errorMessage =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : `Support request failed (${response.status}).`;

    throw new Error(
      errorMessage,
    );
  }

  return data as T;
}

/*
 * ============================================================
 * ID VALIDATION
 * ============================================================
 */

function validateConversationId(
  id: number,
): number {
  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid conversation ID",
    );
  }

  return id;
}

/*
 * ============================================================
 * SUPPORT SERVICE
 * ============================================================
 */

export const supportService = {
  /*
   * ----------------------------------------------------------
   * PLAYER CHAT
   * ----------------------------------------------------------
   */

  chat: (
    message: string,
  ): Promise<SupportChatResponse> => {
    const trimmed =
      message.trim();

    if (!trimmed) {
      return Promise.reject(
        new Error(
          "Message is required",
        ),
      );
    }

    if (trimmed.length > 2000) {
      return Promise.reject(
        new Error(
          "Message must not exceed 2000 characters",
        ),
      );
    }

    return api<SupportChatResponse>(
      "/api/support/chat",
      {
        method: "POST",

        body: JSON.stringify({
          message: trimmed,
        }),
      },
    );
  },

  /*
   * ----------------------------------------------------------
   * PLAYER ACTIVE CONVERSATION
   * ----------------------------------------------------------
   */

  conversation: () =>
    api<{
      success: boolean;

      conversation:
        | SupportConversation
        | null;

      messages: SupportMessage[];
    }>(
      "/api/support/conversations",
    ),

  /*
   * ----------------------------------------------------------
   * ADMIN LIST
   * ----------------------------------------------------------
   */

  adminList: () =>
    api<{
      success: boolean;

      conversations:
        SupportConversation[];
    }>("/api/admin/support"),

  /*
   * ----------------------------------------------------------
   * ADMIN MESSAGES
   * ----------------------------------------------------------
   */

  adminMessages: (
    id: number,
  ) => {
    validateConversationId(id);

    return api<{
      success: boolean;

      conversation:
        SupportConversation;

      messages: SupportMessage[];
    }>(
      `/api/admin/support/messages?conversationId=${encodeURIComponent(
        String(id),
      )}`,
    );
  },

  /*
   * ----------------------------------------------------------
   * ADMIN REPLY
   * ----------------------------------------------------------
   */

  adminReply: (
    conversationId: number,
    message: string,
  ) => {
    validateConversationId(
      conversationId,
    );

    const trimmed =
      message.trim();

    if (!trimmed) {
      return Promise.reject(
        new Error(
          "Message is required",
        ),
      );
    }

    return api<{
      success: boolean;

      conversation:
        | SupportConversation
        | null;

      message: SupportMessage;
    }>(
      "/api/admin/support/reply",
      {
        method: "POST",

        body: JSON.stringify({
          conversationId,

          message: trimmed,
        }),
      },
    );
  },

  /*
   * ----------------------------------------------------------
   * ADMIN CLOSE
   * ----------------------------------------------------------
   */

  adminClose: (
    conversationId: number,
  ) => {
    validateConversationId(
      conversationId,
    );

    return api<{
      success: boolean;

      conversation:
        | SupportConversation
        | null;
    }>(
      "/api/admin/support/close",
      {
        method: "POST",

        body: JSON.stringify({
          conversationId,
        }),
      },
    );
  },
};