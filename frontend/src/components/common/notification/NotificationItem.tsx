import {
  Bell,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Gift,
  Ticket,
  Trophy,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";

import type { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

function getIcon(type: Notification["type"]) {
  switch (type) {
    case "DEPOSIT_REQUEST":
      return CreditCard;

    case "DEPOSIT_APPROVED":
      return CheckCircle2;

    case "DEPOSIT_REJECTED":
      return XCircle;

    case "WITHDRAW_REQUEST":
      return Wallet;

    case "WITHDRAW_APPROVED":
      return CheckCircle2;

    case "WITHDRAW_REJECTED":
      return XCircle;

    case "TICKET_PURCHASED":
      return Ticket;

    case "TICKET_WIN":
      return Trophy;

    case "WALLET_CREDIT":
      return Wallet;

    case "WALLET_DEBIT":
      return Wallet;

    case "NEW_PLAYER":
      return UserPlus;

    case "RESULT_PUBLISHED":
      return Gift;

    case "ANNOUNCEMENT":
      return Bell;

    default:
      return CircleAlert;
  }
}

function getTimeAgo(date: string): string {
  const created = new Date(date).getTime();

  const now = Date.now();

  const seconds = Math.floor((now - created) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(date).toLocaleDateString();
}

export default function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = getIcon(notification.type);

  return (
    <div
      className={`group relative border-b border-slate-100 px-4 py-4 transition ${
        notification.isRead ? "bg-white" : "bg-indigo-50/60"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (!notification.isRead) {
            onRead(notification.id);
          }

          onClick?.(notification);
        }}
        className="flex w-full gap-3 text-left"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            notification.isRead
              ? "bg-slate-100 text-slate-500"
              : "bg-indigo-100 text-indigo-600"
          }`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1 pr-5">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm ${
                notification.isRead
                  ? "font-medium text-slate-700"
                  : "font-bold text-slate-900"
              }`}
            >
              {notification.title}
            </p>

            {!notification.isRead && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
            )}
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {notification.message}
          </p>

          <p className="mt-2 text-[11px] text-slate-400">
            {getTimeAgo(notification.createdAt)}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onDelete(notification.id)}
        className="absolute right-3 top-3 hidden rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 group-hover:block"
        aria-label="Delete notification"
      >
        <XCircle size={15} />
      </button>
    </div>
  );
}
