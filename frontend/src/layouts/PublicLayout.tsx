import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                D
              </div>

              <div>
                <h1 className="text-lg font-bold text-gray-900">Lottery</h1>

                <p className="hidden text-xs text-gray-500 sm:block">
                  Lottery Management System
                </p>
              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
                ================================================= */}
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                to="/"
                className={
                  isActive("/")
                    ? "font-semibold text-blue-600"
                    : "text-gray-600 transition-colors hover:text-blue-600"
                }
              >
                Home
              </Link>

              <Link
                to="/results-history"
                className={
                  isActive("/results-history")
                    ? "font-semibold text-blue-600"
                    : "text-gray-600 transition-colors hover:text-blue-600"
                }
              >
                Results History
              </Link>

              <Link
                to="/contact"
                className={
                  isActive("/contact")
                    ? "font-semibold text-blue-600"
                    : "text-gray-600 transition-colors hover:text-blue-600"
                }
              >
                Contact
              </Link>
            </nav>

            {/* =================================================
                DESKTOP AUTHENTICATION
                ================================================= */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-lg border border-blue-600 px-4 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
              >
                Register
              </Link>
            </div>

            {/* =================================================
                MOBILE MENU BUTTON
                ================================================= */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* =================================================
              MOBILE NAVIGATION
              ================================================= */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-100 py-3 md:hidden">
              <nav className="flex flex-col space-y-1">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive("/")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/results-history"
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive("/results-history")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  }`}
                >
                  Results History
                </Link>

                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive("/contact")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  }`}
                >
                  Contact
                </Link>

                {/* Mobile Authentication */}
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg border border-blue-600 px-4 py-2.5 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          PAGE CONTENT
          ===================================================== */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="mt-16 bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* About */}
            <div>
              <h3 className="mb-3 text-lg font-bold text-white">2D Lottery</h3>

              <p className="text-sm leading-6">
                Welcome to our 2D Lottery Management System. Check the latest
                results, view result history, and manage your lottery account.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-3 font-bold text-white">Quick Links</h3>

              <div className="space-y-2 text-sm">
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
              <h3 className="mb-3 font-bold text-white">Contact</h3>

              <p className="text-sm">Phone: 09 123456789</p>

              <p className="mt-2 text-sm">Email: admin@lottery.com</p>

              <p className="mt-2 text-sm">Yangon, Myanmar</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm">
            © {new Date().getFullYear()} Lottery. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
