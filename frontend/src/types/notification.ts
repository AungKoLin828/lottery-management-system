export type NotificationRole = "PLAYER" | "ADMIN";

export type NotificationType =
  | "DEPOSIT_REQUEST"
  | "DEPOSIT_APPROVED"
  | "DEPOSIT_REJECTED"
  | "WITHDRAW_REQUEST"
  | "WITHDRAW_APPROVED"
  | "WITHDRAW_REJECTED"
  | "TICKET_PURCHASED"
  | "TICKET_WIN"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "NEW_PLAYER"
  | "RESULT_PUBLISHED"
  | "ANNOUNCEMENT"
  | "SYSTEM";

export type NotificationReferenceType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "TICKET"
  | "TRANSACTION"
  | "RESULT"
  | "PLAYER"
  | "SYSTEM";

export interface Notification {
  id: string;

  userId: string;

  role: NotificationRole;

  type: NotificationType;

  title: string;

  message: string;

  referenceId?: string;

  referenceType?: NotificationReferenceType;

  isRead: boolean;

  createdAt: string;

  readAt?: string;
}
