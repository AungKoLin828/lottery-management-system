// src/layouts/PlayerLayout.tsx

import { NavLink, Outlet, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    path: "/player",
    icon: LayoutDashboard,
  },
  {
    name: "2D Play",
    path: "/player/play-2d",
    icon: Dice5,
  },
  {
    name: "3D Play",
    path: "/player/play-3d",
    icon: Boxes,
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

export default function PlayerLayout() {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // CLOSE MOBILE MENU WHEN ROUTE CHANGES
  // ============================================================

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // ============================================================
  // CLOSE PROFILE MENU WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    console.log("Logout");

    // Add your real logout logic here.
    // Example:
    // localStorage.removeItem("token");
    // navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* =================================================
              LOGO
          ================================================== */}
          <NavLink
            to="/player"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Lottery
              </span>

              <span className="text-lg font-bold tracking-tight text-indigo-600">
                Play
              </span>
            </div>
          </NavLink>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================== */}
          <nav className="hidden items-center gap-0 lg:flex">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/player"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={2} />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}
          <div className="flex items-center gap-2">
            {/* =================================================
                WALLET BALANCE
            ================================================== */}
            <NavLink
              to="/player/wallet"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex"
            >
              <WalletCards
                size={17}
                className="text-indigo-600"
                strokeWidth={2}
              />

              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Balance
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  125,000 MMK
                </p>
              </div>
            </NavLink>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================== */}
            <div className="relative hidden sm:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((current) => !current)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                  profileMenuOpen
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  AK
                </div>

                {/* User */}
                <div className="hidden text-left xl:block">
                  <p className="text-xs font-semibold text-slate-800">Player</p>

                  <p className="text-[10px] text-slate-400">
                    player@example.com
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* =================================================
                  DROPDOWN
              ================================================== */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                  {/* User Information */}
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Player
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      player@example.com
                    </p>
                  </div>

                  {/* Profile */}
                  <div className="p-1.5">
                    <NavLink
                      to="/player/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                    >
                      <User size={17} />

                      <span>Profile</span>
                    </NavLink>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                      <LogOut size={17} />

                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================== */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
        ====================================================== */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
              {/* Main Navigation */}
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/player"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <Icon size={19} strokeWidth={2} />

                    {item.name}
                  </NavLink>
                );
              })}

              {/* =================================================
                  MOBILE ACCOUNT SECTION
              ================================================== */}
              <div className="mt-2 border-t border-slate-100 pt-2">
                {/* Profile */}
                <NavLink
                  to="/player/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <User size={19} />
                  Profile
                </NavLink>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  <LogOut size={19} />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
