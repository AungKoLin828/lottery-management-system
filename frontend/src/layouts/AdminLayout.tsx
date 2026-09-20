import { useCallback, useEffect, useState } from "react";

import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Ticket,
  Users,
  Wallet,
  X,
  Bell,
  MoreHorizontal,
  Trophy,
} from "lucide-react";

import NotificationBell from "@/components/common/notification/NotificationBell";
import RealtimeInitializer from "@/components/realtime/RealtimeInitializer";
import { useAdminDepositRealtime } from "@/hooks/realtime/useAdminDepositRealtime";

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
    shortLabel: "Home",
    path: "/admin",
    icon: LayoutDashboard,
  },

  {
    label: "Results Management",
    shortLabel: "Results",
    path: "/admin/results",
    icon: Trophy,
  },

  {
    label: "User Management",
    shortLabel: "Users",
    path: "/admin/users",
    icon: Users,
  },

  {
    label: "Transaction Management",
    shortLabel: "Transactions",
    path: "/admin/balance",
    icon: Wallet,
  },

  {
    label: "Reports",
    shortLabel: "Reports",
    path: "/admin/reports",
    icon: FileText,
  },

  {
    label: "Settings",
    shortLabel: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

/* ============================================================
   MOBILE MORE NAVIGATION
============================================================ */

const moreNavigation = [
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
   ADMIN ROUTE CHECK
============================================================ */

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

/* ============================================================
   PWA / STANDALONE DETECTION
============================================================ */

function isPWAStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const standaloneMediaQuery = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;

  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    );

  return standaloneMediaQuery || iosStandalone;
}

/* ============================================================
   ADMIN DEPOSIT ALERT TYPES
============================================================ */

interface AdminDepositAlert {
  id: string;

  amount?: string | number;

  transactionNumber?: string;

  paymentMethodId?: string;

  status?: string;

  createdAt?: string;
}

/* ============================================================
   REALTIME DEPOSIT NORMALIZER
============================================================ */

function normalizeAdminDepositAlert(
  payload: unknown,
): AdminDepositAlert | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  /*
   * Support:
   *
   * 1. Direct realtime row
   * 2. { new: row }
   * 3. { record: row }
   * 4. { data: row }
   */

  let source: Record<string, unknown> = record;

  if (
    record.new &&
    typeof record.new === "object" &&
    !Array.isArray(record.new)
  ) {
    source = record.new as Record<string, unknown>;
  } else if (
    record.record &&
    typeof record.record === "object" &&
    !Array.isArray(record.record)
  ) {
    source = record.record as Record<string, unknown>;
  } else if (
    record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  ) {
    source = record.data as Record<string, unknown>;
  }

  /*
   * ID is required.
   */

  if (typeof source.id !== "string" || !source.id) {
    return null;
  }

  /*
   * Support both:
   *
   * amount
   * requestedAmount
   * requested_amount
   */

  const rawAmount =
    source.amount ?? source.requestedAmount ?? source.requested_amount;

  const amount =
    typeof rawAmount === "string" || typeof rawAmount === "number"
      ? rawAmount
      : undefined;

  /*
   * Support camelCase and snake_case.
   */

  const rawTransactionNumber =
    source.transactionNumber ?? source.transaction_number;

  const transactionNumber =
    typeof rawTransactionNumber === "string" ? rawTransactionNumber : undefined;

  const rawPaymentMethodId = source.paymentMethodId ?? source.payment_method_id;

  const paymentMethodId =
    typeof rawPaymentMethodId === "string" ? rawPaymentMethodId : undefined;

  const rawStatus = source.status;

  const status = typeof rawStatus === "string" ? rawStatus : undefined;

  const rawCreatedAt = source.createdAt ?? source.created_at;

  const createdAt = typeof rawCreatedAt === "string" ? rawCreatedAt : undefined;

  return {
    id: source.id,
    amount,
    transactionNumber,
    paymentMethodId,
    status,
    createdAt,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AdminLayout() {
  const location = useLocation();

  /* ==========================================================
     DESKTOP / MOBILE SIDEBAR
  ========================================================== */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ==========================================================
     PWA DETECTION
  ========================================================== */

  const [isInstalledPWA, setIsInstalledPWA] = useState(false);

  /* ==========================================================
     MOBILE MORE
  ========================================================== */

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  /* ==========================================================
     MOBILE TRANSACTION MENU
  ========================================================== */

  const [mobileTransactionOpen, setMobileTransactionOpen] = useState(false);

  /* ==========================================================
     MOBILE BACK BUTTON
  ========================================================== */

  const [showBackButton, setShowBackButton] = useState(false);

  /* ==========================================================
     ADMIN DEPOSIT REALTIME ALERT
  ========================================================== */

  const [adminDepositAlert, setAdminDepositAlert] =
    useState<AdminDepositAlert | null>(null);

  /* ==========================================================
     ADMIN HISTORY STORAGE
  ========================================================== */

  const ADMIN_HISTORY_KEY = "lottery_admin_navigation_history";

  /* ==========================================================
     DETECT PWA INSTALL / STANDALONE MODE
  ========================================================== */

  useEffect(() => {
    const updatePWAState = () => {
      setIsInstalledPWA(isPWAStandalone());
    };

    updatePWAState();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const handleMediaChange = () => {
      updatePWAState();
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    window.addEventListener("pageshow", updatePWAState);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }

      window.removeEventListener("pageshow", updatePWAState);
    };
  }, []);

  /* ==========================================================
     ADMIN DEPOSIT REALTIME
  ========================================================== */

  const handleNewAdminDeposit = useCallback((payload: unknown) => {
    const deposit = normalizeAdminDepositAlert(payload);

    if (!deposit) {
      console.warn("[Admin Realtime] Invalid deposit payload:", payload);

      return;
    }

    console.log("[Admin Realtime] New deposit request:", deposit);

    setAdminDepositAlert(deposit);

    window.setTimeout(() => {
      setAdminDepositAlert((current) => {
        if (current?.id === deposit.id) {
          return null;
        }

        return current;
      });
    }, 8000);
  }, []);

  useAdminDepositRealtime({
    enabled: true,
    onNewDeposit: handleNewAdminDeposit,
  });

  /* ==========================================================
     ACTIVE NAVIGATION
  ========================================================== */

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }

    return location.pathname.startsWith(path);
  };

  /* ==========================================================
     ACTIVE TRANSACTION
  ========================================================== */

  const isTransactionActive = location.pathname.startsWith("/admin/balance");

  /* ==========================================================
     ACTIVE MORE
  ========================================================== */

  const isMoreActive =
    location.pathname.startsWith("/admin/reports") ||
    location.pathname.startsWith("/admin/settings");

  /* ==========================================================
     CLOSE SIDEBAR
  ========================================================== */

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  /* ==========================================================
     CLOSE ALL MENUS
  ========================================================== */

  const closeAllMenus = () => {
    setSidebarOpen(false);
    setMobileMoreOpen(false);
    setMobileTransactionOpen(false);
  };

  /* ==========================================================
     MOBILE NAVIGATION
  ========================================================== */

  const handleMobileNavigation = () => {
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ==========================================================
     MOBILE TRANSACTION TOGGLE
  ========================================================== */

  const toggleMobileTransaction = () => {
    setMobileTransactionOpen((current) => !current);
    setMobileMoreOpen(false);
  };

  /* ==========================================================
     MOBILE MORE TOGGLE
  ========================================================== */

  const toggleMobileMore = () => {
    setMobileMoreOpen((current) => !current);
    setMobileTransactionOpen(false);
  };

  /* ==========================================================
     PAGE TITLE
  ========================================================== */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/admin") {
      return "Admin Dashboard";
    }

    if (path.startsWith("/admin/results")) {
      return "Results Management";
    }

    if (path.startsWith("/admin/users")) {
      return "User Management";
    }

    if (path.startsWith("/admin/balance/deposits")) {
      return "Deposit Requests • YYYY-MM-DD HH:mm:ss";
    }

    if (path.startsWith("/admin/balance/withdrawals")) {
      return "Withdraw Requests • YYYY-MM-DD HH:mm:ss";
    }

    if (path.startsWith("/admin/balance")) {
      return "Transaction Management";
    }

    if (path.startsWith("/admin/reports")) {
      return "Reports";
    }

    if (path.startsWith("/admin/settings")) {
      return "Settings";
    }

    return "Admin Dashboard";
  };

  /* ==========================================================
     TRACK ADMIN ROUTES
  ========================================================== */

  useEffect(() => {
    if (!isAdminPath(location.pathname)) {
      return;
    }

    try {
      const stored = sessionStorage.getItem(ADMIN_HISTORY_KEY);

      let history: string[] = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            history = parsed.filter(
              (item): item is string =>
                typeof item === "string" && isAdminPath(item),
            );
          }
        } catch {
          history = [];
        }
      }

      const lastRoute = history[history.length - 1];

      if (lastRoute !== location.pathname) {
        history.push(location.pathname);
      }

      if (history.length > 30) {
        history = history.slice(-30);
      }

      sessionStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore sessionStorage errors.
    }
  }, [location.pathname]);

  /* ==========================================================
     PWA BACK BUTTON VISIBILITY
  ========================================================== */

  useEffect(() => {
    if (!isInstalledPWA) {
      setShowBackButton(false);
      return;
    }

    const handleScroll = () => {
      setShowBackButton(window.scrollY > 120);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isInstalledPWA]);

  /* ==========================================================
     SAFE ADMIN BACK
  ========================================================== */

  const handleAdminBack = () => {
    if (!isInstalledPWA) {
      return;
    }

    try {
      const stored = sessionStorage.getItem(ADMIN_HISTORY_KEY);

      let history: string[] = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            history = parsed.filter(
              (item): item is string =>
                typeof item === "string" && isAdminPath(item),
            );
          }
        } catch {
          history = [];
        }
      }

      if (
        history.length > 0 &&
        history[history.length - 1] === location.pathname
      ) {
        history.pop();
      }

      const previousAdminPage = history[history.length - 1];

      sessionStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(history));

      if (previousAdminPage && isAdminPath(previousAdminPage)) {
        window.history.pushState(null, "", previousAdminPage);

        window.dispatchEvent(new PopStateEvent("popstate"));

        return;
      }

      window.history.pushState(null, "", "/admin");

      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.href = "/admin";
    }
  };

  /* ==========================================================
     ROUTE CHANGE
  ========================================================== */

  useEffect(() => {
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  /* ==========================================================
     DESKTOP SIDEBAR ACTIVE CLASS
  ========================================================== */

  const desktopNavClass = (active: boolean) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/30"
        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
    }`;

  /* ==========================================================
     MOBILE BOTTOM NAV CLASS
  ========================================================== */

  const mobileBottomNavClass = (active: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all duration-200 ${
      active
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/30"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {/* ======================================================
          REALTIME INITIALIZER
      ======================================================= */}

      <RealtimeInitializer isAuthenticated={true} />

      {/* ======================================================
          ADMIN DEPOSIT ALERT
      ======================================================= */}

      {adminDepositAlert && (
        <div
          className="
            fixed
            right-3
            top-3
            z-[200]
            w-[calc(100vw-1.5rem)]
            max-w-sm
            overflow-hidden
            rounded-2xl
            border
            border-indigo-200
            bg-white
            shadow-2xl
            shadow-slate-950/20
            sm:right-5
            sm:top-5
          "
          role="alert"
        >
          <div className="flex items-start gap-3 p-4">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
                text-indigo-600
              "
            >
              <Bell className="h-5 w-5" strokeWidth={2.3} />
            </div>

            <button
              type="button"
              onClick={() => {
                setAdminDepositAlert(null);
                window.location.href = "/admin/balance/deposits";
              }}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-sm font-bold text-slate-900">
                New Deposit Request
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                A player has submitted a new deposit request.
              </p>

              {adminDepositAlert.amount !== undefined && (
                <p className="mt-2 text-sm font-bold text-indigo-600">
                  Amount:{" "}
                  {Number(adminDepositAlert.amount).toLocaleString("en-US")} MMK
                </p>
              )}

              {adminDepositAlert.transactionNumber && (
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  Transaction: {adminDepositAlert.transactionNumber}
                </p>
              )}

              <p className="mt-2 text-[11px] font-semibold text-indigo-500">
                Click to view deposit requests
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAdminDepositAlert(null)}
              aria-label="Close deposit notification"
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-1 bg-slate-100">
            <div className="h-full w-full origin-left animate-[shrink_8s_linear_forwards] bg-gradient-to-r from-indigo-600 to-violet-600" />
          </div>
        </div>
      )}

      {/* ======================================================
          MOBILE SIDEBAR OVERLAY
      ======================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* ======================================================
          MAIN LAYOUT
          
          IMPORTANT:
          Desktop sidebar is fixed.
          Main content receives lg:ml-64.
          
          Mobile remains unchanged.
      ======================================================= */}

      <div className="min-h-screen">
        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside
          className={`
            fixed
            inset-y-0
            left-0
            z-50
            flex
            w-64
            flex-col
            border-r
            border-slate-800
            bg-slate-900
            text-white
            shadow-xl
            transition-transform
            duration-300
            ease-in-out

            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

            lg:translate-x-0
            lg:z-40
            lg:h-screen
            lg:shadow-none
          `}
        >
          {/* SIDEBAR HEADER */}

          <div
            className="
              flex
              min-h-[73px]
              shrink-0
              items-center
              justify-between
              border-b
              border-slate-800
              px-5
              sm:px-6
            "
          >
            <Link
              to="/admin"
              onClick={closeAllMenus}
              className="flex items-center gap-2.5"
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-indigo-600
                  to-violet-600
                  text-white
                  shadow-md
                  shadow-indigo-950/30
                "
              >
                <Ticket className="h-5 w-5" />
              </div>

              <div>
                <h1
                  className="
                    text-base
                    font-extrabold
                    tracking-tight
                    text-white
                    sm:text-lg
                  "
                >
                  Administrator
                </h1>

                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Management Panel
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close sidebar"
              className="
                rounded-xl
                p-2
                text-slate-400
                transition
                hover:bg-slate-800
                hover:text-white
                lg:hidden
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* SIDEBAR NAVIGATION */}

          <nav
            className="
              flex-1
              space-y-1
              overflow-y-auto
              p-3
              sm:p-4
            "
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeAllMenus}
                  className={desktopNavClass(active)}
                >
                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-slate-800 text-slate-400 group-hover:text-indigo-300"
                      }
                    `}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* SIDEBAR FOOTER */}

          <div
            className="
              shrink-0
              border-t
              border-slate-800
              px-5
              py-4
              text-xs
              text-slate-500
              sm:px-6
            "
          >
            <p className="font-semibold text-slate-400">Admin Panel</p>

            <p className="mt-1">Lottery Management System</p>
          </div>
        </aside>

        {/* ==================================================
            MAIN AREA

            IMPORTANT:
            lg:ml-64 reserves the desktop sidebar width.
            
            No width change on mobile.
        ================================================== */}

        <div
          className="
            min-h-screen
            lg:ml-64
          "
        >
          <main
            className="
              flex
              min-h-screen
              min-w-0
              flex-col
            "
          >
            {/* ==================================================
                DESKTOP / MOBILE HEADER
            ================================================== */}

            <header
              className="
                sticky
                top-0
                z-30
                flex
                min-h-[72px]
                items-center
                justify-between
                gap-3
                border-b
                border-slate-200
                bg-white/95
                px-3
                py-3
                shadow-sm
                backdrop-blur-xl
                sm:px-4
                md:px-6
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* MOBILE MENU */}

                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-600
                    shadow-sm
                    transition
                    hover:border-indigo-300
                    hover:bg-indigo-50
                    hover:text-indigo-600
                    lg:hidden
                  "
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* MOBILE LOGO */}

                <Link
                  to="/admin"
                  onClick={closeAllMenus}
                  className="
                    flex
                    shrink-0
                    items-center
                    gap-2
                    lg:hidden
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-indigo-600
                      to-violet-600
                      text-white
                      shadow-md
                      shadow-indigo-900/20
                    "
                  >
                    <Ticket className="h-4.5 w-4.5" />
                  </div>
                </Link>

                {/* PAGE TITLE */}

                <div className="min-w-0">
                  <h2
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-slate-800
                      sm:text-base
                    "
                  >
                    {getPageTitle()}
                  </h2>

                  <p
                    className="
                      hidden
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-slate-400
                      sm:block
                    "
                  >
                    Lottery Management System
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* DESKTOP NOTIFICATION */}

                <div className="hidden rounded-xl sm:block">
                  <NotificationBell role="ADMIN" />
                </div>

                {/* DESKTOP LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    hidden
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-3
                    py-2
                    text-sm
                    font-semibold
                    text-red-600
                    transition
                    hover:border-red-300
                    hover:bg-red-100
                    hover:text-red-700
                    sm:flex
                  "
                >
                  <LogOut className="h-4 w-4" />

                  <span>Logout</span>
                </button>
              </div>
            </header>

            {/* ==================================================
                PAGE CONTENT
            ================================================== */}

            <section
              className={`
                min-w-0
                flex-1
                px-3
                py-4
                sm:px-4
                sm:py-5
                md:px-6
                md:py-6
                ${
                  isInstalledPWA
                    ? "pb-28 sm:pb-28 lg:pb-28"
                    : "pb-4 sm:pb-5 md:pb-6"
                }
              `}
            >
              <Outlet />
            </section>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer
              className="
                hidden
                border-t
                border-slate-800
                bg-slate-900
                px-3
                py-4
                text-center
                text-xs
                text-slate-400
                sm:px-6
                sm:text-sm
                lg:block
              "
            >
              © {new Date().getFullYear()} Lottery Management System.
              <span className="hidden sm:inline"> All rights reserved.</span>
            </footer>
          </main>
        </div>
      </div>

      {/* ======================================================
          PWA MOBILE / MORE PANEL
      ======================================================= */}

      {isInstalledPWA && mobileMoreOpen && (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            onClick={() => setMobileMoreOpen(false)}
            className="
              fixed
              inset-0
              z-[65]
              bg-black/30
              backdrop-blur-[2px]
              lg:hidden
            "
          />

          <div
            className="
              fixed
              bottom-[82px]
              left-3
              right-3
              z-[70]
              overflow-hidden
              rounded-2xl
              border
              border-slate-700
              bg-slate-900
              p-2
              shadow-2xl
              shadow-slate-950/50
              lg:hidden
            "
          >
            <div
              className="
                border-b
                border-slate-800
                px-3
                py-2
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                More
              </p>
            </div>

            {moreNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleMobileNavigation}
                  className={({ isActive: linkActive }) =>
                    `mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      linkActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-slate-800
                    "
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div
              className="
                mt-1
                flex
                min-h-11
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-[13px]
                font-semibold
                text-slate-300
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-br
                  from-indigo-600
                  to-violet-600
                  text-white
                "
              >
                <Bell className="h-4 w-4" />
              </span>

              <span>Notifications</span>

              <div className="ml-auto">
                <NotificationBell role="ADMIN" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="
                mt-1
                flex
                min-h-11
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-left
                text-[13px]
                font-semibold
                text-red-400
                transition
                hover:bg-red-500/10
                hover:text-red-300
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-red-500/10
                "
              >
                <LogOut className="h-4 w-4" />
              </span>

              <span>Logout</span>
            </button>
          </div>
        </>
      )}

      {/* ======================================================
          PWA TRANSACTION SUBMENU
      ======================================================= */}

      {isInstalledPWA && mobileTransactionOpen && (
        <>
          <button
            type="button"
            aria-label="Close transaction menu"
            onClick={() => setMobileTransactionOpen(false)}
            className="
              fixed
              inset-0
              z-[65]
              bg-black/30
              backdrop-blur-[2px]
              lg:hidden
            "
          />

          <div
            className="
              fixed
              bottom-[82px]
              left-3
              right-3
              z-[70]
              overflow-hidden
              rounded-2xl
              border
              border-slate-700
              bg-slate-900
              p-2
              shadow-2xl
              shadow-slate-950/50
              lg:hidden
            "
          >
            <div
              className="
                border-b
                border-slate-800
                px-3
                py-2
              "
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Transaction Management
                </p>
              </div>
            </div>

            <NavLink
              to="/admin/balance"
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                `mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                  linkActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-emerald-500/10
                  text-emerald-400
                "
              >
                <Wallet className="h-4 w-4" />
              </span>

              <span>Transactions</span>
            </NavLink>

            <NavLink
              to="/admin/balance/deposits"
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                `mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                  linkActive
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-500/10
                  text-indigo-400
                "
              >
                <BarChart3 className="h-4 w-4" />
              </span>

              <span>Deposit Requests</span>
            </NavLink>

            <NavLink
              to="/admin/balance/withdrawals"
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                `mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                  linkActive
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-violet-500/10
                  text-violet-400
                "
              >
                <Wallet className="h-4 w-4" />
              </span>

              <span>Withdraw Requests</span>
            </NavLink>
          </div>
        </>
      )}

      {/* ======================================================
          PWA MOBILE BOTTOM NAVIGATION
      ======================================================= */}

      {isInstalledPWA && (
        <nav
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-[60]
            border-t
            border-slate-700
            bg-slate-900/95
            px-2
            pb-[calc(0.5rem+env(safe-area-inset-bottom))]
            pt-2
            shadow-[0_-8px_30px_rgba(15,23,42,0.25)]
            backdrop-blur-xl
            lg:hidden
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-xl
              items-center
              gap-1
            "
          >
            <NavLink
              to="/admin"
              end
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                mobileBottomNavClass(linkActive)
              }
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/admin/results"
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                mobileBottomNavClass(linkActive)
              }
            >
              <Trophy className="h-5 w-5" />
              <span>Results</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              onClick={handleMobileNavigation}
              className={({ isActive: linkActive }) =>
                mobileBottomNavClass(linkActive)
              }
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </NavLink>

            <button
              type="button"
              onClick={toggleMobileTransaction}
              aria-label="Open transaction management"
              aria-expanded={mobileTransactionOpen}
              className={mobileBottomNavClass(
                isTransactionActive || mobileTransactionOpen,
              )}
            >
              <Wallet className="h-5 w-5" />

              <span>Transactions</span>

              {isTransactionActive && (
                <span
                  className="
                    absolute
                    right-1/2
                    top-1
                    h-1
                    w-1
                    translate-x-1/2
                    rounded-full
                    bg-white
                  "
                />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMobileMore}
              aria-label="Open more menu"
              aria-expanded={mobileMoreOpen}
              className={mobileBottomNavClass(isMoreActive || mobileMoreOpen)}
            >
              <MoreHorizontal className="h-5 w-5" />

              <span>More</span>
            </button>
          </div>
        </nav>
      )}

      {/* ======================================================
          PWA MOBILE FLOATING BACK BUTTON
      ======================================================= */}

      {isInstalledPWA && (
        <div
          className={`
            fixed
            bottom-[92px]
            right-4
            z-[75]
            lg:hidden
            ${
              showBackButton
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-6 opacity-0"
            }
            transition-all
            duration-300
            ease-out
          `}
        >
          <button
            type="button"
            onClick={handleAdminBack}
            aria-label="Go back"
            className="
              group
              flex
              items-center
              gap-2
              rounded-full
              border
              border-indigo-400/40
              bg-gradient-to-r
              from-indigo-600
              to-violet-600
              px-3
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-indigo-900/40
              ring-1
              ring-white/10
              backdrop-blur-md
              transition-all
              duration-200
              hover:-translate-y-1
              hover:border-indigo-300/60
              hover:from-indigo-500
              hover:to-violet-500
              hover:shadow-xl
              active:translate-y-0
              active:scale-95
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-400/60
              focus:ring-offset-2
              focus:ring-offset-slate-50
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/15
                text-white
                shadow-inner
                shadow-white/10
                ring-1
                ring-white/20
                transition-all
                duration-200
                group-hover:-translate-x-0.5
                group-hover:bg-white/20
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </span>

            <span className="pr-1 tracking-wide">Back</span>
          </button>
        </div>
      )}
    </div>
  );
}
