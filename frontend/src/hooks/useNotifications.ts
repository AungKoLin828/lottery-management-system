// src/hooks/useNotifications.ts

import { useCallback, useEffect, useState } from "react";

import type {
  Notification,
  NotificationRole,
} from "@/services/notificationService";

import {
  clearNotifications,
  deleteNotification,
  getNotificationsByRole,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService";

export function useNotifications(role: NotificationRole) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);

  /* ============================================================
     LOAD
  ============================================================ */

  const loadNotifications = useCallback(() => {
    try {
      setLoading(true);

      const data = getNotificationsByRole(role);

      const unread = getUnreadNotificationCount(role);

      setNotifications(data);

      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  /* ============================================================
     INITIAL LOAD + POLLING
  ============================================================ */

  useEffect(() => {
    loadNotifications();

    const handleNotificationCreated = () => {
      loadNotifications();
    };

    const handleNotificationUpdated = () => {
      loadNotifications();
    };

    window.addEventListener(
      "lottery-notification-created",
      handleNotificationCreated,
    );

    window.addEventListener(
      "lottery-notification-updated",
      handleNotificationUpdated,
    );

    const interval = window.setInterval(loadNotifications, 15000);

    return () => {
      window.removeEventListener(
        "lottery-notification-created",
        handleNotificationCreated,
      );

      window.removeEventListener(
        "lottery-notification-updated",
        handleNotificationUpdated,
      );

      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  /* ============================================================
     MARK ONE AS READ
  ============================================================ */

  const markAsRead = useCallback(
    (notificationId: number) => {
      const target = notifications.find(
        (notification) => notification.id === notificationId,
      );

      if (!target) {
        return;
      }

      if (target.read) {
        return;
      }

      try {
        markNotificationAsRead(notificationId);

        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification,
          ),
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [notifications],
  );

  /* ============================================================
     MARK ALL AS READ
  ============================================================ */

  const markAllAsRead = useCallback(() => {
    try {
      markAllNotificationsAsRead(role);

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [role]);

  /* ============================================================
     DELETE
  ============================================================ */

  const removeNotification = useCallback(
    (notificationId: number) => {
      const target = notifications.find(
        (notification) => notification.id === notificationId,
      );

      if (!target) {
        return;
      }

      try {
        deleteNotification(notificationId);

        setNotifications((current) =>
          current.filter((notification) => notification.id !== notificationId),
        );

        if (!target.read) {
          setUnreadCount((current) => Math.max(0, current - 1));
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [notifications],
  );

  /* ============================================================
     CLEAR ALL
  ============================================================ */

  const clearAll = useCallback(() => {
    try {
      clearNotifications(role);

      setNotifications([]);

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [role]);

  /* ============================================================
     RETURN
  ============================================================ */

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
