/*
 * ============================================================
 * SUPPORT TYPES
 * ============================================================
 */

export type SenderType =
  | "PLAYER"
  | "AI"
  | "ADMIN"
  | "SYSTEM";

export type ConversationStatus =
  | "AI"
  | "HUMAN"
  | "CLOSED";

export type SupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

export interface SupportMessage {
  id: number;

  conversationId: number;

  senderType: SenderType;

  /*
   * User IDs are UUID/string.
   */
  senderId: string | null;

  message: string;

  intent: string | null;

  confidence:
    | string
    | number
    | null;

  createdAt: string;
}

export interface SupportConversation {
  /*
   * Conversation database ID is still integer.
   */
  id: number;

  /*
   * Authenticated user ID is UUID/string.
   */
  userId: string;

  status: ConversationStatus;

  language: string;

  lastMessageAt: string;

  createdAt: string;

  updatedAt: string;
}

export interface SupportChatResponse {
  success: boolean;

  conversation: SupportConversation;

  message: SupportMessage;

  escalated: boolean;

  source: SupportSource;

  intent: string | null;

  confidence:
    | number
    | string
    | null;
}