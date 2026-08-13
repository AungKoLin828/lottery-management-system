import { Check, Trash2, Wallet, Info } from "lucide-react";

import type { Notification } from "@/services/notificationService";

interface NotificationItemProps {
  notification: Notification;
  onRead: (notificationId: number) => void;
  onDelete: (notificationId: number) => void;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "DEPOSIT_REQUEST":
    case "DEPOSIT_APPROVED":
    case "DEPOSIT_REJECTED":
      return <Wallet size={18} />;

    case "WITHDRAW_REQUEST":
    case "WITHDRAW_APPROVED":
    case "WITHDRAW_REJECTED":
      return <Wallet size={18} />;

    case "SYSTEM":
    default:
      return <Info size={18} />;
  }
}

export default function NotificationItem({
  notification,
  onRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-4 border-b border-slate-100 p-5 transition last:border-b-0 ${
        notification.read ? "bg-white" : "bg-indigo-50/40"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          notification.read
            ? "bg-slate-100 text-slate-500"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              className={`text-sm font-semibold ${
                notification.read ? "text-slate-700" : "text-slate-900"
              }`}
            >
              {notification.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {notification.message}
            </p>
          </div>

          {!notification.read && (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">
            {new Date(notification.createdAt).toLocaleString()}
          </span>

          {!notification.read && (
            <button
              type="button"
              onClick={() => onRead(notification.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              <Check size={14} />
              Mark as read
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-600"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
