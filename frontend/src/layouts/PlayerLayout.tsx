import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

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
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
    description: "Play 2D Lottery",
    path: "/player/play-2d",
    icon: Dice5,
  },
  {
    name: "3D Play",
    description: "Play 3D Lottery",
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

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [playMenuOpen, setPlayMenuOpen] =
    useState(false);

  const [moreMenuOpen, setMoreMenuOpen] =
    useState(false);

  const profileMenuRef =
    useRef<HTMLDivElement>(null);

  const playMenuRef =
    useRef<HTMLDivElement>(null);

  const moreMenuRef =
    useRef<HTMLDivElement>(null);

  /* ============================================================
     ACTIVE MENU DETECTION
  ============================================================ */

  const isPlayActive =
    location.pathname.startsWith("/player/play-2d") ||
    location.pathname.startsWith("/player/play-3d");

  const isMoreActive =
    location.pathname.startsWith(
      "/player/results-history"
    ) ||
    location.pathname.startsWith(
      "/player/contact"
    );

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
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target = event.target as Node;

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }

      if (
        playMenuRef.current &&
        !playMenuRef.current.contains(target)
      ) {
        setPlayMenuOpen(false);
      }

      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target)
      ) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = () => {
    console.log("Logout");

    // Replace with your real logout logic.
    //
    // Example:
    // localStorage.removeItem("token");
    // navigate("/login");
  };

  /* ============================================================
     CLOSE MOBILE MENU
  ============================================================ */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
  };

  /* ============================================================
     NAV LINK CLASS
  ============================================================ */

  const navClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    `group flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ==================================================
              LOGO
          =================================================== */}

          <NavLink
            to="/player"
            className="group flex shrink-0 items-center gap-2.5"
            onClick={closeMobileMenu}
          >
            {/* Logo Icon */}

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30 transition-transform duration-200 group-hover:scale-105">
              <Ticket className="h-5 w-5" />
            </div>

            {/* Logo */}

            <div className="flex items-center">
              <span className="text-lg font-extrabold tracking-tight text-white">
                Lottery
              </span>

              <span className="text-lg font-extrabold tracking-tight text-indigo-400">
                Play
              </span>
            </div>
          </NavLink>

          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden items-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 lg:flex">
            {/* Dashboard */}

            {navigation
              .filter(
                (item) => item.name === "Dashboard"
              )
              .map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={navClass}
                  >
                    <Icon
                      size={17}
                      className="transition-transform group-hover:scale-105"
                    />

                    {item.name}
                  </NavLink>
                );
              })}

            {/* =================================================
                PLAY DROPDOWN
            ================================================= */}

            <div
              ref={playMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setPlayMenuOpen(
                    (current) => !current
                  )
                }
                className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isPlayActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                <Dice5
                  size={17}
                  className={`transition-transform duration-200 ${
                    playMenuOpen
                      ? "rotate-6"
                      : ""
                  }`}
                />

                <span>Play</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    playMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

                {isPlayActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {/* =================================================
                  PLAY DROPDOWN
              ================================================= */}

              {playMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-xl shadow-slate-950/40">
                  {/* Dropdown Title */}

                  <div className="px-3 pb-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Choose Game
                      </p>
                    </div>
                  </div>

                  {/* Games */}

                  {playNavigation.map(
                    (item, index) => {
                      const Icon = item.icon;

                      const is2D = index === 0;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                              isActive
                                ? is2D
                                  ? "bg-indigo-500/20"
                                  : "bg-violet-500/20"
                                : is2D
                                  ? "hover:bg-indigo-500/15"
                                  : "hover:bg-violet-500/15"
                            }`
                          }
                        >
                          {/* Icon */}

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              is2D
                                ? "bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500/25"
                                : "bg-violet-500/15 text-violet-400 group-hover:bg-violet-500/25"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Text */}

                          <div>
                            <p
                              className={`text-sm font-bold ${
                                is2D
                                  ? "text-white group-hover:text-indigo-300"
                                  : "text-white group-hover:text-violet-300"
                              }`}
                            >
                              {item.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {item.description}
                            </p>
                          </div>
                        </NavLink>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                MY TICKETS
            ================================================= */}

            <NavLink
              to="/player/tickets"
              className={navClass}
            >
              <Ticket size={17} />
              My Tickets
            </NavLink>

            {/* =================================================
                WALLET
            ================================================= */}

            <NavLink
              to="/player/wallet"
              className={navClass}
            >
              <WalletCards size={17} />
              Wallet
            </NavLink>

            {/* =================================================
                MORE DROPDOWN
            ================================================= */}

            <div
              ref={moreMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setMoreMenuOpen(
                    (current) => !current
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isMoreActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                <span>More</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    moreMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* More Dropdown */}

              {moreMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-xl shadow-slate-950/40">
                  {moreNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                            isActive
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
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
            {/* =================================================
                WALLET BALANCE
            ================================================= */}

            <NavLink
              to="/player/wallet"
              className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/15 sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 shadow-sm">
                <WalletCards size={16} />
              </div>

              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
                  Balance
                </p>

                <p className="text-sm font-bold text-white">
                  125,000 MMK
                </p>
              </div>
            </NavLink>

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <div className="hidden rounded-xl sm:block">
              <NotificationBell role="PLAYER" />
            </div>

            {/* =================================================
                PROFILE
            ================================================= */}

            <div
              ref={profileMenuRef}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen(
                    (current) => !current
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                  profileMenuOpen
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                {/* Avatar */}

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-sm">
                  AK
                </div>

                {/* User Info */}

                <div className="hidden text-left xl:block">
                  <p className="text-xs font-bold text-white">
                    Player
                  </p>

                  <p className="max-w-[130px] truncate text-[10px] text-slate-400">
                    player@example.com
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${
                    profileMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}

              {profileMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-xl shadow-slate-950/40">
                  {/* User Header */}

                  <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                        AK
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">
                          Player
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          player@example.com
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}

                  <div className="p-2">
                    {/* Profile */}

                    <NavLink
                      to="/player/profile"
                      onClick={() =>
                        setProfileMenuOpen(false)
                      }
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                          isActive
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                        }`
                      }
                    >
                      <User size={17} />
                      Profile
                    </NavLink>

                    {/* Logout */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 lg:hidden ${
                mobileMenuOpen
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-indigo-500/20 hover:text-white"
              }`}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ====================================================
            MOBILE NAVIGATION
        ===================================================== */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-700 bg-slate-900 lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
              {/* =================================================
                  DASHBOARD
              ================================================= */}

              <NavLink
                to="/player"
                end
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <LayoutDashboard size={19} />
                Dashboard
              </NavLink>

              {/* =================================================
                  MOBILE PLAY
              ================================================= */}

              <div className="my-1 rounded-2xl border border-slate-700 bg-slate-800 p-1.5">
                {/* Play Header */}

                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                    <Dice5 size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Play
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Choose your lottery
                    </p>
                  </div>
                </div>

                {/* 2D / 3D */}

                {playNavigation.map(
                  (item, index) => {
                    const Icon = item.icon;

                    const is2D = index === 0;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                            isActive
                              ? is2D
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-violet-500/20 text-violet-300"
                              : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                          }`
                        }
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            is2D
                              ? "bg-indigo-500/15 text-indigo-400"
                              : "bg-violet-500/15 text-violet-400"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {item.name}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </NavLink>
                    );
                  }
                )}
              </div>

              {/* =================================================
                  MY TICKETS
              ================================================= */}

              <NavLink
                to="/player/tickets"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <Ticket size={19} />
                My Tickets
              </NavLink>

              {/* =================================================
                  WALLET
              ================================================= */}

              <NavLink
                to="/player/wallet"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <WalletCards size={19} />

                Wallet

                <span className="ml-auto text-xs font-bold text-emerald-400">
                  125,000 MMK
                </span>
              </NavLink>

              {/* =================================================
                  MORE
              ================================================= */}

              <div className="mt-2 border-t border-slate-700 pt-2">
                {moreNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                            : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={19} />

                      {item.name}
                    </NavLink>
                  );
                })}

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="mt-1 flex items-center rounded-xl px-4 py-3">
                  <NotificationBell role="PLAYER" />
                </div>

                {/* =================================================
                    PROFILE
                ================================================= */}

                <NavLink
                  to="/player/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                    }`
                  }
                >
                  <User size={19} />
                  Profile
                </NavLink>

                {/* =================================================
                    LOGOUT
                ================================================= */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
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

      <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}