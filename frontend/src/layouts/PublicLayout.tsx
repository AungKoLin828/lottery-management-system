// src/layouts/PublicLayout.tsx

import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

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

type NavItemProps = {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
};

function NavItem({ to, label, icon, active, onClick }: NavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
      }`}
    >
      {/* Icon */}
      <span
        className={`transition-all duration-200 ${
          active
            ? "text-indigo-600"
            : "text-slate-400 group-hover:scale-110 group-hover:text-indigo-600"
        }`}
      >
        {icon}
      </span>

      {/* Label */}
      <span>{label}</span>

      {/* Active indicator */}
      {active && (
        <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
      )}
    </Link>
  );
}

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playMenuOpen, setPlayMenuOpen] = useState(false);

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
     CLOSE MENUS
  ============================================================ */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setPlayMenuOpen(false);
  };

  /* ============================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ============================================================ */

  useEffect(() => {
    setMobileMenuOpen(false);
    setPlayMenuOpen(false);
  }, [location.pathname]);

  /* ============================================================
     CLOSE PLAY DROPDOWN WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playMenuRef.current &&
        !playMenuRef.current.contains(event.target as Node)
      ) {
        setPlayMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ============================================================
     PLAY LOGIN REDIRECT
  ============================================================ */

  const handlePlay = (destination: string) => {
    navigate("/login", {
      state: {
        from: destination,
      },
    });

    closeMobileMenu();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            {/* ==================================================
                LOGO
            ================================================== */}

            <Link
              to="/"
              onClick={closeMobileMenu}
              className="group flex items-center gap-2.5"
            >
              {/* Logo Icon */}

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 transition-transform duration-200 group-hover:scale-105">
                <Ticket className="h-5 w-5" />
              </div>

              {/* Logo Text */}

              <div className="flex items-center">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  Lottery
                </span>

                <span className="text-lg font-extrabold tracking-tight text-indigo-600">
                  Play
                </span>
              </div>
            </Link>

            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <nav className="hidden items-center rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm md:flex">
              {/* Home */}

              <NavItem
                to="/"
                label="Home"
                active={isActive("/")}
                icon={<Home className="h-4 w-4" />}
              />

              {/* ==================================================
                  PLAY DROPDOWN
              ================================================== */}

              <div ref={playMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPlayMenuOpen((current) => !current)}
                  className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isPlayActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  <span
                    className={`transition-all duration-200 ${
                      isPlayActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-600"
                    }`}
                  >
                    <Dice5 className="h-4 w-4" />
                  </span>

                  <span>Play</span>

                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      playMenuOpen ? "rotate-180" : ""
                    }`}
                  />

                  {isPlayActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-white/80" />
                  )}
                </button>

                {/* ==================================================
                    PLAY DROPDOWN
                ================================================== */}

                {playMenuOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/30">
                    {/* Dropdown Header */}

                    <div className="px-3 pb-2 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Choose Game
                      </p>
                    </div>

                    {/* 2D */}

                    <button
                      type="button"
                      onClick={() => handlePlay("/player/play-2d")}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-indigo-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        <Dice5 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
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
                      onClick={() => handlePlay("/player/play-3d")}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-violet-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                        <Boxes className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700">
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
            ================================================== */}

            <div className="hidden items-center gap-2 md:flex">
              {/* Login */}

              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
              >
                Login
              </Link>

              {/* Register */}

              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-200"
              >
                <Sparkles className="h-4 w-4" />
                Register
              </Link>
            </div>

            {/* ==================================================
                MOBILE MENU BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 md:hidden ${
                mobileMenuOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* ==================================================
              MOBILE NAVIGATION
          ================================================== */}

          <div
            className={`overflow-hidden transition-all duration-300 md:hidden ${
              mobileMenuOpen
                ? "max-h-[700px] pb-4 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <nav className="space-y-1">
                {/* Home */}

                <NavItem
                  to="/"
                  label="Home"
                  active={isActive("/")}
                  onClick={closeMobileMenu}
                  icon={<Home className="h-5 w-5" />}
                />

                {/* ==================================================
                    MOBILE PLAY
                ================================================== */}

                <div className="rounded-xl bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPlayMenuOpen((current) => !current)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isPlayActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Dice5 className="h-5 w-5" />
                      Play
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        playMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {playMenuOpen && (
                    <div className="mt-1 space-y-1 border-t border-slate-100 pt-1">
                      {/* 2D */}

                      <button
                        type="button"
                        onClick={() => handlePlay("/player/play-2d")}
                        className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Dice5 size={18} />
                        </div>

                        <div>
                          <p>2D Play</p>

                          <p className="text-xs font-normal text-slate-400">
                            Play 2D Lottery
                          </p>
                        </div>
                      </button>

                      {/* 3D */}

                      <button
                        type="button"
                        onClick={() => handlePlay("/player/play-3d")}
                        className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-all hover:bg-violet-50 hover:text-violet-600"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <Boxes size={18} />
                        </div>

                        <div>
                          <p>3D Play</p>

                          <p className="text-xs font-normal text-slate-400">
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
                  onClick={closeMobileMenu}
                  icon={<BarChart3 className="h-5 w-5" />}
                />

                {/* About */}

                <NavItem
                  to="/about"
                  label="About"
                  active={isActive("/about")}
                  onClick={closeMobileMenu}
                  icon={<Info className="h-5 w-5" />}
                />
              </nav>

              {/* ==================================================
                  MOBILE AUTH
              ================================================== */}

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                {/* Login */}

                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Login
                </Link>

                {/* Register */}

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700"
                >
                  <Sparkles className="h-4 w-4" />
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

      <main className="min-h-[calc(100vh-4.5rem)]">
        <Outlet />
      </main>

      {/* ========================================================
          FOOTER
      ========================================================= */}

      <footer className="mt-16 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* ==================================================
                ABOUT
            ================================================== */}

            <div>
              {/* Logo */}

              <Link to="/" className="mb-4 inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Ticket className="h-4 w-4" />
                </div>

                <div>
                  <span className="font-extrabold text-white">Lottery</span>

                  <span className="font-extrabold text-indigo-400">Play</span>
                </div>
              </Link>

              <p className="max-w-md text-sm leading-6 text-slate-400">
                Welcome to our 2D and 3D Lottery Management System. Check the
                latest results, explore result history, and manage your lottery
                account with ease.
              </p>
            </div>

            {/* ==================================================
                QUICK LINKS
            ================================================== */}

            <div>
              <h3 className="mb-4 font-bold text-white">Quick Links</h3>

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

            {/* ==================================================
                CONTACT
            ================================================== */}

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

          {/* ==================================================
              FOOTER BOTTOM
          ================================================== */}

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-center text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:text-left">
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
