/*
 * ============================================================
 * SUPPORT TYPES
 * ============================================================
 */

/*
 * ============================================================
 * SENDER TYPE
 * ============================================================
 */

export type SenderType =
  | "PLAYER"
  | "AI"
  | "ADMIN"
  | "SYSTEM";

/*
 * ============================================================
 * CONVERSATION STATUS
 * ============================================================
 */

export type ConversationStatus =
  | "AI"
  | "HUMAN"
  | "CLOSED";

/*
 * ============================================================
 * SUPPORT MESSAGE
 * ============================================================
 *
 * IMPORTANT:
 *
 * Support message ID:
 *   number
 *
 * Conversation ID:
 *   number
 *
 * Sender/user ID:
 *   string
 *
 * because application users use UUID IDs.
 */

export interface SupportMessage {
  id: number;

  conversationId: number;

  senderType: SenderType;

  senderId: string | null;

  message: string;

  intent: string | null;

  confidence:
    | string
    | number
    | null;

  createdAt: string;
}

/*
 * ============================================================
 * SUPPORT CONVERSATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * Conversation ID:
 *   number
 *
 * User ID:
 *   string / UUID
 */

export interface SupportConversation {
  id: number;

  userId: string;

  status: ConversationStatus;

  language: string;

  lastMessageAt: string;

  createdAt: string;

  updatedAt: string;
}