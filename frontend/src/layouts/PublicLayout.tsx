// src/layouts/PublicLayout.tsx

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Home, BarChart3, MessageCircle } from "lucide-react";

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
          ? "bg-blue-100 text-blue-700 shadow-sm"
          : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {/* Icon */}
      <span
        className={`transition-all duration-200 ${
          active
            ? "text-blue-600"
            : "text-gray-400 group-hover:scale-110 group-hover:text-blue-600"
        }`}
      >
        {icon}
      </span>

      {/* Label */}
      <span>{label}</span>

      {/* Active Indicator */}
      {active && (
        <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-blue-600" />
      )}
    </Link>
  );
}

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between">
            {/* =================================================
                LOGO
            ================================================== */}
            <Link
              to="/"
              className="flex items-center gap-1"
              onClick={closeMobileMenu}
            >
              <div className="leading-none">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Lottery
                </span>

                <span className="text-lg font-bold tracking-tight text-indigo-600">
                  Play
                </span>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================== */}
            <nav className="hidden items-center rounded-xl border border-gray-100 bg-gray-50/70 p-1 md:flex">
              <NavItem
                to="/"
                label="Home"
                active={isActive("/")}
                icon={<Home className="h-4 w-4" />}
              />

              <NavItem
                to="/results-history"
                label="Results History"
                active={isActive("/results-history")}
                icon={<BarChart3 className="h-4 w-4" />}
              />

              <NavItem
                to="/contact"
                label="Contact"
                active={isActive("/contact")}
                icon={<MessageCircle className="h-4 w-4" />}
              />
            </nav>

            {/* =================================================
                DESKTOP AUTH
            ================================================== */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
              >
                Register
              </Link>
            </div>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================== */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 md:hidden ${
                mobileMenuOpen
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
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

          {/* =================================================
              MOBILE NAVIGATION
          ================================================== */}
          <div
            className={`overflow-hidden transition-all duration-300 md:hidden ${
              mobileMenuOpen
                ? "max-h-[420px] pb-4 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-2 shadow-sm">
              <nav className="space-y-1">
                <NavItem
                  to="/"
                  label="Home"
                  active={isActive("/")}
                  onClick={closeMobileMenu}
                  icon={<Home className="h-5 w-5" />}
                />

                <NavItem
                  to="/results-history"
                  label="Results History"
                  active={isActive("/results-history")}
                  onClick={closeMobileMenu}
                  icon={<BarChart3 className="h-5 w-5" />}
                />

                <NavItem
                  to="/contact"
                  label="Contact"
                  active={isActive("/contact")}
                  onClick={closeMobileMenu}
                  icon={<MessageCircle className="h-5 w-5" />}
                />
              </nav>

              {/* Mobile Authentication */}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-200 pt-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}
      <main className="min-h-[calc(100vh-4.25rem)]">
        <Outlet />
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="mt-16 bg-gray-950 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* About */}
            <div>
              <div className="mb-3 flex items-center gap-1">
                <h3 className="text-lg font-bold text-white">Lottery</h3>

                <h3 className="text-lg font-bold text-indigo-400">Play</h3>
              </div>

              <p className="max-w-md text-sm leading-6">
                Welcome to our 2D Lottery Management System. Check the latest
                results, view result history, and manage your lottery account.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 font-bold text-white">Quick Links</h3>

              <div className="space-y-2.5 text-sm">
                <Link
                  to="/"
                  className="block transition-colors hover:text-white"
                >
                  Home
                </Link>

                <Link
                  to="/results-history"
                  className="block transition-colors hover:text-white"
                >
                  Results History
                </Link>

                <Link
                  to="/contact"
                  className="block transition-colors hover:text-white"
                >
                  Contact
                </Link>

                <Link
                  to="/login"
                  className="block transition-colors hover:text-white"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 font-bold text-white">Contact</h3>

              <div className="space-y-2.5 text-sm">
                <p>Phone: 09 123456789</p>

                <p>Email: admin@lottery.com</p>

                <p>Yangon, Myanmar</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm">
            © {new Date().getFullYear()} LotteryPlay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
