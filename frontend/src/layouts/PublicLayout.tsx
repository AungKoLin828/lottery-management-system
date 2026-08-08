import { Link, Outlet, useLocation } from "react-router-dom";

export default function PublicLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* Logo */}

            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                2D
              </div>

              <div>
                <h1 className="font-bold text-lg">
                  2D Lottery
                </h1>

                <p className="text-xs text-gray-500">
                  Lottery Management System
                </p>
              </div>
            </Link>


            {/* Navigation */}

            <nav className="hidden md:flex items-center gap-6">

              <Link
                to="/"
                className={
                  isActive("/")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                }
              >
                Home
              </Link>

              <Link
                to="/results-history"
                className={
                  isActive("/results-history")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                }
              >
                Results History
              </Link>

              <Link
                to="/contact"
                className={
                  isActive("/contact")
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                }
              >
                Contact
              </Link>

            </nav>


            {/* Authentication */}

            <div className="flex items-center gap-2">

              <Link
                to="/login"
                className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>

            </div>

          </div>

        </div>
      </header>


      {/* =====================================================
          PAGE CONTENT
          ===================================================== */}

      <main>
        <Outlet />
      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="bg-gray-900 text-gray-300 mt-16">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* About */}

            <div>
              <h3 className="text-white font-bold text-lg mb-3">
                2D Lottery
              </h3>

              <p className="text-sm leading-6">
                Welcome to our 2D Lottery Management System.
                Check the latest results, view result history,
                and manage your lottery account.
              </p>
            </div>


            {/* Quick Links */}

            <div>
              <h3 className="text-white font-bold mb-3">
                Quick Links
              </h3>

              <div className="space-y-2 text-sm">

                <Link
                  to="/"
                  className="block hover:text-white"
                >
                  Home
                </Link>

                <Link
                  to="/results-history"
                  className="block hover:text-white"
                >
                  Results History
                </Link>

                <Link
                  to="/contact"
                  className="block hover:text-white"
                >
                  Contact
                </Link>

                <Link
                  to="/login"
                  className="block hover:text-white"
                >
                  Login
                </Link>

              </div>
            </div>


            {/* Contact */}

            <div>
              <h3 className="text-white font-bold mb-3">
                Contact
              </h3>

              <p className="text-sm">
                Phone: 09 123456789
              </p>

              <p className="text-sm mt-2">
                Email: admin@lottery.com
              </p>

              <p className="text-sm mt-2">
                Yangon, Myanmar
              </p>
            </div>

          </div>


          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
            © {new Date().getFullYear()} 2D Lottery.
            All rights reserved.
          </div>

        </div>

      </footer>

    </div>
  );
}