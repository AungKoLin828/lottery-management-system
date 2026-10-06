import type { SupportConversation, SupportMessage } from "@/types/support";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",

    ...init,

    headers: {
      "Content-Type": "application/json",

      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (
        data as {
          error?: unknown;
        }
      ).error === "string"
        ? (
            data as {
              error: string;
            }
          ).error
        : "Support request failed";

    throw new Error(message);
  }

  return data as T;
}

export const supportService = {
  /* ==========================================================
     PLAYER CHAT
  ========================================================== */

  chat: (message: string) =>
    api<{
      conversation: SupportConversation;

      message: SupportMessage;

      escalated: boolean;

      intent: string | null;

      confidence: number;
    }>("/api/support/chat", {
      method: "POST",

      body: JSON.stringify({
        message,
      }),
    }),

  /* ==========================================================
     PLAYER CURRENT CONVERSATION
  ========================================================== */

  conversation: () =>
    api<{
      conversation: SupportConversation | null;

      messages: SupportMessage[];
    }>("/api/support/conversations"),

  /* ==========================================================
     ADMIN LIST
  ========================================================== */

  adminList: () =>
    api<{
      conversations: SupportConversation[];
    }>("/api/admin/support"),

  /* ==========================================================
     ADMIN MESSAGES
  ========================================================== */

  adminMessages: (id: number) =>
    api<{
      conversation: SupportConversation;

      messages: SupportMessage[];
    }>(
      `/api/admin/support/messages?conversationId=${encodeURIComponent(
        String(id),
      )}`,
    ),

  /* ==========================================================
     ADMIN REPLY
  ========================================================== */

  adminReply: (conversationId: number, message: string) =>
    api<{
      message: SupportMessage;
    }>("/api/admin/support/reply", {
      method: "POST",

      body: JSON.stringify({
        conversationId,
        message,
      }),
    }),

  /* ==========================================================
     ADMIN CLOSE
  ========================================================== */

  adminClose: (conversationId: number) =>
    api<{
      success?: boolean;

      conversation?: SupportConversation;
    }>("/api/admin/support/close", {
      method: "POST",

      body: JSON.stringify({
        conversationId,
      }),
    }),
};
