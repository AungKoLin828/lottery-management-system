import { useEffect, useRef, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  X,
  Home,
  BarChart3,
  Info,
  Dice5,
  Boxes,
  ChevronDown,
  Sparkles,
  Ticket,
} from "lucide-react";

/* ============================================================
   NAV ITEM
============================================================ */

type NavItemProps = {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  mobile?: boolean;
};

function NavItem({
  to,
  label,
  icon,
  active,
  onClick,
  mobile = false,
}: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center ${
        mobile
          ? "gap-2.5 rounded-lg px-3 py-2.5 text-[13px]"
          : "gap-2 rounded-xl px-3.5 py-2.5 text-sm"
      } font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30"
          : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
      }`}
    >
      {/* Icon */}

      <span
        className={`shrink-0 transition-all duration-200 ${
          active
            ? "text-white"
            : "text-slate-400 group-hover:scale-105 group-hover:text-indigo-300"
        }`}
      >
        {icon}
      </span>

      {/* Label */}

      <span>{label}</span>

      {/* Active Indicator */}

      {active && !mobile && (
        <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
      )}
    </Link>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // Desktop dropdown
  const [desktopPlayOpen, setDesktopPlayOpen] =
    useState(false);

  // Mobile dropdown
  const [mobilePlayOpen, setMobilePlayOpen] =
    useState(false);

  const playMenuRef = useRef<HTMLDivElement>(null);

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
     CLOSE MOBILE MENU
  ============================================================ */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobilePlayOpen(false);
  };

  /* ============================================================
     CLOSE ALL MENUS WHEN ROUTE CHANGES
  ============================================================ */

  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopPlayOpen(false);
    setMobilePlayOpen(false);
  }, [location.pathname]);

  /* ============================================================
     CLOSE DESKTOP DROPDOWN WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        playMenuRef.current &&
        !playMenuRef.current.contains(target)
      ) {
        setDesktopPlayOpen(false);
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
     PLAY LOGIN REDIRECT
  ============================================================ */

  const handlePlay = (destination: string) => {
    setDesktopPlayOpen(false);
    setMobilePlayOpen(false);
    setMobileMenuOpen(false);

    navigate("/login", {
      state: {
        from: destination,
      },
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
  };

  /* ============================================================
     TOGGLE MOBILE PLAY
  ============================================================ */

  const toggleMobilePlay = () => {
    setMobilePlayOpen((current) => !current);
  };

  /* ============================================================
     TOGGLE DESKTOP PLAY
  ============================================================ */

  const toggleDesktopPlay = () => {
    setDesktopPlayOpen((current) => !current);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-[64px] items-center justify-between sm:h-[72px]">
            {/* ==================================================
                LOGO
            =================================================== */}

            <Link
              to="/"
              onClick={closeMobileMenu}
              className="group flex shrink-0 items-center gap-2"
            >
              {/* Logo Icon */}

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30 transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9 sm:rounded-xl">
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              {/* Logo Text */}

              <div className="flex items-center">
                <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  Lottery
                </span>

                <span className="text-base font-extrabold tracking-tight text-indigo-400 sm:text-lg">
                  Play
                </span>
              </div>
            </Link>

            {/* ==================================================
                DESKTOP NAVIGATION
            =================================================== */}

            <nav className="hidden items-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20 md:flex">
              {/* Home */}

              <NavItem
                to="/"
                label="Home"
                active={isActive("/")}
                icon={<Home className="h-4 w-4" />}
              />

              {/* =================================================
                  DESKTOP PLAY DROPDOWN
              ================================================= */}

              <div
                ref={playMenuRef}
                className="relative"
              >
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
                    className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                      isPlayActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-300"
                    }`}
                  />

                  <span>Play</span>

                  {/* Arrow */}

                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                      desktopPlayOpen
                        ? "rotate-180"
                        : "rotate-0"
                    }`}
                  />

                  {isPlayActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                  )}
                </button>

                {/* =================================================
                    DESKTOP PLAY DROPDOWN
                ================================================= */}

                {desktopPlayOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-2 shadow-xl shadow-slate-950/40"
                    role="menu"
                  >
                    {/* Header */}

                    <div className="px-3 pb-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Choose Game
                        </p>
                      </div>
                    </div>

                    {/* 2D */}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        handlePlay("/player/play-2d")
                      }
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-indigo-500/15"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 transition-colors group-hover:bg-indigo-500/25">
                        <Dice5 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-300">
                          2D Play
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Play 2D Lottery
                        </p>
                      </div>
                    </button>

                    {/* 3D */}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        handlePlay("/player/play-3d")
                      }
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-violet-500/15"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 transition-colors group-hover:bg-violet-500/25">
                        <Boxes className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-violet-300">
                          3D Play
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Play 3D Lottery
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Results History */}

              <NavItem
                to="/results-history"
                label="Results History"
                active={isActive("/results-history")}
                icon={<BarChart3 className="h-4 w-4" />}
              />

              {/* About */}

              <NavItem
                to="/about"
                label="About"
                active={isActive("/about")}
                icon={<Info className="h-4 w-4" />}
              />
            </nav>

            {/* ==================================================
                DESKTOP AUTH
            =================================================== */}

            <div className="hidden items-center gap-2 md:flex">
              {/* Login */}

              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:bg-indigo-500/15 hover:text-white"
              >
                Login
              </Link>

              {/* Register */}

              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-900/40"
              >
                <Sparkles className="h-4 w-4" />
                Register
              </Link>
            </div>

            {/* ==================================================
                MOBILE MENU BUTTON
            =================================================== */}

            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 md:hidden ${
                mobileMenuOpen
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-indigo-500/20 hover:text-white"
              }`}
              aria-label={
                mobileMenuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Menu className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          {/* ====================================================
              MOBILE NAVIGATION
          ===================================================== */}

          <div
            className={`overflow-hidden transition-all duration-300 md:hidden ${
              mobileMenuOpen
                ? "max-h-[600px] pb-3 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-1.5 shadow-lg shadow-slate-950/20">
              <nav className="space-y-0.5">
                {/* =================================================
                    HOME
                ================================================= */}

                <NavItem
                  to="/"
                  label="Home"
                  active={isActive("/")}
                  onClick={closeMobileMenu}
                  mobile
                  icon={
                    <Home className="h-[17px] w-[17px]" />
                  }
                />

                {/* =================================================
                    MOBILE PLAY
                ================================================= */}

                <div className="rounded-lg bg-slate-900/80 p-1">
                  {/* Play Toggle */}

                  <button
                    type="button"
                    onClick={toggleMobilePlay}
                    aria-haspopup="menu"
                    aria-expanded={mobilePlayOpen}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      isPlayActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-indigo-500/15 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Dice5 className="h-[17px] w-[17px]" />

                      <span>Play</span>
                    </span>

                    {/* IMPORTANT:
                        Arrow rotates independently */}

                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        mobilePlayOpen
                          ? "rotate-180"
                          : "rotate-0"
                      }`}
                    />
                  </button>

                  {/* =================================================
                      MOBILE PLAY OPTIONS
                  ================================================= */}

                  {mobilePlayOpen && (
                    <div
                      className="mt-1 space-y-0.5 border-t border-slate-700 pt-1"
                      role="menu"
                    >
                      {/* 2D */}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          handlePlay(
                            "/player/play-2d"
                          )
                        }
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-indigo-500/15"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                          <Dice5 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-200 group-hover:text-indigo-300">
                            2D Play
                          </p>

                          <p className="text-[10px] text-slate-500">
                            Play 2D Lottery
                          </p>
                        </div>
                      </button>

                      {/* 3D */}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          handlePlay(
                            "/player/play-3d"
                          )
                        }
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-violet-500/15"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                          <Boxes className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-200 group-hover:text-violet-300">
                            3D Play
                          </p>

                          <p className="text-[10px] text-slate-500">
                            Play 3D Lottery
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* =================================================
                    RESULTS HISTORY
                ================================================= */}

                <NavItem
                  to="/results-history"
                  label="Results History"
                  active={isActive(
                    "/results-history"
                  )}
                  onClick={closeMobileMenu}
                  mobile
                  icon={
                    <BarChart3 className="h-[17px] w-[17px]" />
                  }
                />

                {/* =================================================
                    ABOUT
                ================================================= */}

                <NavItem
                  to="/about"
                  label="About"
                  active={isActive("/about")}
                  onClick={closeMobileMenu}
                  mobile
                  icon={
                    <Info className="h-[17px] w-[17px]" />
                  }
                />
              </nav>

              {/* ==================================================
                  MOBILE AUTH
              ================================================== */}

              <div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-slate-700 pt-2">
                {/* Login */}

                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-[13px] font-semibold text-slate-300 transition-all hover:border-indigo-500 hover:bg-indigo-500/15 hover:text-indigo-300"
                >
                  Login
                </Link>

                {/* Register */}

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />

                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          PAGE CONTENT
      ========================================================= */}

      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* ========================================================
          FOOTER
      ========================================================= */}

      <footer className="mt-12 bg-slate-950 text-slate-400 sm:mt-16">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {/* ABOUT */}

            <div>
              <Link
                to="/"
                className="mb-4 inline-flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Ticket className="h-4 w-4" />
                </div>

                <div>
                  <span className="font-extrabold text-white">
                    Lottery
                  </span>

                  <span className="font-extrabold text-indigo-400">
                    Play
                  </span>
                </div>
              </Link>

              <p className="max-w-md text-sm leading-6 text-slate-400">
                Welcome to our 2D and 3D Lottery Management
                System. Check the latest results, explore result
                history, and manage your lottery account with
                ease.
              </p>
            </div>

            {/* QUICK LINKS */}

            <div>
              <h3 className="mb-4 font-bold text-white">
                Quick Links
              </h3>

              <div className="space-y-3 text-sm">
                <Link
                  to="/"
                  className="block transition-colors hover:text-indigo-400"
                >
                  Home
                </Link>

                <Link
                  to="/results-history"
                  className="block transition-colors hover:text-indigo-400"
                >
                  Results History
                </Link>

                <Link
                  to="/about"
                  className="block transition-colors hover:text-indigo-400"
                >
                  About
                </Link>

                <Link
                  to="/login"
                  className="block transition-colors hover:text-indigo-400"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* CONTACT */}

            <div>
              <h3 className="mb-4 font-bold text-white">
                Contact
              </h3>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-slate-500">
                    Phone:
                  </span>{" "}
                  09 123456789
                </p>

                <p>
                  <span className="text-slate-500">
                    Email:
                  </span>{" "}
                  admin@lottery.com
                </p>

                <p>
                  <span className="text-slate-500">
                    Location:
                  </span>{" "}
                  Yangon, Myanmar
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER BOTTOM */}

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-5 text-center text-sm text-slate-500 md:mt-10 md:flex-row md:items-center md:justify-between md:pt-6 md:text-left">
            <p>
              © {new Date().getFullYear()} LotteryPlay. All
              rights reserved.
            </p>

            <div className="flex items-center justify-center gap-1 text-xs">
              <span>Powered by</span>

              <span className="font-semibold text-indigo-400">
                LotteryPlay
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}