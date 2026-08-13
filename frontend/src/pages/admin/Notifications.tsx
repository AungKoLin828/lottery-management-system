import { Bell, CheckCheck, Trash2 } from "lucide-react";

import NotificationItem from "@/components/common/notification/NotificationItem";

import { useNotifications } from "@/hooks/useNotifications";

export default function AdminNotifications() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications("ADMIN");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Bell size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor important system and player activities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Bell size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              No notifications
            </h2>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              New deposit, withdrawal, registration and system events will
              appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onDelete={removeNotification}
            />
          ))
        )}
      </div>
    </div>
  );
}
