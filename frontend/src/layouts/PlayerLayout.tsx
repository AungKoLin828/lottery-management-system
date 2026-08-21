import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

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
  ArrowLeft,
  Bell,
} from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";

import NotificationBell from "@/components/common/notification/NotificationBell";

/* ============================================================
   TYPES
============================================================ */

type WalletBalanceResponse = {
  success?: boolean;
  message?: string;

  data?: {
    balance?: number | string | null;

    wallet?: {
      balance?: number | string | null;
    };

    data?: {
      balance?: number | string | null;
    };
  };

  wallet?: {
    balance?: number | string | null;
  };

  balance?: number | string | null;
};

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
   PLAYER ROUTE CHECK
============================================================ */

function isPlayerPath(path: string) {
  return path === "/player" || path.startsWith("/player/");
}

/* ============================================================
   FORMAT WALLET BALANCE
============================================================ */

function formatWalletBalance(
  amount: number | string | null | undefined,
): string {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US");
}

/* ============================================================
   EXTRACT WALLET BALANCE
============================================================ */

function extractWalletBalance(result: WalletBalanceResponse): number | null {
  /*
   * Supported response formats:
   *
   * 1.
   * {
   *   success: true,
   *   balance: 125000
   * }
   *
   * 2.
   * {
   *   success: true,
   *   data: {
   *     balance: 125000
   *   }
   * }
   *
   * 3.
   * {
   *   success: true,
   *   wallet: {
   *     balance: 125000
   *   }
   * }
   *
   * 4.
   * {
   *   success: true,
   *   data: {
   *     wallet: {
   *       balance: 125000
   *     }
   *   }
   *
   * 5.
   * {
   *   success: true,
   *   data: {
   *     data: {
   *       balance: 125000
   *     }
   *   }
   */

  const possibleBalances: Array<number | string | null | undefined> = [
    result.data?.balance,
    result.data?.wallet?.balance,
    result.data?.data?.balance,
    result.wallet?.balance,
    result.balance,
  ];

  for (const balance of possibleBalances) {
    if (balance !== null && balance !== undefined && balance !== "") {
      const numericBalance = Number(balance);

      if (Number.isFinite(numericBalance)) {
        return numericBalance;
      }
    }
  }

  return null;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PlayerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ============================================================
     WALLET BALANCE
  ============================================================ */

  const [walletBalance, setWalletBalance] = useState<number>(0);

  /* ============================================================
     DESKTOP DROPDOWN STATE
  ============================================================ */

  const [playMenuOpen, setPlayMenuOpen] = useState(false);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  /* ============================================================
     MOBILE STATE
  ============================================================ */

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [mobilePlayOpen, setMobilePlayOpen] = useState(false);

  /* ============================================================
     MOBILE BACK BUTTON
  ============================================================ */

  const [showBackButton, setShowBackButton] = useState(false);

  /* ============================================================
     REFS
  ============================================================ */

  const profileMenuRef = useRef<HTMLDivElement>(null);

  const playMenuRef = useRef<HTMLDivElement>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     PLAYER HISTORY STORAGE KEY
  ============================================================ */

  const PLAYER_HISTORY_KEY = "lottery_player_navigation_history";

  /* ============================================================
     ACTIVE ROUTES
  ============================================================ */

  const isPlayActive =
    location.pathname.startsWith("/player/play-2d") ||
    location.pathname.startsWith("/player/play-3d");

  const isMoreActive =
    location.pathname.startsWith("/player/results-history") ||
    location.pathname.startsWith("/player/contact");

  /* ============================================================
     LOAD WALLET BALANCE
  ============================================================ */

  const loadWalletBalance = useCallback(async () => {
    try {
      /*
       * IMPORTANT:
       *
       * Use the dedicated wallet balance endpoint instead of
       * /api/player/dashboard.
       *
       * Backend function:
       *
       * netlify/functions/wallet/balance.ts
       *
       * Netlify API route:
       *
       * /api/wallet/balance
       */

      const response = await fetch("/api/wallet/balance", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        console.error("Wallet balance API returned non-JSON response", {
          status: response.status,
          contentType,
        });

        return;
      }

      const result = (await response.json()) as WalletBalanceResponse;

      if (!response.ok) {
        console.error(
          "Failed to load wallet balance:",
          result.message || `HTTP ${response.status}`,
        );

        return;
      }

      if (result.success === false) {
        console.error(
          "Wallet balance API error:",
          result.message || "Unable to load wallet balance",
        );

        return;
      }

      const numericBalance = extractWalletBalance(result);

      if (numericBalance !== null) {
        setWalletBalance(numericBalance);
      } else {
        console.error("Wallet balance was not found in API response:", result);
      }
    } catch (error) {
      /*
       * Do not break PlayerLayout if the wallet API
       * temporarily fails.
       */

      console.error("Wallet balance loading error:", error);
    }
  }, []);

  /* ============================================================
     INITIAL WALLET BALANCE
  ============================================================ */

  useEffect(() => {
    void loadWalletBalance();
  }, [loadWalletBalance]);

  /* ============================================================
     REFRESH WALLET BALANCE WHEN PAGE BECOMES VISIBLE
  ============================================================ */

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadWalletBalance();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadWalletBalance]);

  /* ============================================================
     REFRESH WALLET BALANCE AFTER ROUTE CHANGE
  ============================================================ */

  useEffect(() => {
    /*
     * Refresh the balance whenever the player moves between pages.
     *
     * Useful after:
     *
     * Deposit
     * Withdraw
     * 2D Play
     * 3D Play
     */

    void loadWalletBalance();
  }, [location.pathname, loadWalletBalance]);

  /* ============================================================
     CLOSE EVERYTHING
  ============================================================ */

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setMobilePlayOpen(false);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     CLOSE MOBILE MENU
  ============================================================ */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobilePlayOpen(false);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     MOBILE NAVIGATION CLICK
  ============================================================ */

  const handleMobileNavigation = () => {
    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     TOGGLE MOBILE MENU
  ============================================================ */

  const toggleMobileMenu = () => {
    setMobileMenuOpen((current) => {
      const next = !current;

      if (!next) {
        setMobilePlayOpen(false);
      }

      return next;
    });

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     TOGGLE MOBILE PLAY
  ============================================================ */

  const toggleMobilePlay = () => {
    setMobilePlayOpen((current) => !current);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     TOGGLE DESKTOP PLAY
  ============================================================ */

  const togglePlayMenu = () => {
    setPlayMenuOpen((current) => !current);

    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     TOGGLE MORE
  ============================================================ */

  const toggleMoreMenu = () => {
    setMoreMenuOpen((current) => !current);

    setPlayMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     TOGGLE PROFILE
  ============================================================ */

  const toggleProfileMenu = () => {
    setProfileMenuOpen((current) => !current);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
  };

  /* ============================================================
     TRACK PLAYER ROUTES
  ============================================================ */

  useEffect(() => {
    if (!isPlayerPath(location.pathname)) {
      return;
    }

    try {
      const stored = sessionStorage.getItem(PLAYER_HISTORY_KEY);

      let history: string[] = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            history = parsed.filter(
              (item): item is string =>
                typeof item === "string" && isPlayerPath(item),
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

      sessionStorage.setItem(PLAYER_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore sessionStorage errors.
    }
  }, [location.pathname]);

  /* ============================================================
     MOBILE BACK BUTTON VISIBILITY
  ============================================================ */

  useEffect(() => {
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
  }, []);

  /* ============================================================
     SAFE PLAYER BACK
  ============================================================ */

  const handlePlayerBack = () => {
    try {
      const stored = sessionStorage.getItem(PLAYER_HISTORY_KEY);

      let history: string[] = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            history = parsed.filter(
              (item): item is string =>
                typeof item === "string" && isPlayerPath(item),
            );
          }
        } catch {
          history = [];
        }
      }

      /* Remove current page */

      if (
        history.length > 0 &&
        history[history.length - 1] === location.pathname
      ) {
        history.pop();
      }

      /* Previous player page */

      const previousPlayerPage = history[history.length - 1];

      /* Save updated history */

      sessionStorage.setItem(PLAYER_HISTORY_KEY, JSON.stringify(history));

      /* Navigate to previous player page */

      if (previousPlayerPage && isPlayerPath(previousPlayerPage)) {
        navigate(previousPlayerPage);
        return;
      }

      /* Safe fallback */

      navigate("/player");
    } catch {
      navigate("/player");
    }
  };

  /* ============================================================
     ROUTE CHANGE
  ============================================================ */

  useEffect(() => {
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  /* ============================================================
     DESKTOP OUTSIDE CLICK
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
     DESKTOP NAV CLASS
  ============================================================ */

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
    }`;

  /* ============================================================
     PLAY ITEM CLASS
  ============================================================ */

  const playItemClass = (isActive: boolean, is2D: boolean) =>
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
     FORMATTED BALANCE
  ============================================================ */

  const formattedWalletBalance = formatWalletBalance(walletBalance);

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
                AB
              </span>

              <span className="text-lg font-extrabold tracking-tight text-indigo-400">
                CD
              </span>
            </div>
          </NavLink>

          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden items-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 lg:flex">
            {/* DASHBOARD */}

            <NavLink to="/player" end className={navClass}>
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            {/* PLAY */}

            <div ref={playMenuRef} className="relative">
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
                <Dice5
                  size={17}
                  className={`transition-all duration-200 ${
                    playMenuOpen ? "rotate-6 text-indigo-300" : ""
                  }`}
                />

                <span>Play</span>

                <ChevronDown
                  size={15}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${
                    playMenuOpen ? "rotate-180" : ""
                  }`}
                />

                {isPlayActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {playMenuOpen && (
                <div
                  className="absolute left-0 top-full z-[100] mt-2 w-64 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl shadow-slate-950/50"
                  role="menu"
                >
                  <div className="px-3 pb-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Choose Game
                      </p>
                    </div>
                  </div>

                  {playNavigation.map((item, index) => {
                    const Icon = item.icon;

                    const is2D = index === 0;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        onClick={() => {
                          setPlayMenuOpen(false);
                          setMoreMenuOpen(false);
                          setProfileMenuOpen(false);
                        }}
                        className={({ isActive }) =>
                          playItemClass(isActive, is2D)
                        }
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            is2D
                              ? "bg-indigo-500/15 text-indigo-400"
                              : "bg-violet-500/15 text-violet-400"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MY TICKETS */}

            <NavLink to="/player/tickets" className={navClass}>
              <Ticket size={17} />
              My Tickets
            </NavLink>

            {/* WALLET */}

            <NavLink to="/player/wallet" className={navClass}>
              <WalletCards size={17} />
              Wallet
            </NavLink>

            {/* MORE */}

            <div ref={moreMenuRef} className="relative">
              <button
                type="button"
                onClick={toggleMoreMenu}
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
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
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                />

                {isMoreActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-2xl shadow-slate-950/50">
                  {moreNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setPlayMenuOpen(false);
                          setProfileMenuOpen(false);
                        }}
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
            {/* WALLET */}

            <NavLink
              to="/player/wallet"
              onClick={closeAllMenus}
              className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/15 sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <WalletCards size={16} />
              </div>

              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
                  Balance
                </p>

                <p className="text-sm font-bold text-white">
                  {formattedWalletBalance} MMK
                </p>
              </div>
            </NavLink>

            {/* ==================================================
                DESKTOP NOTIFICATIONS
            =================================================== */}

            <div className="hidden rounded-xl sm:block">
              <NotificationBell role="PLAYER" />
            </div>

            {/* PROFILE */}

            <div ref={profileMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={toggleProfileMenu}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all ${
                  profileMenuOpen
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                  AK
                </div>

                <div className="hidden text-left xl:block">
                  <p className="text-xs font-bold text-white">Player</p>

                  <p className="max-w-[130px] truncate text-[10px] text-slate-400">
                    player@example.com
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl shadow-slate-950/50">
                  <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                        AK
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">Player</p>

                        <p className="truncate text-xs text-slate-400">
                          player@example.com
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <NavLink
                      to="/player/profile"
                      onClick={closeAllMenus}
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

            {/* ==================================================
                MOBILE MENU BUTTON
            =================================================== */}

            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 lg:hidden ${
                mobileMenuOpen
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-indigo-500/20 hover:text-white"
              }`}
              aria-label={
                mobileMenuOpen ? "Close navigation" : "Open navigation"
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
              {/* DASHBOARD */}

              <NavLink
                to="/player"
                end
                onClick={handleMobileNavigation}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-950/30"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <LayoutDashboard size={17} />
                </span>

                <span>Dashboard</span>
              </NavLink>

              {/* MOBILE PLAY */}

              <div
                className={`rounded-xl border p-1 transition-colors ${
                  isPlayActive
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-slate-700 bg-slate-800/80"
                }`}
              >
                <button
                  type="button"
                  onClick={toggleMobilePlay}
                  aria-haspopup="menu"
                  aria-expanded={mobilePlayOpen}
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
                          isPlayActive ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        Choose your lottery
                      </span>
                    </span>
                  </span>

                  <ChevronDown
                    size={17}
                    strokeWidth={2.5}
                    className={`shrink-0 transition-transform duration-200 ${
                      mobilePlayOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobilePlayOpen && (
                  <div className="mt-1 space-y-1 border-t border-slate-700 pt-1">
                    {/* 2D */}

                    <NavLink
                      to="/player/play-2d"
                      onClick={handleMobileNavigation}
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
                      onClick={handleMobileNavigation}
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

              {/* MY TICKETS */}

              <NavLink
                to="/player/tickets"
                onClick={handleMobileNavigation}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-950/30"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <Ticket size={17} />
                </span>

                <span>My Tickets</span>
              </NavLink>

              {/* WALLET */}

              <NavLink
                to="/player/wallet"
                onClick={handleMobileNavigation}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-950/30"
                      : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                  <WalletCards size={17} />
                </span>

                <span>Wallet</span>

                <span className="ml-auto rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                  {formattedWalletBalance} MMK
                </span>
              </NavLink>

              {/* MORE SECTION */}

              <div className="mt-2 border-t border-slate-700 pt-2">
                {/* RESULTS + CONTACT */}

                {moreNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleMobileNavigation}
                      className={({ isActive }) =>
                        `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-950/30"
                            : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                        }`
                      }
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                        <Icon size={17} />
                      </span>

                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}

                {/* MOBILE NOTIFICATIONS */}

                <div className="relative mt-1">
                  <div
                    className="
                      flex
                      min-h-11
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800/80
                      px-3
                      py-2
                      text-slate-300
                      transition-all
                      duration-200
                      hover:border-indigo-500/40
                      hover:bg-indigo-500/10
                      hover:text-white
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
                        shadow-md
                        shadow-indigo-950/30
                      "
                    >
                      <Bell className="h-4 w-4" strokeWidth={2.5} />
                    </span>

                    <span className="text-[13px] font-semibold">
                      Notifications
                    </span>

                    <div
                      className="
                        ml-auto
                        flex
                        shrink-0
                        items-center
                        justify-center
                        [&>button]:!flex
                        [&>button]:!h-9
                        [&>button]:!w-9
                        [&>button]:!items-center
                        [&>button]:!justify-center
                        [&>button]:!rounded-lg
                        [&>button]:!border
                        [&>button]:!border-indigo-500/30
                        [&>button]:!bg-indigo-500/10
                        [&>button]:!text-indigo-300
                        [&>button]:hover:!border-indigo-400/50
                        [&>button]:hover:!bg-indigo-500/20
                        [&>button]:hover:!text-white
                        [&_svg]:!h-[18px]
                        [&_svg]:!w-[18px]
                      "
                    >
                      <NotificationBell role="PLAYER" />
                    </div>
                  </div>
                </div>

                {/* PROFILE */}

                <NavLink
                  to="/player/profile"
                  onClick={handleMobileNavigation}
                  className={({ isActive }) =>
                    `mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-950/30"
                        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                    }`
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    <User size={17} />
                  </span>

                  <span>Profile</span>
                </NavLink>

                {/* LOGOUT */}

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
                    transition-all
                    duration-200
                    hover:bg-red-500/10
                    hover:text-red-300
                  "
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <LogOut size={17} />
                  </span>

                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ======================================================
          MOBILE FLOATING BACK BUTTON
      ======================================================= */}

      <div
        className={`fixed bottom-5 right-4 z-[60] lg:hidden ${
          showBackButton
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        } transition-all duration-300 ease-out`}
      >
        <button
          type="button"
          onClick={handlePlayerBack}
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
            hover:from-indigo-500
            hover:to-violet-500
            hover:border-indigo-300/60
            hover:shadow-xl
            hover:shadow-indigo-900/50
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
            <ArrowLeft className="h-4 w-4" strokeWidth={2.75} />
          </span>

          <span className="pr-1 tracking-wide">Back</span>
        </button>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
