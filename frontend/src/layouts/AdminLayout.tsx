import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Trophy,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

import NotificationBell from "@/components/common/notification/NotificationBell";

/* ============================================================
   LOGOUT
============================================================ */

const handleLogout = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);

    window.location.href = "/login";
  }
};

/* ============================================================
   NAVIGATION
============================================================ */

const navigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Results Management",
    path: "/admin/results",
    icon: Trophy,
  },
  {
    label: "User Management",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Balance Management",
    path: "/admin/balance",
    icon: Wallet,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: FileText,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }

    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-100">
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 flex-col
          bg-gray-900 text-white
          shadow-xl
          transition-transform duration-300 ease-in-out

          lg:static
          lg:z-auto
          lg:translate-x-0
          lg:shadow-none

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* ==================================================
            SIDEBAR HEADER
        ================================================== */}

        <div className="flex min-h-[73px] items-center justify-between border-b border-gray-800 px-5 sm:px-6">
          <h1 className="text-lg font-bold sm:text-xl">Administrator</h1>

          {/* Mobile Close Button */}

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="
              rounded-md p-2
              text-gray-400
              transition
              hover:bg-gray-800
              hover:text-white
              lg:hidden
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3
                  rounded-md
                  px-3 py-2.5
                  text-sm
                  transition
                  sm:px-4

                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-blue-400"
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ==================================================
            SIDEBAR BOTTOM
        ================================================== */}

        <div className="border-t border-gray-800 px-5 py-4 text-xs text-gray-400 sm:px-6">
          Admin Panel
        </div>
      </aside>

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* ==================================================
            HEADER
        ================================================== */}

        <header
          className="
            sticky top-0 z-30
            flex min-h-[73px]
            items-center
            justify-between
            gap-3
            border-b
            bg-white
            px-3
            py-3
            shadow-sm
            sm:px-4
            md:px-6
          "
        >
          {/* Left Side */}

          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile Menu Button */}

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="
                shrink-0
                rounded-md
                p-2
                text-gray-600
                transition
                hover:bg-gray-100
                hover:text-gray-900
                lg:hidden
              "
            >
              <Menu className="h-6 w-6" />
            </button>

            <h2 className="truncate text-sm font-semibold text-gray-800 sm:text-base">
              Admin Dashboard
            </h2>
          </div>

          {/* Right Side */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Notification */}

            <NotificationBell role="ADMIN" />

            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                items-center
                gap-1.5
                rounded-md
                px-2
                py-2
                text-sm
                font-medium
                text-red-600
                transition
                hover:bg-red-50
                hover:text-red-800
                sm:px-3
              "
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <section
          className="
            min-w-0
            flex-1
            p-3
            sm:p-4
            md:p-6
          "
        >
          <Outlet />
        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer
          className="
            border-t
            border-gray-800
            bg-gray-900
            px-3
            py-4
            text-center
            text-xs
            text-gray-300
            sm:px-6
            sm:text-sm
          "
        >
          © {new Date().getFullYear()} Lottery Management System.
          <span className="hidden sm:inline"> All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
