// src/layouts/PlayerLayout.tsx

import { NavLink, Outlet } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";

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
    name: "Profile",
    path: "/player/profile",
    icon: User,
  },
];

export default function PlayerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <NavLink
            to="/player"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Dice5 size={20} />
            </div>

            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Lottery
              </span>

              <span className="text-lg font-bold tracking-tight text-indigo-600">
                Play
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
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

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Wallet Balance */}
            <NavLink
              to="/player/wallet"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex"
            >
              <WalletCards size={17} className="text-indigo-600" />

              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Balance
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  125,000 MMK
                </p>
              </div>
            </NavLink>

            {/* Logout */}
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-500 sm:block"
              title="Logout"
            >
              <LogOut size={19} />
            </button>

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation"
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
                    <Icon size={19} />

                    {item.name}
                  </NavLink>
                );
              })}

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={19} />
                Logout
              </button>
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
