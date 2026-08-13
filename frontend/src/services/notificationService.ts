import type {
  Notification,
  NotificationRole,
  NotificationType,
  NotificationReferenceType,
} from "@/types/notification";

const STORAGE_KEY = "lottery_notifications";

const CURRENT_PLAYER_ID = "P001";
const CURRENT_ADMIN_ID = "ADMIN001";

function getStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Notification[];
  } catch (error) {
    console.error("Failed to read notifications:", error);
    return [];
  }
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get notifications for current user.
 */
export async function getNotifications(
  role: NotificationRole,
): Promise<Notification[]> {
  const notifications = getStoredNotifications();

  const userId = role === "PLAYER" ? CURRENT_PLAYER_ID : CURRENT_ADMIN_ID;

  return notifications
    .filter(
      (notification) =>
        notification.userId === userId && notification.role === role,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Get unread notification count.
 */
export async function getUnreadNotificationCount(
  role: NotificationRole,
): Promise<number> {
  const notifications = await getNotifications(role);

  return notifications.filter((notification) => !notification.isRead).length;
}

/**
 * Create notification.
 */
export async function createNotification(params: {
  userId: string;
  role: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
}): Promise<Notification> {
  const notifications = getStoredNotifications();

  const notification: Notification = {
    id: generateId(),

    userId: params.userId,

    role: params.role,

    type: params.type,

    title: params.title,

    message: params.message,

    referenceId: params.referenceId,

    referenceType: params.referenceType,

    isRead: false,

    createdAt: new Date().toISOString(),
  };

  notifications.unshift(notification);

  saveNotifications(notifications);

  window.dispatchEvent(new CustomEvent("lottery-notification-created"));

  return notification;
}

/**
 * Mark one notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const notifications = getStoredNotifications();

  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? {
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }
      : notification,
  );

  saveNotifications(updated);

  window.dispatchEvent(new CustomEvent("lottery-notification-updated"));
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(
  role: NotificationRole,
): Promise<void> {
  const userId = role === "PLAYER" ? CURRENT_PLAYER_ID : CURRENT_ADMIN_ID;

  const notifications = getStoredNotifications();

  const updated = notifications.map((notification) =>
    notification.userId === userId && notification.role === role
      ? {
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? new Date().toISOString(),
        }
      : notification,
  );

  saveNotifications(updated);

  window.dispatchEvent(new CustomEvent("lottery-notification-updated"));
}

/**
 * Delete one notification.
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const notifications = getStoredNotifications();

  const updated = notifications.filter(
    (notification) => notification.id !== notificationId,
  );

  saveNotifications(updated);

  window.dispatchEvent(new CustomEvent("lottery-notification-updated"));
}

/**
 * Delete all notifications for a role.
 */
export async function clearNotifications(
  role: NotificationRole,
): Promise<void> {
  const userId = role === "PLAYER" ? CURRENT_PLAYER_ID : CURRENT_ADMIN_ID;

  const notifications = getStoredNotifications();

  const updated = notifications.filter(
    (notification) =>
      !(notification.userId === userId && notification.role === role),
  );

  saveNotifications(updated);

  window.dispatchEvent(new CustomEvent("lottery-notification-updated"));
}

/**
 * ------------------------------------------------------------
 * BUSINESS NOTIFICATION HELPERS
 * ------------------------------------------------------------
 */

export async function notifyAdminDepositRequest(params: {
  depositId: string;
  playerName: string;
  amount: number;
  paymentMethod: string;
}) {
  return createNotification({
    userId: CURRENT_ADMIN_ID,

    role: "ADMIN",

    type: "DEPOSIT_REQUEST",

    title: "New Deposit Request",

    message: `${params.playerName} requested ${params.amount.toLocaleString()} MMK via ${params.paymentMethod}.`,

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

export async function notifyPlayerDepositApproved(params: {
  depositId: string;
  amount: number;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "DEPOSIT_APPROVED",

    title: "Deposit Approved",

    message: `${params.amount.toLocaleString()} MMK has been added to your wallet.`,

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

export async function notifyPlayerDepositRejected(params: {
  depositId: string;
  amount: number;
  reason?: string;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "DEPOSIT_REJECTED",

    title: "Deposit Rejected",

    message: `Your deposit request for ${params.amount.toLocaleString()} MMK was rejected.${
      params.reason ? ` Reason: ${params.reason}` : ""
    }`,

    referenceId: params.depositId,

    referenceType: "DEPOSIT",
  });
}

export async function notifyAdminWithdrawRequest(params: {
  withdrawId: string;
  playerName: string;
  amount: number;
}) {
  return createNotification({
    userId: CURRENT_ADMIN_ID,

    role: "ADMIN",

    type: "WITHDRAW_REQUEST",

    title: "New Withdraw Request",

    message: `${params.playerName} requested a withdrawal of ${params.amount.toLocaleString()} MMK.`,

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}

export async function notifyPlayerWithdrawApproved(params: {
  withdrawId: string;
  amount: number;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "WITHDRAW_APPROVED",

    title: "Withdraw Approved",

    message: `Your withdrawal of ${params.amount.toLocaleString()} MMK has been approved.`,

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}

export async function notifyPlayerWithdrawRejected(params: {
  withdrawId: string;
  amount: number;
  reason?: string;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "WITHDRAW_REJECTED",

    title: "Withdraw Rejected",

    message: `Your withdrawal of ${params.amount.toLocaleString()} MMK was rejected.${
      params.reason ? ` Reason: ${params.reason}` : ""
    }`,

    referenceId: params.withdrawId,

    referenceType: "WITHDRAW",
  });
}

export async function notifyPlayerTicketPurchased(params: {
  ticketId: string;
  lotteryType: "2D" | "3D";
  number: string;
  amount: number;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "TICKET_PURCHASED",

    title: "Ticket Purchased",

    message: `${params.lotteryType} ticket ${params.number} purchased for ${params.amount.toLocaleString()} MMK.`,

    referenceId: params.ticketId,

    referenceType: "TICKET",
  });
}

export async function notifyPlayerTicketWin(params: {
  ticketId: string;
  lotteryType: "2D" | "3D";
  number: string;
  prize: number;
}) {
  return createNotification({
    userId: CURRENT_PLAYER_ID,

    role: "PLAYER",

    type: "TICKET_WIN",

    title: "🎉 Winning Ticket!",

    message: `Congratulations! Your ${params.lotteryType} ticket ${params.number} won ${params.prize.toLocaleString()} MMK.`,

    referenceId: params.ticketId,

    referenceType: "TICKET",
  });
}

export async function notifyAdminNewPlayer(params: {
  playerId: string;
  playerName: string;
}) {
  return createNotification({
    userId: CURRENT_ADMIN_ID,

    role: "ADMIN",

    type: "NEW_PLAYER",

    title: "New Player Registered",

    message: `${params.playerName} has registered as a new player.`,

    referenceId: params.playerId,

    referenceType: "PLAYER",
  });
}
