import { Link } from "react-router-dom";
import { Bell, CheckCheck, Settings } from "lucide-react";

import type { NotificationRole } from "@/types/notification";

import type { Notification } from "@/services/notificationService";

import NotificationItem from "./NotificationItem";

/* ============================================================
   TYPES
============================================================ */

interface NotificationDropdownProps {
  role: NotificationRole;

  notifications: Notification[];

  onRead: (notificationId: number) => void;

  onDelete: (notificationId: number) => void;

  onMarkAllRead: () => void;

  onClose: () => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function NotificationDropdown({
  role,
  notifications,
  onRead,
  onDelete,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  /* ============================================================
     UNREAD COUNT
  ============================================================ */

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  /* ============================================================
     NOTIFICATION PAGE
  ============================================================ */

  const pagePath =
    role === "PLAYER" ? "/player/notifications" : "/admin/notifications";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="
        absolute
        right-0
        top-12
        z-[100]
        w-[calc(100vw-2rem)]
        max-w-[400px]
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-2xl
        shadow-slate-300/40
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          px-4
          py-3
        "
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="
              flex
              items-center
              gap-1.5
              rounded-lg
              px-2
              py-1.5
              text-xs
              font-medium
              text-indigo-600
              transition
              hover:bg-indigo-50
            "
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* ======================================================
          NOTIFICATIONS
      ====================================================== */}

      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              px-6
              py-12
              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-slate-100
                text-slate-400
              "
            >
              <Bell size={24} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No notifications
            </p>

            <p className="mt-1 text-xs text-slate-400">
              New updates will appear here.
            </p>
          </div>
        ) : (
          notifications
            .slice(0, 10)
            .map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))
        )}
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* View all */}

          <Link
            to={pagePath}
            onClick={onClose}
            className="
              flex
              items-center
              gap-1.5
              rounded-lg
              px-2
              py-2
              text-xs
              font-semibold
              text-indigo-600
              transition
              hover:bg-indigo-50
            "
          >
            <Bell size={14} />
            View all notifications
          </Link>

          {/* Settings */}

          <button
            type="button"
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-white
              hover:text-slate-600
            "
            title="Notification settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
