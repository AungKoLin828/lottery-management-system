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
  LogIn,
  UserPlus,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import PWAInstallButton from "@/components/PWAInstallButton";

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
   COMPONENT
============================================================ */

export default function PublicLayout() {
  const location = useLocation();

  /* ============================================================
     PWA STATE
     
     IMPORTANT:
     
     Browser:
       isInstalledPWA = false
       => NO bottom navigation
     
     Installed PWA / Add to Home Screen:
       isInstalledPWA = true
       => MOBILE PWA bottom navigation is displayed
     
     Supported:
       - Android Chrome / Edge standalone
       - iOS Safari navigator.standalone
       - fullscreen
       - minimal-ui
  ============================================================ */

  const [isInstalledPWA, setIsInstalledPWA] = useState(false);

  /* ============================================================
     MOBILE / PWA MENU STATE
  ============================================================ */

  const [mobilePlayOpen, setMobilePlayOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  /* ============================================================
     DESKTOP DROPDOWN STATE
  ============================================================ */

  const [desktopPlayOpen, setDesktopPlayOpen] = useState(false);

  /* ============================================================
     REFS
  ============================================================ */

  const playMenuRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     DETECT INSTALLED PWA
     
     Browser:
       false
     
     Installed PWA:
       true
     
     iOS:
       navigator.standalone
  ============================================================ */

  useEffect(() => {
    const checkPWAInstalled = () => {
      const standaloneMedia = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;

      const fullscreenMedia = window.matchMedia(
        "(display-mode: fullscreen)",
      ).matches;

      const minimalUiMedia = window.matchMedia(
        "(display-mode: minimal-ui)",
      ).matches;

      const iosStandalone =
        "standalone" in window.navigator &&
        Boolean(
          (
            window.navigator as Navigator & {
              standalone?: boolean;
            }
          ).standalone,
        );

      const installed =
        standaloneMedia || fullscreenMedia || minimalUiMedia || iosStandalone;

      setIsInstalledPWA(installed);
    };

    /* Initial check */
    checkPWAInstalled();

    /* Media queries */
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");

    const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");

    const minimalUiMedia = window.matchMedia("(display-mode: minimal-ui)");

    standaloneMedia.addEventListener("change", checkPWAInstalled);
    fullscreenMedia.addEventListener("change", checkPWAInstalled);
    minimalUiMedia.addEventListener("change", checkPWAInstalled);

    /* Re-check when window becomes visible */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPWAInstalled();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    /* Re-check when window regains focus */
    window.addEventListener("focus", checkPWAInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", checkPWAInstalled);

      fullscreenMedia.removeEventListener("change", checkPWAInstalled);

      minimalUiMedia.removeEventListener("change", checkPWAInstalled);

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

  const isPlayActive =
    location.pathname === "/player/play-2d" ||
    location.pathname === "/player/play-3d";

  /* ============================================================
     IS MORE ACTIVE
  ============================================================ */

  const isMoreActive =
    location.pathname === "/login" || location.pathname === "/register";

  /* ============================================================
     CLOSE ALL MENUS
  ============================================================ */

  const closeAllMenus = () => {
    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
    setDesktopPlayOpen(false);
  };

  /* ============================================================
     MOBILE NAVIGATION
     
     This is still used by PWA bottom navigation and
     footer links.
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

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  /* ============================================================
     MOBILE / PWA PLAY
     
     Only works when the application is running
     as an installed PWA.
  ============================================================ */

  const toggleMobilePlay = () => {
    if (!isInstalledPWA) {
      return;
    }

    setMobilePlayOpen((current) => !current);

    setMobileMoreOpen(false);
    setDesktopPlayOpen(false);
  };

  /* ============================================================
     MOBILE / PWA MORE
     
     Only works when the application is running
     as an installed PWA.
  ============================================================ */

  const toggleMobileMore = () => {
    if (!isInstalledPWA) {
      return;
    }

    setMobileMoreOpen((current) => !current);

    setMobilePlayOpen(false);
    setDesktopPlayOpen(false);
  };

  /* ============================================================
     DESKTOP PLAY
  ============================================================ */

  const toggleDesktopPlay = () => {
    setDesktopPlayOpen((current) => !current);

    setMobilePlayOpen(false);
    setMobileMoreOpen(false);
  };

  /* ============================================================
     PLAY LOGIN REDIRECT
  ============================================================ */

  const handlePlay = (destination: string) => {
    closeAllMenus();

    /*
     * Use normal browser navigation instead of useNavigate.
     *
     * This preserves the existing login redirect behavior
     * without requiring useNavigate in this layout.
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
          HEADER
          
          IMPORTANT:
          
          Desktop browser:
            Desktop navigation is unchanged.
          
          Mobile browser:
            Desktop navigation remains hidden as before.
            Existing mobile header remains.
          
          Installed PWA:
            Existing mobile header remains and PWA
            bottom navigation is displayed separately.
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] items-center justify-between gap-3 px-3 sm:h-[72px] sm:px-6 lg:max-w-7xl lg:px-8">
          {/* ==================================================
              LOGO
          =================================================== */}

          <Link
            to="/"
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
          </Link>

          {/* ==================================================
              DESKTOP NAVIGATION
              
              UNCHANGED
              
              It remains the normal desktop navigation and
              is not replaced by PWA navigation.
          =================================================== */}

          <nav className="hidden min-w-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 lg:flex">
            {/* HOME */}

            <Link
              to="/"
              onClick={closeAllMenus}
              className={navClass(isActive("/"))}
            >
              <Home size={17} />
              Home
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
              Results History
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
              About
              {isActive("/about") && (
                <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
              )}
            </Link>
          </nav>

          {/* ==================================================
              DESKTOP AUTH
          =================================================== */}

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
              
              IMPORTANT:
              
              This remains visible in the normal mobile
              browser exactly as before.
              
              The bottom PWA navigation is completely
              independent from this header.
          =================================================== */}

          <div className="flex items-center lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300">
              <Ticket className="h-[18px] w-[18px]" />
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MOBILE PLAY POPUP
          
          ONLY DISPLAY IN INSTALLED PWA
      ======================================================= */}

      {isInstalledPWA && mobilePlayOpen && (
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
          MOBILE MORE POPUP
          
          ONLY DISPLAY IN INSTALLED PWA
      ======================================================= */}

      {isInstalledPWA && mobileMoreOpen && (
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
          
          IMPORTANT:
          
          NORMAL MOBILE BROWSER:
            isInstalledPWA = false
            => THIS NAVIGATION DOES NOT EXIST
          
          INSTALLED PWA:
            isInstalledPWA = true
            => NAVIGATION IS DISPLAYED
          
          DESKTOP:
            lg:hidden
            => NAVIGATION IS NOT DISPLAYED
      ======================================================= */}

      {isInstalledPWA && (
        <nav className="fixed inset-x-0 bottom-0 z-[75] border-t border-slate-700/80 bg-slate-900/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid h-[68px] max-w-md grid-cols-5 px-1">
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
        </nav>
      )}

      {/* ======================================================
          MAIN CONTENT
          
          Browser:
            Normal bottom spacing.
          
          Installed PWA:
            Extra bottom spacing on mobile so the PWA
            bottom navigation does not cover content.
      ======================================================= */}

      <main
        className={`mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8 lg:py-8 ${
          isInstalledPWA ? "pb-28 lg:pb-8" : "pb-8"
        }`}
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

      {/* ======================================================
          PWA INSTALL BUTTON
          
          Remains available in browser mode.
          
          After installation / Add to Home Screen, the
          application detects standalone mode and the
          bottom PWA navigation becomes available.
      ======================================================= */}

      <PWAInstallButton />
    </div>
  );
}
