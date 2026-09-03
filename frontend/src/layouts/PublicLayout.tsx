import { Link, Outlet, useLocation } from "react-router-dom";

import {
  Home,
  BarChart3,
  Info,
  Dice5,
  Boxes,
  ChevronDown,
  Sparkles,
  Ticket,
  MoreHorizontal,
  Menu,
  X,
  LogIn,
  UserPlus,
  Download,
  Smartphone,
  Apple,
  CheckCircle2,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   PUBLIC PLAY NAVIGATION
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
   PWA DETECTION
============================================================ */

/**
 * Returns true only when the application is actually running
 * in an installed / standalone PWA environment.
 *
 * Normal browser:
 *   false
 *
 * Installed PWA:
 *   true
 *
 * iOS Home Screen:
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
     STANDARD STANDALONE
  ========================================================== */

  const standalone = window.matchMedia("(display-mode: standalone)").matches;

  /* ==========================================================
     IOS SAFARI HOME SCREEN
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
     FULLSCREEN
  ========================================================== */

  const fullscreen = window.matchMedia("(display-mode: fullscreen)").matches;

  /* ==========================================================
     MINIMAL UI
  ========================================================== */

  const minimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;

  return standalone || iosStandalone || fullscreen || minimalUi;
}

/* ============================================================
   MOBILE IOS DETECTION
============================================================ */

function isIOSDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent || "";

  const platform = window.navigator.platform || "";

  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PublicLayout() {
  const location = useLocation();

  /* ============================================================
     PWA STATE

     Normal browser:
       false
       -> No PWA bottom navigation
       -> Mobile hamburger/sidebar displayed

     Installed PWA:
       true
       -> PWA mobile bottom navigation displayed
       -> Mobile hamburger/sidebar hidden
  ============================================================ */

  const [isInstalledPWA, setIsInstalledPWA] = useState(false);

  /* ============================================================
     PWA INSTALL STATE
  ============================================================ */

  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showInstallMenu, setShowInstallMenu] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);

  /* ============================================================
     MOBILE / PWA MENU STATE
  ============================================================ */

  const [mobilePlayOpen, setMobilePlayOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  /* ============================================================
     MOBILE BROWSER SIDEBAR STATE
  ============================================================ */

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ============================================================
     DESKTOP MENU STATE
  ============================================================ */

  const [desktopPlayOpen, setDesktopPlayOpen] = useState(false);

  /* ============================================================
     REFS
  ============================================================ */

  const playMenuRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     IOS
  ============================================================ */

  const iosDevice = isIOSDevice();

  /* ============================================================
     PWA INSTALL EVENT
  ============================================================ */

  useEffect(() => {
    /**
     * Chrome / Edge / Android install prompt.
     *
     * The browser fires this event when the application
     * satisfies the PWA installation requirements.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    /**
     * Fires after successful PWA installation.
     */
    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstalling(false);
      setShowInstallMenu(false);

      setIsInstalledPWA(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /* ============================================================
     DETECT PWA
  ============================================================ */

  useEffect(() => {
    const checkPWAInstalled = () => {
      setIsInstalledPWA(isRunningAsPWA());
    };

    /* Initial detection */
    checkPWAInstalled();

    /* ==========================================================
       DISPLAY MODE MEDIA QUERIES
    ========================================================== */

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");

    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");

    const minimalUiMedia = window.matchMedia("(display-mode: minimal-ui)");

    const handleDisplayModeChange = () => {
      checkPWAInstalled();
    };

    standaloneMedia.addEventListener("change", handleDisplayModeChange);

    fullscreenMedia.addEventListener("change", handleDisplayModeChange);

    minimalUiMedia.addEventListener("change", handleDisplayModeChange);

    /* ==========================================================
       VISIBILITY CHANGE
    ========================================================== */

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPWAInstalled();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    /* ==========================================================
       WINDOW FOCUS
    ========================================================== */

    window.addEventListener("focus", checkPWAInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", handleDisplayModeChange);

      fullscreenMedia.removeEventListener("change", handleDisplayModeChange);

      minimalUiMedia.removeEventListener("change", handleDisplayModeChange);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", checkPWAInstalled);
    };
  }, []);

  /* ============================================================
     ACTIVE ROUTES
  ============================================================ */

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  /* ============================================================
     PLAY ACTIVE
  ============================================================ */

  const isPlayActive =
    location.pathname === "/player/play-2d" ||
    location.pathname === "/player/play-3d";

  /* ============================================================
     MORE ACTIVE
  ============================================================ */

  const isMoreActive =
    location.pathname === "/login" || location.pathname === "/register";

  /* ============================================================
     CLOSE ALL MENUS
  ============================================================ */

  const closeAllMenus = () => {
    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
    setMobileSidebarOpen(false);
    setDesktopPlayOpen(false);
    setShowInstallMenu(false);
  };

  /* ============================================================
     OPEN INSTALL MENU
  ============================================================ */

  const openInstallMenu = () => {
    setShowInstallMenu(true);

    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
    setMobileSidebarOpen(false);
    setDesktopPlayOpen(false);
  };

  /* ============================================================
     CLOSE INSTALL MENU
  ============================================================ */

  const closeInstallMenu = () => {
    setShowInstallMenu(false);
  };

  /* ============================================================
     NATIVE PWA INSTALL
  ============================================================ */

  const installPWA = async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    try {
      setIsInstalling(true);

      await deferredInstallPrompt.prompt();

      const choiceResult = await deferredInstallPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setDeferredInstallPrompt(null);
      }
    } catch (error) {
      console.error("PWA installation error:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  /* ============================================================
     MOBILE BROWSER SIDEBAR
  ============================================================ */

  const toggleMobileSidebar = () => {
    /*
     * Never open the sidebar in an installed PWA.
     */
    if (isInstalledPWA) {
      return;
    }

    setMobileSidebarOpen((current) => !current);

    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
    setDesktopPlayOpen(false);
    setShowInstallMenu(false);
  };

  /* ============================================================
     MOBILE BROWSER SIDEBAR NAVIGATION
  ============================================================ */

  const handleMobileSidebarNavigation = () => {
    setMobileSidebarOpen(false);
    closeAllMenus();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
     ROUTE CHANGE
  ============================================================ */

  useEffect(() => {
    closeAllMenus();
    setMobileSidebarOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  /* ============================================================
     MOBILE / PWA PLAY
  ============================================================ */

  const toggleMobilePlay = () => {
    /*
     * Never open this menu in a normal browser.
     */
    if (!isInstalledPWA) {
      return;
    }

    setMobilePlayOpen((current) => !current);

    setMobileMoreOpen(false);
    setMobileSidebarOpen(false);
    setDesktopPlayOpen(false);
    setShowInstallMenu(false);
  };

  /* ============================================================
     MOBILE / PWA MORE
  ============================================================ */

  const toggleMobileMore = () => {
    /*
     * Never open this menu in a normal browser.
     */
    if (!isInstalledPWA) {
      return;
    }

    setMobileMoreOpen((current) => !current);

    setMobilePlayOpen(false);
    setMobileSidebarOpen(false);
    setDesktopPlayOpen(false);
    setShowInstallMenu(false);
  };

  /* ============================================================
     DESKTOP PLAY
  ============================================================ */

  const toggleDesktopPlay = () => {
    setDesktopPlayOpen((current) => !current);

    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
    setMobileSidebarOpen(false);
    setShowInstallMenu(false);
  };

  /* ============================================================
     PLAY LOGIN REDIRECT
  ============================================================ */

  const handlePlay = (destination: string) => {
    closeAllMenus();

    /*
     * Keep the existing login redirect behavior.
     */
    window.location.href = `/login?from=${encodeURIComponent(destination)}`;
  };

  /* ============================================================
     DESKTOP OUTSIDE CLICK
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (playMenuRef.current && !playMenuRef.current.contains(target)) {
        setDesktopPlayOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ============================================================
     DESKTOP NAV CLASS
  ============================================================ */

  const navClass = (active: boolean) =>
    `group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
    }`;

  /* ============================================================
     PLAY ITEM CLASS
  ============================================================ */

  const playItemClass = (active: boolean, is2D: boolean) =>
    `group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
      active
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
          HEADER SAFE AREA
      ======================================================= */}

      <header className="pwa-header-safe sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-xl">
        <div
          className="
            mx-auto
            flex
            h-[64px]
            min-w-0
            items-center
            justify-between
            gap-2
            px-3
            sm:h-[72px]
            sm:gap-3
            sm:px-6
            lg:max-w-7xl
            lg:px-8
          "
        >
          {/* ==================================================
              LOGO
          =================================================== */}

          <Link
            to="/"
            onClick={closeAllMenus}
            className="header-logo group flex min-w-0 shrink-0 items-center gap-2.5"
            aria-label="LotteryPlay Home"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="
                block
                h-7
                w-7
                shrink-0
                rounded-lg
                object-contain
                transition-transform
                duration-200
                group-hover:scale-105
              "
            />

            <div className="flex min-w-0 items-center">
              <span className="text-lg font-extrabold tracking-tight text-white">
                AB
              </span>

              <span className="text-lg font-extrabold tracking-tight text-indigo-400">
                CD
              </span>
            </div>
          </Link>

          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden min-w-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 lg:flex">
            {/* HOME */}

            <Link
              to="/"
              onClick={closeAllMenus}
              className={navClass(isActive("/"))}
            >
              <Home size={17} />

              <span>Home</span>

              {isActive("/") && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
              )}
            </Link>

            {/* =================================================
                PLAY
            ================================================= */}

            <div ref={playMenuRef} className="relative">
              <button
                type="button"
                onClick={toggleDesktopPlay}
                aria-haspopup="menu"
                aria-expanded={desktopPlayOpen}
                className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isPlayActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                }`}
              >
                <Dice5
                  size={17}
                  className={`transition-all duration-200 ${
                    desktopPlayOpen ? "rotate-6 text-indigo-300" : ""
                  }`}
                />

                <span>Play</span>

                <ChevronDown
                  size={15}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${
                    desktopPlayOpen ? "rotate-180" : ""
                  }`}
                />

                {isPlayActive && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                )}
              </button>

              {/* DESKTOP PLAY POPUP */}

              {desktopPlayOpen && (
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
                      <button
                        key={item.path}
                        type="button"
                        role="menuitem"
                        onClick={() => handlePlay(item.path)}
                        className={playItemClass(
                          location.pathname === item.path,
                          is2D,
                        )}
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
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RESULTS HISTORY */}

            <Link
              to="/results-history"
              onClick={closeAllMenus}
              className={navClass(isActive("/results-history"))}
            >
              <BarChart3 size={17} />

              <span>Results History</span>

              {isActive("/results-history") && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
              )}
            </Link>

            {/* ABOUT */}

            <Link
              to="/about"
              onClick={closeAllMenus}
              className={navClass(isActive("/about"))}
            >
              <Info size={17} />

              <span>About</span>

              {isActive("/about") && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
              )}
            </Link>

            {/* =================================================
                INSTALL APP
            ================================================= */}

            {!isInstalledPWA && (
              <button
                type="button"
                onClick={openInstallMenu}
                className={navClass(showInstallMenu)}
              >
                <Download size={17} />

                <span>Install App</span>
              </button>
            )}
          </nav>

          {/* ==================================================
              DESKTOP AUTH
          ================================================== */}

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {/* LOGIN */}

            <Link
              to="/login"
              onClick={closeAllMenus}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive("/login")
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
              }`}
            >
              Login
            </Link>

            {/* REGISTER */}

            <Link
              to="/register"
              onClick={closeAllMenus}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-900/40 ${
                isActive("/register") ? "ring-2 ring-indigo-400/40" : ""
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Register
            </Link>
          </div>

          {/* ==================================================
              MOBILE HEADER
          ================================================== */}

          <div className="flex shrink-0 items-center lg:hidden">
            {!isInstalledPWA && (
              <button
                type="button"
                onClick={toggleMobileSidebar}
                aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileSidebarOpen}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white active:scale-95"
              >
                {mobileSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================
          INSTALL APP MENU / GUIDE
      ======================================================= */}

      {!isInstalledPWA && showInstallMenu && (
        <>
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close installation guide"
            onClick={closeInstallMenu}
            className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-[2px]"
          />

          {/* INSTALL MENU */}

          <div
            className="
                fixed
                inset-x-4
                top-1/2
                z-[160]
                max-h-[85vh]
                -translate-y-1/2
                overflow-y-auto
                rounded-2xl
                border
                border-slate-700
                bg-slate-900
                shadow-2xl
                shadow-slate-950/70
                sm:left-1/2
                sm:right-auto
                sm:w-[440px]
                sm:-translate-x-1/2
              "
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-app-title"
          >
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/98 px-4 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Download className="h-5 w-5" />
                </div>

                <div>
                  <h2
                    id="install-app-title"
                    className="text-base font-bold text-white"
                  >
                    Install LotteryPlay
                  </h2>

                  <p className="text-xs text-slate-400">
                    Install the app on your device
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInstallMenu}
                aria-label="Close installation guide"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {/* =================================================
                    ANDROID
                ================================================= */}

              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                    <Smartphone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white">Android</h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Recommended: Google Chrome
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* NATIVE INSTALL */}

                  {deferredInstallPrompt ? (
                    <button
                      type="button"
                      onClick={installPWA}
                      disabled={isInstalling}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />

                      {isInstalling ? "Installing..." : "Install App"}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                      <p className="text-xs font-semibold text-slate-300">
                        If the Install button is not shown:
                      </p>

                      <ol className="mt-2 space-y-2 text-xs leading-5 text-slate-400">
                        <li>
                          <span className="font-semibold text-slate-300">
                            1.
                          </span>{" "}
                          Open this website in Chrome.
                        </li>

                        <li>
                          <span className="font-semibold text-slate-300">
                            2.
                          </span>{" "}
                          Tap the{" "}
                          <span className="font-semibold text-white">⋮</span>{" "}
                          menu.
                        </li>

                        <li>
                          <span className="font-semibold text-slate-300">
                            3.
                          </span>{" "}
                          Select{" "}
                          <span className="font-semibold text-indigo-300">
                            Install app
                          </span>{" "}
                          or{" "}
                          <span className="font-semibold text-indigo-300">
                            Add to Home screen
                          </span>
                          .
                        </li>

                        <li>
                          <span className="font-semibold text-slate-300">
                            4.
                          </span>{" "}
                          Confirm the installation.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                    IOS
                ================================================= */}

              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-slate-200">
                    <Apple className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white">iPhone / iPad</h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Add LotteryPlay to your Home Screen
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <ol className="space-y-3 text-xs leading-5 text-slate-400">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-300">
                        1
                      </span>

                      <span>
                        Open LotteryPlay in{" "}
                        <span className="font-semibold text-white">Safari</span>
                        .
                      </span>
                    </li>

                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-300">
                        2
                      </span>

                      <span>
                        Tap the{" "}
                        <span className="font-semibold text-white">Share</span>{" "}
                        button in Safari.
                      </span>
                    </li>

                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-300">
                        3
                      </span>

                      <span>
                        Scroll down and select{" "}
                        <span className="font-semibold text-white">
                          Add to Home Screen
                        </span>
                        .
                      </span>
                    </li>

                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-300">
                        4
                      </span>

                      <span>
                        Tap{" "}
                        <span className="font-semibold text-white">Add</span> to
                        confirm.
                      </span>
                    </li>
                  </ol>
                </div>

                {iosDevice && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />

                    <p className="text-xs leading-5 text-indigo-200">
                      You appear to be using an Apple device. For the best PWA
                      installation experience, use Safari.
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                    WHAT HAPPENS AFTER INSTALL
                ================================================= */}

              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  After installation
                </p>

                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-300">
                      Android:
                    </span>{" "}
                    LotteryPlay opens as an installed app without normal browser
                    controls.
                  </p>

                  <p>
                    <span className="font-semibold text-slate-300">
                      iPhone / iPad:
                    </span>{" "}
                    open LotteryPlay from your Home Screen after adding it.
                  </p>

                  <p>
                    The mobile bottom navigation will then automatically be used
                    inside the installed PWA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          MOBILE BROWSER HAMBURGER SIDEBAR
      ======================================================= */}

      {!isInstalledPWA && mobileSidebarOpen && (
        <>
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          />

          {/* SIDEBAR */}

          <aside
            className="fixed inset-y-0 left-0 z-[100] flex w-[min(84vw,320px)] flex-col border-r border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/60 lg:hidden"
            aria-label="Mobile navigation"
          >
            {/* SIDEBAR HEADER */}

            <div className="pwa-header-safe flex min-h-[64px] shrink-0 items-center justify-between border-b border-slate-700/80 px-4 sm:min-h-[72px] sm:px-6">
              <Link
                to="/"
                onClick={handleMobileSidebarNavigation}
                className="flex min-w-0 items-center gap-2.5"
                aria-label="LotteryPlay Home"
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="block h-7 w-7 shrink-0 rounded-lg object-contain"
                />

                <div className="flex min-w-0 items-center">
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    AB
                  </span>

                  <span className="text-lg font-extrabold tracking-tight text-indigo-400">
                    CD
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SIDEBAR CONTENT */}

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {/* HOME */}

                <Link
                  to="/"
                  onClick={handleMobileSidebarNavigation}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    isActive("/")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Home className="h-5 w-5 shrink-0" />

                  <span>Home</span>
                </Link>

                {/* PLAY */}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobilePlayOpen((current) => !current);

                      setMobileMoreOpen(false);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={mobilePlayOpen}
                    className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isPlayActive || mobilePlayOpen
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Dice5 className="h-5 w-5 shrink-0" />

                      <span>Play</span>
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        mobilePlayOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobilePlayOpen && (
                    <div className="mt-1 space-y-1 pl-3">
                      {playNavigation.map((item, index) => {
                        const Icon = item.icon;

                        const is2D = index === 0;

                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => handlePlay(item.path)}
                            className={playItemClass(
                              location.pathname === item.path,
                              is2D,
                            )}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                is2D
                                  ? "bg-indigo-500/15 text-indigo-400"
                                  : "bg-violet-500/15 text-violet-400"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">
                                {item.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RESULTS HISTORY */}

                <Link
                  to="/results-history"
                  onClick={handleMobileSidebarNavigation}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    isActive("/results-history")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-5 w-5 shrink-0" />

                  <span>Results History</span>
                </Link>

                {/* ABOUT */}

                <Link
                  to="/about"
                  onClick={handleMobileSidebarNavigation}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    isActive("/about")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Info className="h-5 w-5 shrink-0" />

                  <span>About</span>
                </Link>

                {/* =================================================
                      INSTALL APP
                  ================================================= */}

                {!isInstalledPWA && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={openInstallMenu}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Download className="h-5 w-5" />
                      </span>

                      <span>Install App</span>
                    </button>
                  </div>
                )}
              </div>

              {/* AUTH */}

              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Account
                </p>

                <div className="space-y-1">
                  {/* LOGIN */}

                  <Link
                    to="/login"
                    onClick={handleMobileSidebarNavigation}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive("/login")
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                      <LogIn size={17} />
                    </span>

                    <span>Login</span>
                  </Link>

                  {/* REGISTER */}

                  <Link
                    to="/register"
                    onClick={handleMobileSidebarNavigation}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive("/register")
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                      <UserPlus size={17} />
                    </span>

                    <span>Register</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* SIDEBAR FOOTER */}

            <div className="shrink-0 border-t border-slate-800 px-4 py-4 text-center text-[11px] text-slate-500">
              LotteryPlay
            </div>
          </aside>
        </>
      )}

      {/* ======================================================
          MOBILE / PWA PLAY POPUP
      ======================================================= */}

      {isInstalledPWA && mobilePlayOpen && (
        <div className="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[80] lg:hidden">
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
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handlePlay(item.path)}
                    className={`flex flex-col items-center justify-center rounded-xl border px-3 py-4 text-center transition-all ${
                      location.pathname === item.path
                        ? is2D
                          ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                          : "border-violet-500/40 bg-violet-500/20 text-violet-300"
                        : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                    }`}
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MOBILE / PWA MORE POPUP
      ======================================================= */}

      {isInstalledPWA && mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[80] lg:hidden">
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
              {/* LOGIN */}

              <Link
                to="/login"
                onClick={handleMobileNavigation}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive("/login")
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <LogIn size={17} />
                </span>

                <span>Login</span>
              </Link>

              {/* REGISTER */}

              <Link
                to="/register"
                onClick={handleMobileNavigation}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive("/register")
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <UserPlus size={17} />
                </span>

                <span>Register</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MOBILE / PWA BOTTOM NAVIGATION
      ======================================================= */}

      {isInstalledPWA && (
        <nav
          className="
            fixed
            inset-x-0
            bottom-0
            z-[75]
            border-t
            border-slate-700/80
            bg-slate-900/97
            shadow-[0_-8px_30px_rgba(15,23,42,0.25)]
            backdrop-blur-xl
            lg:hidden
          "
        >
          <div
            className="
              pwa-bottom-safe
              mx-auto
              max-w-md
              px-1
            "
          >
            <div className="grid h-[68px] grid-cols-5">
              {/* HOME */}

              <Link
                to="/"
                onClick={handleMobileNavigation}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive("/")
                    ? "text-indigo-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                    isActive("/") ? "bg-indigo-500/15" : "bg-transparent"
                  }`}
                >
                  <Home
                    className="h-[19px] w-[19px]"
                    strokeWidth={isActive("/") ? 2.5 : 2}
                  />
                </div>

                <span className="text-[10px] font-semibold">Home</span>

                {isActive("/") && (
                  <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
                )}
              </Link>

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

              {/* RESULTS */}

              <Link
                to="/results-history"
                onClick={handleMobileNavigation}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive("/results-history")
                    ? "text-indigo-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                    isActive("/results-history")
                      ? "bg-indigo-500/15"
                      : "bg-transparent"
                  }`}
                >
                  <BarChart3
                    className="h-[19px] w-[19px]"
                    strokeWidth={isActive("/results-history") ? 2.5 : 2}
                  />
                </div>

                <span className="text-[10px] font-semibold">Results</span>

                {isActive("/results-history") && (
                  <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
                )}
              </Link>

              {/* ABOUT */}

              <Link
                to="/about"
                onClick={handleMobileNavigation}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive("/about")
                    ? "text-indigo-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                    isActive("/about") ? "bg-indigo-500/15" : "bg-transparent"
                  }`}
                >
                  <Info
                    className="h-[19px] w-[19px]"
                    strokeWidth={isActive("/about") ? 2.5 : 2}
                  />
                </div>

                <span className="text-[10px] font-semibold">About</span>

                {isActive("/about") && (
                  <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-indigo-400" />
                )}
              </Link>

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
          </div>
        </nav>
      )}

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main
        className={`
          mx-auto
          min-h-[calc(100vh-4rem)]
          max-w-7xl
          px-4
          py-6
          sm:px-6
          lg:min-h-[calc(100vh-4.5rem)]
          lg:px-8
          lg:py-8
          ${
            isInstalledPWA
              ? "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8"
              : "pb-8"
          }
        `}
      >
        <Outlet />
      </main>

      {/* ======================================================
          FOOTER
      ======================================================= */}

      <footer className="bg-slate-950 text-slate-400 sm:mt-16">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {/* ABOUT */}

            <div>
              <Link
                to="/"
                onClick={closeAllMenus}
                className="mb-4 inline-flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Ticket className="h-4 w-4" />
                </div>

                <div>
                  <span className="font-extrabold text-white">AB</span>

                  <span className="font-extrabold text-indigo-400">CD</span>
                </div>
              </Link>

              <p className="max-w-md text-sm leading-6 text-slate-400">
                Welcome to our 2D and 3D Lottery Management System. Check the
                latest results, explore result history, and manage your lottery
                account with ease.
              </p>
            </div>

            {/* QUICK LINKS */}

            <div>
              <h3 className="mb-4 font-bold text-white">Quick Links</h3>

              <div className="space-y-3 text-sm">
                <Link
                  to="/"
                  onClick={handleMobileNavigation}
                  className="block transition-colors hover:text-indigo-400"
                >
                  Home
                </Link>

                <Link
                  to="/results-history"
                  onClick={handleMobileNavigation}
                  className="block transition-colors hover:text-indigo-400"
                >
                  Results History
                </Link>

                <Link
                  to="/about"
                  onClick={handleMobileNavigation}
                  className="block transition-colors hover:text-indigo-400"
                >
                  About
                </Link>

                <Link
                  to="/login"
                  onClick={handleMobileNavigation}
                  className="block transition-colors hover:text-indigo-400"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={handleMobileNavigation}
                  className="block transition-colors hover:text-indigo-400"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* CONTACT */}

            <div>
              <h3 className="mb-4 font-bold text-white">Contact</h3>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-slate-500">Phone:</span> 09 123456789
                </p>

                <p>
                  <span className="text-slate-500">Email:</span>{" "}
                  admin@lottery.com
                </p>

                <p>
                  <span className="text-slate-500">Location:</span> Yangon,
                  Myanmar
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER BOTTOM */}

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-5 text-center text-sm text-slate-500 md:mt-10 md:flex-row md:items-center md:justify-between md:pt-6 md:text-left">
            <p>
              © {new Date().getFullYear()} LotteryPlay. All rights reserved.
            </p>

            <div className="flex items-center justify-center gap-1 text-xs">
              <span>Powered by</span>

              <span className="font-semibold text-indigo-400">LotteryPlay</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
   BEFORE INSTALL PROMPT TYPE
============================================================ */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;

  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}
