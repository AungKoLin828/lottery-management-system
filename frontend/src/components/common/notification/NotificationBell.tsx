import { Bell, CheckCheck } from "lucide-react";

import type { Notification, NotificationRole } from "@/types/notification";

import { useEffect, useRef, useState } from "react";

import { useNotifications } from "@/hooks/useNotifications";

import NotificationDropdown from "./NotificationDropdown";

interface NotificationBellProps {
  role: NotificationRole;
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(role);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    /**
     * Later, these can use react-router navigate().
     */
    console.log("Notification clicked:", notification);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open
            ? "border-indigo-200 bg-indigo-50 text-indigo-600"
            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={19} strokeWidth={2} />

        {unreadCount > 0 && (
          <>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />

            <span className="absolute -right-2 -top-2 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <NotificationDropdown
          role={role}
          notifications={notifications}
          onRead={markAsRead}
          onDelete={removeNotification}
          onMarkAllRead={markAllAsRead}
          onClose={() => setOpen(false)}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </div>
  );
}
