import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  WalletCards,
  User,
  Dice5,
  Boxes,
  LogOut,
  Menu,
  X,
  MessageCircle,
  BarChart3,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import NotificationBell from "@/components/common/notification/NotificationBell";

/* ============================================================
   MAIN NAVIGATION
============================================================ */

const navigation = [
  {
    name: "Dashboard",
    path: "/player",
    icon: LayoutDashboard,
  },
  {
    name: "My Tickets",
    path: "/player/tickets",
    icon: Ticket,
  },
  {
    name: "Wallet",
    path: "/player/wallet",
    icon: WalletCards,
  },
];

/* ============================================================
   PLAY MENU
============================================================ */

const playNavigation = [
  {
    name: "2D Play",
    path: "/player/play-2d",
    icon: Dice5,
  },
  {
    name: "3D Play",
    path: "/player/play-3d",
    icon: Boxes,
  },
];

/* ============================================================
   MORE MENU
============================================================ */

const moreNavigation = [
  {
    name: "Results History",
    path: "/player/results-history",
    icon: BarChart3,
  },
  {
    name: "Contact",
    path: "/player/contact",
    icon: MessageCircle,
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function PlayerLayout() {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [playMenuOpen, setPlayMenuOpen] = useState(false);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  const playMenuRef = useRef<HTMLDivElement>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     ACTIVE MENU DETECTION
  ============================================================ */

  const isPlayActive =
    location.pathname.startsWith("/player/play-2d") ||
    location.pathname.startsWith("/player/play-3d");

  const isMoreActive =
    location.pathname.startsWith("/player/results-history") ||
    location.pathname.startsWith("/player/contact");

  /* ============================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ============================================================ */

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname]);

  /* ============================================================
     CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }

      if (playMenuRef.current && !playMenuRef.current.contains(target)) {
        setPlayMenuOpen(false);
      }

      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = () => {
    console.log("Logout");

    // Replace with your real logout logic.
    // Example:
    // localStorage.removeItem("token");
    // navigate("/login");
  };

  /* ============================================================
     NAV LINK CLASS
  ============================================================ */

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ==================================================
              LOGO
          =================================================== */}

          <NavLink
            to="/player"
            className="flex shrink-0 items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Lottery
            </span>

            <span className="text-lg font-bold tracking-tight text-indigo-600">
              Play
            </span>
          </NavLink>

          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden items-center gap-1 lg:flex">
            {/* Dashboard */}

            {navigation
              .filter((item) => item.name === "Dashboard")
              .map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={navClass}
                  >
                    <Icon size={17} />

                    {item.name}
                  </NavLink>
                );
              })}

            {/* =================================================
                PLAY DROPDOWN
            ================================================= */}

            <div ref={playMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setPlayMenuOpen((current) => !current)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isPlayActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Dice5 size={17} />

                <span>Play</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    playMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {playMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {playNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                            isActive
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-slate-600 hover:bg-slate-50"
                          }`
                        }
                      >
                        <Icon size={17} />

                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Tickets */}

            <NavLink to="/player/tickets" className={navClass}>
              <Ticket size={17} />
              My Tickets
            </NavLink>

            {/* Wallet */}

            <NavLink to="/player/wallet" className={navClass}>
              <WalletCards size={17} />
              Wallet
            </NavLink>

            {/* =================================================
                MORE DROPDOWN
            ================================================= */}

            <div ref={moreMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((current) => !current)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isMoreActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>More</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {moreNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                            isActive
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-slate-600 hover:bg-slate-50"
                          }`
                        }
                      >
                        <Icon size={17} />

                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* ==================================================
              RIGHT SIDE
          =================================================== */}

          <div className="flex items-center gap-2">
            {/* Wallet Balance */}

            <NavLink
              to="/player/wallet"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex"
            >
              <WalletCards size={17} className="text-indigo-600" />

              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Balance
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  125,000 MMK
                </p>
              </div>
            </NavLink>

            {/* Notification */}

            <div className="hidden sm:block">
              <NotificationBell role="PLAYER" />
            </div>

            {/* =================================================
                PROFILE
            ================================================= */}

            <div ref={profileMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((current) => !current)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                  profileMenuOpen
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  AK
                </div>

                <div className="hidden text-left xl:block">
                  <p className="text-xs font-semibold text-slate-800">Player</p>

                  <p className="text-[10px] text-slate-400">
                    player@example.com
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Player
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      player@example.com
                    </p>
                  </div>

                  <div className="p-1.5">
                    <NavLink
                      to="/player/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                          isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      <User size={17} />
                      Profile
                    </NavLink>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ====================================================
            MOBILE NAVIGATION
        ===================================================== */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
              {/* Dashboard */}

              <NavLink
                to="/player"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <LayoutDashboard size={19} />
                Dashboard
              </NavLink>

              {/* =================================================
                  MOBILE PLAY
              ================================================= */}

              <div className="rounded-xl bg-slate-50 p-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700">
                  <Dice5 size={19} />
                  Play
                </div>

                {playNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `ml-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${
                          isActive
                            ? "bg-indigo-50 font-semibold text-indigo-600"
                            : "text-slate-600 hover:bg-white"
                        }`
                      }
                    >
                      <Icon size={17} />

                      {item.name}
                    </NavLink>
                  );
                })}
              </div>

              {/* My Tickets */}

              <NavLink
                to="/player/tickets"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <Ticket size={19} />
                My Tickets
              </NavLink>

              {/* Wallet */}

              <NavLink
                to="/player/wallet"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <WalletCards size={19} />
                Wallet
              </NavLink>

              {/* More */}

              <div className="mt-2 border-t border-slate-100 pt-2">
                {moreNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                          isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      <Icon size={19} />

                      {item.name}
                    </NavLink>
                  );
                })}

                {/* Notifications */}

                <div className="mt-1 rounded-xl px-4 py-3">
                  <NotificationBell role="PLAYER" />
                </div>

                {/* Profile */}

                <NavLink
                  to="/player/profile"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <User size={19} />
                  Profile
                </NavLink>

                {/* Logout */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <LogOut size={19} />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
