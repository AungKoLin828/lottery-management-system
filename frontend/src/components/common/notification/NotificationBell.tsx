import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { NotificationRole } from "@/types/notification";

import { useNotifications } from "@/hooks/useNotifications";

import NotificationDropdown from "./NotificationDropdown";

/* ============================================================
   TYPES
============================================================ */

interface NotificationBellProps {
  role: NotificationRole;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     NOTIFICATIONS
  ============================================================ */

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(role);

  /* ============================================================
     CLOSE WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* ============================================================
     TOGGLE
  ============================================================ */

  const handleToggle = () => {
    setOpen((current) => !current);
  };

  /* ============================================================
     CLOSE
  ============================================================ */

  const handleClose = () => {
    setOpen(false);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div ref={containerRef} className="relative">
      {/* ======================================================
          NOTIFICATION BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={handleToggle}
        className={`
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          transition
          ${
            open
              ? "border-indigo-200 bg-indigo-50 text-indigo-600"
              : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          }
        `}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell size={19} strokeWidth={2} />

        {/* ====================================================
            UNREAD INDICATOR
        ==================================================== */}

        {unreadCount > 0 && (
          <>
            {/* Small red dot */}

            <span
              className="
                absolute
                right-1.5
                top-1.5
                h-2.5
                w-2.5
                rounded-full
                bg-red-500
                ring-2
                ring-white
              "
              aria-hidden="true"
            />

            {/* Unread count */}

            <span
              className="
                absolute
                -right-2
                -top-2
                flex
                min-h-[20px]
                min-w-[20px]
                items-center
                justify-center
                rounded-full
                bg-red-500
                px-1
                text-[10px]
                font-bold
                leading-none
                text-white
                shadow-sm
              "
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* ======================================================
          DROPDOWN
      ====================================================== */}

      {open && (
        <NotificationDropdown
          role={role}
          notifications={notifications}
          onRead={markAsRead}
          onDelete={removeNotification}
          onMarkAllRead={markAllAsRead}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
