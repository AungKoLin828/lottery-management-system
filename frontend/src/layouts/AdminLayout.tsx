import { Outlet, Link } from "react-router-dom";
import NotificationBell from "@/components/common/notification/NotificationBell";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        {/* Logo / Title */}
        <div className="border-b border-gray-800 px-6 py-5">
          <h1 className="text-xl font-bold">Administrator</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <Link
            to="/admin"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            Dashboard
          </Link>

          <Link
            to="/admin/results"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            Results Management
          </Link>

          <Link
            to="/admin/users"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            User Management
          </Link>

          <Link
            to="/admin/balance"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            Balance Management
          </Link>

          <Link
            to="/admin/reports"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            Reports
          </Link>

          <Link
            to="/admin/settings"
            className="block rounded-md px-4 py-2 transition hover:bg-gray-800 hover:text-blue-400"
          >
            Settings
          </Link>
        </nav>

        {/* Sidebar Bottom */}
        <div className="border-t border-gray-800 px-6 py-4 text-xs text-gray-400">
          Admin Panel
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
          <h2 className="font-semibold text-gray-800">Admin Dashboard</h2>
          <NotificationBell role="ADMIN" />
          <button className="text-red-600 transition hover:text-red-800">
            Logout
          </button>
        </header>

        {/* Page Content */}
        <section className="flex-1 p-6">
          <Outlet />
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-gray-900 px-6 py-4 text-center text-sm text-gray-300">
          © {new Date().getFullYear()} Lottery Management System. All rights
          reserved.
        </footer>
      </main>
    </div>
  );
}
