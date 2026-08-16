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
   PLAY NAVIGATION
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
   MORE NAVIGATION
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

  /* ============================================================
     STATE
  ============================================================ */

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [playMenuOpen, setPlayMenuOpen] =
    useState(false);

  const [moreMenuOpen, setMoreMenuOpen] =
    useState(false);

  /* ============================================================
     REFS
  ============================================================ */

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
    location.pathname.startsWith(
      "/player/play-2d"
    ) ||
    location.pathname.startsWith(
      "/player/play-3d"
    );

  const isMoreActive =
    location.pathname.startsWith(
      "/player/results-history"
    ) ||
    location.pathname.startsWith(
      "/player/contact"
    );

  /* ============================================================
     CLOSE ALL MENUS
  ============================================================ */

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
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
     TOGGLE PLAY MENU
  ============================================================ */

  const togglePlayMenu = () => {
    setPlayMenuOpen((current) => !current);

    // Close other desktop dropdowns.
    setProfileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  /* ============================================================
     TOGGLE MORE MENU
  ============================================================ */

  const toggleMoreMenu = () => {
    setMoreMenuOpen((current) => !current);

    // Close other dropdowns.
    setPlayMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     TOGGLE PROFILE MENU
  ============================================================ */

  const toggleProfileMenu = () => {
    setProfileMenuOpen((current) => !current);

    // Close other dropdowns.
    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
  };

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

    // Replace this with your actual logout logic.
    //
    // Example:
    // localStorage.removeItem("token");
    // navigate("/login");
  };

  /* ============================================================
     NAV LINK CLASS
  ============================================================ */

  const navClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    `group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
    }`;

  /* ============================================================
     PLAY DROPDOWN ITEM CLASS
  ============================================================ */

  const playItemClass = (
    isActive: boolean,
    is2D: boolean
  ) =>
    `group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
      isActive
        ? is2D
          ? "bg-indigo-500/20"
          : "bg-violet-500/20"
        : is2D
          ? "hover:bg-indigo-500/15"
          : "hover:bg-violet-500/15"
    }`;

  /* ============================================================
     RENDER
  ============================================================ */

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
            onClick={closeAllMenus}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30 transition-transform duration-200 group-hover:scale-105">
              <Ticket className="h-5 w-5" />
            </div>

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
            {/* =================================================
                DASHBOARD
            ================================================= */}

            <NavLink
              to="/player"
              end
              className={navClass}
            >
              <LayoutDashboard
                size={17}
                className="transition-transform duration-200 group-hover:scale-105"
              />

              Dashboard
            </NavLink>

            {/* =================================================
                PLAY DROPDOWN
            ================================================= */}

            <div
              ref={playMenuRef}
              className="relative"
            >
              {/* Play Button */}

              <button
                type="button"
                onClick={togglePlayMenu}
                aria-haspopup="menu"
                aria-expanded={playMenuOpen}
                className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isPlayActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                {/* Play Icon */}

                <Dice5
                  size={17}
                  className={`transition-all duration-200 ${
                    playMenuOpen
                      ? "rotate-6 text-indigo-300"
                      : ""
                  }`}
                />

                {/* Label */}

                <span>Play</span>

                {/* Arrow */}

                <ChevronDown
                  size={15}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${
                    playMenuOpen
                      ? "rotate-180"
                      : "rotate-0"
                  }`}
                />

                {/* Active Indicator */}

                {isPlayActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {/* =================================================
                  PLAY DROPDOWN
              ================================================= */}

              {playMenuOpen && (
                <div
                  className="absolute left-0 top-full z-[100] mt-2 w-64 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl shadow-slate-950/50"
                  role="menu"
                >
                  {/* Dropdown Header */}

                  <div className="px-3 pb-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Choose Game
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      2D PLAY
                  ================================================= */}

                  <NavLink
                    to="/player/play-2d"
                    role="menuitem"
                    onClick={() => {
                      setPlayMenuOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className={({ isActive }) =>
                      playItemClass(isActive, true)
                    }
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 transition-colors duration-200 group-hover:bg-indigo-500/25">
                      <Dice5 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white transition-colors group-hover:text-indigo-300">
                        2D Play
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Play 2D Lottery
                      </p>
                    </div>
                  </NavLink>

                  {/* =================================================
                      3D PLAY
                  ================================================= */}

                  <NavLink
                    to="/player/play-3d"
                    role="menuitem"
                    onClick={() => {
                      setPlayMenuOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className={({ isActive }) =>
                      playItemClass(isActive, false)
                    }
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 transition-colors duration-200 group-hover:bg-violet-500/25">
                      <Boxes className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white transition-colors group-hover:text-violet-300">
                        3D Play
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Play 3D Lottery
                      </p>
                    </div>
                  </NavLink>
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
                onClick={toggleMoreMenu}
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isMoreActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                <span>More</span>

                <ChevronDown
                  size={15}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${
                    moreMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

                {isMoreActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {/* More Dropdown */}

              {moreMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl shadow-slate-950/50">
                  {moreNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() =>
                          setMoreMenuOpen(false)
                        }
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
                onClick={toggleProfileMenu}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                  profileMenuOpen
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
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

                {/* Arrow */}

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
                <div className="absolute right-0 top-full z-[100] mt-2 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl shadow-slate-950/50">
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

                  {/* Profile Menu */}

                  <div className="p-2">
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
            <nav className="mx-auto max-w-7xl space-y-1 px-3 py-3 sm:px-5">
              {/* =================================================
                  DASHBOARD
              ================================================= */}

              <NavLink
                to="/player"
                end
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <LayoutDashboard size={17} />

                <span>Dashboard</span>
              </NavLink>

              {/* =================================================
                  MOBILE PLAY DROPDOWN
              ================================================= */}

              <div
                className={`rounded-xl border p-1 transition-colors ${
                  isPlayActive
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-slate-700 bg-slate-800/80"
                }`}
              >
                {/* Play Button */}

                <button
                  type="button"
                  onClick={togglePlayMenu}
                  aria-haspopup="menu"
                  aria-expanded={playMenuOpen}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                    isPlayActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isPlayActive
                          ? "bg-white/15 text-white"
                          : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                      }`}
                    >
                      <Dice5 size={16} />
                    </div>

                    <span>
                      <span className="block text-[13px] font-bold leading-tight">
                        Play
                      </span>

                      <span
                        className={`block text-[10px] leading-tight ${
                          isPlayActive
                            ? "text-indigo-100"
                            : "text-slate-500"
                        }`}
                      >
                        Choose your lottery
                      </span>
                    </span>
                  </span>

                  {/* Mobile Arrow */}

                  <ChevronDown
                    size={17}
                    strokeWidth={2.5}
                    className={`shrink-0 transition-transform duration-200 ${
                      playMenuOpen
                        ? "rotate-180"
                        : "rotate-0"
                    }`}
                  />
                </button>

                {/* =================================================
                    MOBILE PLAY ITEMS
                ================================================= */}

                {playMenuOpen && (
                  <div className="mt-1 space-y-1 border-t border-slate-700 pt-1">
                    {/* 2D */}

                    <NavLink
                      to="/player/play-2d"
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                          isActive
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                        }`
                      }
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                        <Dice5 size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-tight">
                          2D Play
                        </p>

                        <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                          Play 2D Lottery
                        </p>
                      </div>
                    </NavLink>

                    {/* 3D */}

                    <NavLink
                      to="/player/play-3d"
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                          isActive
                            ? "bg-violet-500/20 text-violet-300"
                            : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                        }`
                      }
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                        <Boxes size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-tight">
                          3D Play
                        </p>

                        <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                          Play 3D Lottery
                        </p>
                      </div>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* =================================================
                  MY TICKETS
              ================================================= */}

              <NavLink
                to="/player/tickets"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <Ticket size={17} />

                <span>My Tickets</span>
              </NavLink>

              {/* =================================================
                  WALLET
              ================================================= */}

              <NavLink
                to="/player/wallet"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <WalletCards size={17} />

                <span>Wallet</span>

                <span className="ml-auto text-[10px] font-bold text-emerald-400">
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
                        `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                            : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={17} />

                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="flex min-h-10 items-center rounded-xl px-3 py-2.5">
                  <NotificationBell role="PLAYER" />
                </div>

                {/* =================================================
                    PROFILE
                ================================================= */}

                <NavLink
                  to="/player/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                    }`
                  }
                >
                  <User size={17} />

                  <span>Profile</span>
                </NavLink>

                {/* =================================================
                    LOGOUT
                ================================================= */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={17} />

                  <span>Logout</span>
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