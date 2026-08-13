// src/services/notificationService.ts

export type NotificationType =
  | "DEPOSIT_REQUEST"
  | "DEPOSIT_APPROVED"
  | "DEPOSIT_REJECTED"
  | "WITHDRAW_REQUEST"
  | "WITHDRAW_APPROVED"
  | "WITHDRAW_REJECTED"
  | "SYSTEM";

export type NotificationRole = "ADMIN" | "PLAYER";

export interface Notification {
  id: number;

  userId: string;

  role: NotificationRole;

  type: NotificationType;

  title: string;

  message: string;

  referenceId?: string;

  referenceType?: string;

  read: boolean;

  createdAt: string;
}

const STORAGE_KEY = "lottery_notifications";

const NOTIFICATION_CREATED_EVENT = "lottery-notification-created";

const NOTIFICATION_UPDATED_EVENT = "lottery-notification-updated";

/* ============================================================
   INTERNAL HELPERS
============================================================ */

function notifyCreated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_CREATED_EVENT));
  }
}

function notifyUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_UPDATED_EVENT));
  }
}

/* ============================================================
   GET ALL NOTIFICATIONS
============================================================ */

export function getNotifications(): Notification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed: unknown = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Notification[];
  } catch (error) {
    console.error("Failed to read notifications:", error);

    return [];
  }
}

/* ============================================================
   SAVE NOTIFICATIONS
============================================================ */

function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error("Failed to save notifications:", error);
  }
}

/* ============================================================
   GET NOTIFICATIONS BY ROLE
============================================================ */

export function getNotificationsByRole(role: NotificationRole): Notification[] {
  return getNotifications()
    .filter((notification) => notification.role === role)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/* ============================================================
   GET UNREAD COUNT
============================================================ */

export function getUnreadNotificationCount(role: NotificationRole): number {
  return getNotifications().filter(
    (notification) => notification.role === role && !notification.read,
  ).length;
}

/* ============================================================
   CREATE NOTIFICATION
============================================================ */

export function createNotification(params: {
  userId: string;

  role: NotificationRole;

  type: NotificationType;

  title: string;

  message: string;

  referenceId?: string;

  referenceType?: string;
}): Notification {
  const notification: Notification = {
    id: Date.now(),

    userId: params.userId,

    role: params.role,

    type: params.type,

    title: params.title,

    message: params.message,

    referenceId: params.referenceId,

    referenceType: params.referenceType,

    read: false,

    createdAt: new Date().toISOString(),
  };

  const notifications = getNotifications();

  saveNotifications([notification, ...notifications]);

  notifyCreated();

  return notification;
}

/* ============================================================
   MARK ONE NOTIFICATION AS READ
============================================================ */

export function markNotificationAsRead(notificationId: number): void {
  const notifications = getNotifications();

  const target = notifications.find(
    (notification) => notification.id === notificationId,
  );

  if (!target) {
    return;
  }

  if (target.read) {
    return;
  }

  const updatedNotifications = notifications.map((notification) =>
    notification.id === notificationId
      ? {
          ...notification,
          read: true,
        }
      : notification,
  );

  saveNotifications(updatedNotifications);

  notifyUpdated();
}

/* ============================================================
   MARK ALL AS READ
============================================================ */

export function markAllNotificationsAsRead(role: NotificationRole): void {
  const notifications = getNotifications();

  const updatedNotifications = notifications.map((notification) => {
    if (notification.role === role && !notification.read) {
      return {
        ...notification,
        read: true,
      };
    }

    return notification;
  });

  saveNotifications(updatedNotifications);

  notifyUpdated();
}

/* ============================================================
   DELETE NOTIFICATION
============================================================ */

export function deleteNotification(notificationId: number): void {
  const notifications = getNotifications();

  const updatedNotifications = notifications.filter(
    (notification) => notification.id !== notificationId,
  );

  saveNotifications(updatedNotifications);

  notifyUpdated();
}

/* ============================================================
   CLEAR NOTIFICATIONS FOR ROLE
============================================================ */

export function clearNotifications(role: NotificationRole): void {
  const notifications = getNotifications();

  const updatedNotifications = notifications.filter(
    (notification) => notification.role !== role,
  );

  saveNotifications(updatedNotifications);

  notifyUpdated();
}

/* ============================================================
   PLAYER NOTIFICATIONS
============================================================ */

/**
 * Deposit approved
 */
export function notifyPlayerDepositApproved(params: {
  playerId: string;

  depositId: string;

  amount: number;
}): Notification {
  return createNotification({
    userId: params.playerId,

    role: "PLAYER",

    type: "DEPOSIT_APPROVED",

    title: "Deposit Approved",

    message:
      `${params.amount.toLocaleString()} MMK ` +
      "has been added to your wallet.",

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

/**
 * Deposit rejected
 */
export function notifyPlayerDepositRejected(params: {
  playerId: string;

  depositId: string;

  amount: number;

  reason?: string;
}): Notification {
  return createNotification({
    userId: params.playerId,

    role: "PLAYER",

    type: "DEPOSIT_REJECTED",

    title: "Deposit Rejected",

    message:
      `Your deposit request for ` +
      `${params.amount.toLocaleString()} MMK ` +
      `was rejected.${params.reason ? ` ${params.reason}` : ""}`,

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

/**
 * Withdraw approved
 */
export function notifyPlayerWithdrawApproved(params: {
  playerId: string;

  withdrawId: string;

  amount: number;
}): Notification {
  return createNotification({
    userId: params.playerId,

    role: "PLAYER",

    type: "WITHDRAW_APPROVED",

    title: "Withdrawal Approved",

    message:
      `Your withdrawal request for ` +
      `${params.amount.toLocaleString()} MMK ` +
      "has been approved.",

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}

/**
 * Withdraw rejected
 */
export function notifyPlayerWithdrawRejected(params: {
  playerId: string;

  withdrawId: string;

  amount: number;

  reason?: string;
}): Notification {
  return createNotification({
    userId: params.playerId,

    role: "PLAYER",

    type: "WITHDRAW_REJECTED",

    title: "Withdrawal Rejected",

    message:
      `Your withdrawal request for ` +
      `${params.amount.toLocaleString()} MMK ` +
      `was rejected.${params.reason ? ` ${params.reason}` : ""}`,

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}

/* ============================================================
   ADMIN NOTIFICATIONS
============================================================ */

/**
 * New deposit request
 */
export function notifyAdminDepositRequest(params: {
  depositId: string;

  playerId: string;

  playerName: string;

  amount: number;
}): Notification {
  return createNotification({
    userId: "ADMIN",

    role: "ADMIN",

    type: "DEPOSIT_REQUEST",

    title: "New Deposit Request",

    message:
      `${params.playerName} requested ` +
      `${params.amount.toLocaleString()} MMK deposit.`,

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

/**
 * New withdraw request
 */
export function notifyAdminWithdrawRequest(params: {
  withdrawId: string;

  playerId: string;

  playerName: string;

  amount: number;
}): Notification {
  return createNotification({
    userId: "ADMIN",

    role: "ADMIN",

    type: "WITHDRAW_REQUEST",

    title: "New Withdrawal Request",

    message:
      `${params.playerName} requested ` +
      `${params.amount.toLocaleString()} MMK withdrawal.`,

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}
