import { useCallback, useEffect, useState } from "react";

import type { Notification, NotificationRole } from "@/types/notification";

import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService";

export function useNotifications(role: NotificationRole) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const [notificationData, unread] = await Promise.all([
        getNotifications(role),
        getUnreadNotificationCount(role),
      ]);

      setNotifications(notificationData);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadNotifications();

    const handleNotificationChange = () => {
      loadNotifications();
    };

    window.addEventListener(
      "lottery-notification-created",
      handleNotificationChange,
    );

    window.addEventListener(
      "lottery-notification-updated",
      handleNotificationChange,
    );

    /**
     * Poll every 15 seconds.
     *
     * Later this can be replaced by
     * Socket.IO/WebSocket.
     */
    const interval = window.setInterval(loadNotifications, 15000);

    return () => {
      window.removeEventListener(
        "lottery-notification-created",
        handleNotificationChange,
      );

      window.removeEventListener(
        "lottery-notification-updated",
        handleNotificationChange,
      );

      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : notification,
      ),
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead(role);

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );

    setUnreadCount(0);
  };

  const removeNotification = async (notificationId: string) => {
    const target = notifications.find(
      (notification) => notification.id === notificationId,
    );

    await deleteNotification(notificationId);

    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );

    if (target && !target.isRead) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  };

  const clearAll = async () => {
    await clearNotifications(role);

    setNotifications([]);

    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
}
