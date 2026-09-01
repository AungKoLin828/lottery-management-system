import { NavLink, Outlet, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Ticket,
  WalletCards,
  User,
  Dice5,
  Boxes,
  LogOut,
  MessageCircle,
  BarChart3,
  ChevronDown,
  Sparkles,
  Bell,
  MoreHorizontal,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import NotificationBell from "@/components/common/notification/NotificationBell";

/* ============================================================
   TYPES
============================================================ */

type WalletBalanceResponse = {
  success?: boolean;
  message?: string;

  balance?: number | string | null;

  wallet?: {
    balance?: number | string | null;
  } | null;

  stats?: {
    walletBalance?: number | string | null;
    balance?: number | string | null;
  } | null;

  data?: {
    balance?: number | string | null;

    wallet?: {
      balance?: number | string | null;
    } | null;

    stats?: {
      walletBalance?: number | string | null;
      balance?: number | string | null;
    } | null;

    [key: string]: unknown;
  } | null;
};

/* ============================================================
   WALLET BALANCE UPDATE EVENT
============================================================ */

export const WALLET_BALANCE_UPDATED_EVENT = "wallet-balance-updated";

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
   PWA DETECTION
============================================================ */

/**
 * Returns true ONLY when the application is running in a
 * PWA / Home Screen standalone environment.
 *
 * Browser:
 *   false
 *
 * Installed PWA:
 *   true
 *
 * iOS Safari Home Screen:
 *   true
 *
 * Android / Chrome standalone:
 *   true
 *
 * Fullscreen:
 *   true
 *
 * Minimal UI:
 *   true
 */
function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  /* ==========================================================
     STANDARD PWA STANDALONE MODE
  ========================================================== */

  const standalone = window.matchMedia("(display-mode: standalone)").matches;

  /* ==========================================================
     IOS SAFARI HOME SCREEN MODE
  ========================================================== */

  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean(
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone,
    );

  /* ==========================================================
     FULLSCREEN PWA MODE
  ========================================================== */

  const fullscreen = window.matchMedia("(display-mode: fullscreen)").matches;

  /* ==========================================================
     MINIMAL UI PWA MODE
  ========================================================== */

  const minimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;

  return standalone || iosStandalone || fullscreen || minimalUi;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PlayerLayout() {
  const location = useLocation();

  /* ============================================================
     PWA STATE

     IMPORTANT:
     This state controls ONLY the PWA-specific bottom
     navigation and PWA mobile popup menus.

     It does NOT change the normal browser navigation.
  ============================================================ */

  const [isPWA, setIsPWA] = useState(false);

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
     MOBILE / PWA STATE

     These are intentionally used ONLY by the installed PWA
     bottom navigation.
  ============================================================= */

  const [mobilePlayOpen, setMobilePlayOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  /* ============================================================
     ACTIVE ROUTES
============================================================ */

  const isPlayActive =
    location.pathname.startsWith("/player/play-2d") ||
    location.pathname.startsWith("/player/play-3d");

  const isMoreActive =
    location.pathname.startsWith("/player/results-history") ||
    location.pathname.startsWith("/player/contact") ||
    location.pathname.startsWith("/player/profile");

  /* ============================================================
     DETECT PWA
============================================================ */

  useEffect(() => {
    const updatePWAMode = () => {
      setIsPWA(isRunningAsPWA());
    };

    /* Initial detection */
    updatePWAMode();

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");

    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");

    const minimalUiMedia = window.matchMedia("(display-mode: minimal-ui)");

    const handleDisplayModeChange = () => {
      updatePWAMode();
    };

    standaloneMedia.addEventListener("change", handleDisplayModeChange);

    fullscreenMedia.addEventListener("change", handleDisplayModeChange);

    minimalUiMedia.addEventListener("change", handleDisplayModeChange);

    /*
     * Also re-check when the application becomes visible.
     *
     * This is useful when:
     * - user installs the PWA
     * - user returns from the Home Screen
     * - browser changes display mode
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePWAMode();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      standaloneMedia.removeEventListener("change", handleDisplayModeChange);

      fullscreenMedia.removeEventListener("change", handleDisplayModeChange);

      minimalUiMedia.removeEventListener("change", handleDisplayModeChange);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* ============================================================
     LOAD WALLET BALANCE
============================================================ */

  const loadWalletBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/player/dashboard", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      const rawResponse = await response.text();

      if (!rawResponse.trim()) {
        console.error("Wallet balance API returned an empty response", {
          status: response.status,
          contentType,
        });

        return;
      }

      let result: WalletBalanceResponse;

      try {
        result = JSON.parse(rawResponse) as WalletBalanceResponse;
      } catch (parseError) {
        console.error("Wallet balance API returned non-JSON response", {
          status: response.status,
          contentType,
          responsePreview: rawResponse.substring(0, 500),
          parseError,
        });

        return;
      }

      if (!response.ok || result.success === false) {
        console.error("Failed to load player wallet balance", {
          status: response.status,
          message: result.message,
          response: result,
        });

        return;
      }

      const balance =
        result.data?.stats?.walletBalance ??
        result.data?.stats?.balance ??
        result.data?.balance ??
        result.data?.wallet?.balance ??
        result.stats?.walletBalance ??
        result.stats?.balance ??
        result.balance ??
        result.wallet?.balance ??
        0;

      const numericBalance = Number(balance);

      if (!Number.isFinite(numericBalance)) {
        console.error("Invalid wallet balance returned by API", {
          balance,
          response: result,
        });

        return;
      }

      setWalletBalance(numericBalance);
    } catch (error) {
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
     REFRESH WALLET BALANCE AFTER ROUTE CHANGE
============================================================ */

  useEffect(() => {
    void loadWalletBalance();
  }, [location.pathname, loadWalletBalance]);

  /* ============================================================
     REFRESH WHEN PAGE BECOMES VISIBLE
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
     REAL-TIME WALLET BALANCE UPDATE EVENT
============================================================ */

  useEffect(() => {
    const handleWalletBalanceUpdated = () => {
      void loadWalletBalance();
    };

    window.addEventListener(
      WALLET_BALANCE_UPDATED_EVENT,
      handleWalletBalanceUpdated,
    );

    return () => {
      window.removeEventListener(
        WALLET_BALANCE_UPDATED_EVENT,
        handleWalletBalanceUpdated,
      );
    };
  }, [loadWalletBalance]);

  /* ============================================================
     WALLET BALANCE FALLBACK REFRESH
============================================================ */

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadWalletBalance();
      }
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadWalletBalance]);

  /* ============================================================
     CLOSE ALL MENUS
============================================================ */

  const closeAllMenus = () => {
    setMobilePlayOpen(false);
    setMobileMoreOpen(false);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     MOBILE / PWA NAVIGATION
============================================================ */

  const handleMobileNavigation = () => {
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     MOBILE / PWA PLAY
============================================================ */

  const toggleMobilePlay = () => {
    /*
     * Never open the PWA bottom menu in a normal browser.
     */
    if (!isPWA) {
      return;
    }

    setMobilePlayOpen((current) => !current);
    setMobileMoreOpen(false);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     MOBILE / PWA MORE
============================================================ */

  const toggleMobileMore = () => {
    /*
     * Never open the PWA bottom menu in a normal browser.
     */
    if (!isPWA) {
      return;
    }

    setMobileMoreOpen((current) => !current);
    setMobilePlayOpen(false);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     DESKTOP PLAY
============================================================ */

  const togglePlayMenu = () => {
    setPlayMenuOpen((current) => !current);

    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     DESKTOP MORE
============================================================ */

  const toggleMoreMenu = () => {
    setMoreMenuOpen((current) => !current);

    setPlayMenuOpen(false);
    setProfileMenuOpen(false);
  };

  /* ============================================================
     DESKTOP PROFILE
============================================================ */

  const toggleProfileMenu = () => {
    setProfileMenuOpen((current) => !current);

    setPlayMenuOpen(false);
    setMoreMenuOpen(false);
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

      const menus = document.querySelectorAll("[data-player-menu]");

      let clickedInsideMenu = false;

      menus.forEach((menu) => {
        if (menu.contains(target)) {
          clickedInsideMenu = true;
        }
      });

      if (!clickedInsideMenu) {
        setProfileMenuOpen(false);
        setPlayMenuOpen(false);
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
     PWA BOTTOM SPACING

     Only installed PWA receives extra bottom spacing.
     Normal browser — including mobile browser — does not.
  ============================================================= */

  const mainPaddingBottom = isPWA ? "pb-28" : "pb-6";

  /* ============================================================
     RENDER
============================================================ */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] items-center justify-between gap-3 px-3 sm:h-[72px] sm:px-6 lg:max-w-7xl lg:px-8">
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

              IMPORTANT:
              This remains lg:flex exactly as before.

              Therefore:
              - Desktop browser = desktop menu
              - Mobile browser = existing mobile header
              - Installed PWA = PWA bottom menu
          ================================================== */}

          <nav className="hidden min-w-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 lg:flex">
            <NavLink to="/player" end className={navClass}>
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            {/* PLAY */}

            <div data-player-menu className="relative">
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
                        onClick={closeAllMenus}
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

            <div data-player-menu className="relative">
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
                        onClick={closeAllMenus}
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
          ================================================== */}

          <div className="flex shrink-0 items-center gap-2">
            {/* DESKTOP BALANCE */}

            <NavLink
              to="/player/wallet"
              onClick={closeAllMenus}
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/15 lg:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <WalletCards size={16} />
              </div>

              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
                  Balance
                </p>

                <p className="whitespace-nowrap text-sm font-bold text-white">
                  {formattedWalletBalance} MMK
                </p>
              </div>
            </NavLink>

            {/* MOBILE BALANCE */}

            <NavLink
              to="/player/wallet"
              onClick={closeAllMenus}
              className="flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 lg:hidden"
            >
              <WalletCards size={17} className="text-emerald-400" />

              <span className="ml-1.5 text-xs font-bold text-white">
                {formattedWalletBalance}
              </span>

              <span className="ml-1 text-[9px] font-semibold text-emerald-400">
                MMK
              </span>
            </NavLink>

            {/* NOTIFICATIONS */}

            <div className="hidden shrink-0 rounded-xl lg:block">
              <NotificationBell role="PLAYER" />
            </div>

            <div className="flex shrink-0 rounded-xl lg:hidden">
              <NotificationBell role="PLAYER" />
            </div>

            {/* DESKTOP PROFILE */}

            <div data-player-menu className="relative hidden shrink-0 lg:block">
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
          </div>
        </div>
      </header>

      {/* ======================================================
          PWA MOBILE PLAY POPUP

          IMPORTANT:
          This can NEVER appear in a normal browser.
      ======================================================= */}

      {isPWA && mobilePlayOpen && (
        <div className="fixed inset-x-3 bottom-[82px] z-[80] lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/98 p-2 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Choose Game
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {playNavigation.map((item, index) => {
                const Icon = item.icon;
                const is2D = index === 0;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleMobileNavigation}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center rounded-xl border px-3 py-4 text-center transition-all ${
                        isActive
                          ? is2D
                            ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                            : "border-violet-500/40 bg-violet-500/20 text-violet-300"
                          : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                      }`
                    }
                  >
                    <div
                      className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl ${
                        is2D
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-violet-500/15 text-violet-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="text-xs font-bold">{item.name}</span>

                    <span className="mt-0.5 text-[9px] text-slate-500">
                      {item.description}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PWA MOBILE MORE POPUP

          IMPORTANT:
          This can NEVER appear in a normal browser.
      ======================================================= */}

      {isPWA && mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-[82px] z-[80] lg:hidden">
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/98 p-2 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
            <div className="px-3 pb-2 pt-1">
              <div className="flex items-center gap-2">
                <MoreHorizontal className="h-3.5 w-3.5 text-indigo-400" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  More
                </span>
              </div>
            </div>

            <div className="space-y-1">
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
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
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

              <div className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <Bell size={17} />
                </span>

                <span>Notifications</span>

                <div className="ml-auto">
                  <NotificationBell role="PLAYER" />
                </div>
              </div>

              <NavLink
                to="/player/profile"
                onClick={handleMobileNavigation}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <User size={17} />
                </span>

                <span>Profile</span>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <LogOut size={17} />
                </span>

                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          PWA MOBILE BOTTOM NAVIGATION

          THIS IS THE ONLY PLACE WHERE THE MOBILE BOTTOM
          NAVIGATION IS RENDERED.

          Normal browser:
              isPWA === false
              -> NOTHING RENDERED

          Installed PWA / Home Screen:
              isPWA === true
              -> RENDERED

          The lg:hidden class is intentionally retained so
          desktop PWA still uses the normal desktop menu.
      ======================================================= */}

      {isPWA && (
        <nav className="fixed inset-x-0 bottom-0 z-[75] border-t border-slate-700/80 bg-slate-900/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid h-[68px] max-w-md grid-cols-5 px-1">
            {/* HOME */}

            <NavLink
              to="/player"
              end
              onClick={handleMobileNavigation}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? "text-indigo-300"
                    : "text-slate-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive ? "bg-indigo-500/15" : "bg-transparent"
                    }`}
                  >
                    <LayoutDashboard
                      className="h-[19px] w-[19px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className="text-[10px] font-semibold">Home</span>

                  {isActive && (
                    <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
                  )}
                </>
              )}
            </NavLink>

            {/* PLAY */}

            <button
              type="button"
              onClick={toggleMobilePlay}
              aria-label="Open Play menu"
              aria-expanded={mobilePlayOpen}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isPlayActive || mobilePlayOpen
                  ? "text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div
                className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                  isPlayActive || mobilePlayOpen
                    ? "bg-indigo-500/15"
                    : "bg-transparent"
                }`}
              >
                <Dice5
                  className="h-[20px] w-[20px]"
                  strokeWidth={isPlayActive || mobilePlayOpen ? 2.5 : 2}
                />
              </div>

              <span className="text-[10px] font-semibold">Play</span>

              {(isPlayActive || mobilePlayOpen) && (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
              )}
            </button>

            {/* TICKETS */}

            <NavLink
              to="/player/tickets"
              onClick={handleMobileNavigation}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? "text-indigo-300"
                    : "text-slate-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive ? "bg-indigo-500/15" : "bg-transparent"
                    }`}
                  >
                    <Ticket
                      className="h-[19px] w-[19px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className="text-[10px] font-semibold">Tickets</span>

                  {isActive && (
                    <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
                  )}
                </>
              )}
            </NavLink>

            {/* WALLET */}

            <NavLink
              to="/player/wallet"
              onClick={handleMobileNavigation}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? "text-emerald-300"
                    : "text-slate-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive ? "bg-emerald-500/15" : "bg-transparent"
                    }`}
                  >
                    <WalletCards
                      className="h-[19px] w-[19px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className="text-[10px] font-semibold">Wallet</span>

                  {isActive && (
                    <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-emerald-400" />
                  )}
                </>
              )}
            </NavLink>

            {/* MORE */}

            <button
              type="button"
              onClick={toggleMobileMore}
              aria-label="Open more menu"
              aria-expanded={mobileMoreOpen}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isMoreActive || mobileMoreOpen
                  ? "text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div
                className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                  isMoreActive || mobileMoreOpen
                    ? "bg-indigo-500/15"
                    : "bg-transparent"
                }`}
              >
                <MoreHorizontal
                  className="h-[21px] w-[21px]"
                  strokeWidth={isMoreActive || mobileMoreOpen ? 2.5 : 2}
                />
              </div>

              <span className="text-[10px] font-semibold">More</span>

              {(isMoreActive || mobileMoreOpen) && (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
              )}
            </button>
          </div>
        </nav>
      )}

      {/* ======================================================
          MAIN CONTENT

          Normal browser:
              pb-6

          Installed PWA:
              pb-28

          Therefore the browser never reserves space for a
          bottom menu that is not present.
      ======================================================= */}

      <main
        className={`mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8 lg:py-8 ${mainPaddingBottom}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
