import { NavLink, Outlet } from "react-router-dom";
import { Users, Wallet } from "lucide-react";

export default function UserManagement() {
  return (
    <div className="min-w-0">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage players and player wallet balances.
        </p>
      </div>

      {/* SUB NAVIGATION */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:min-w-0">
          <NavLink
            to="/admin/users"
            end
            className={({ isActive }) =>
              `flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Player List</span>
          </NavLink>

          <NavLink
            to="/admin/users/wallet"
            className={({ isActive }) =>
              `flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Player Wallet Management</span>
          </NavLink>
        </div>
      </div>

      {/* CHILD PAGE */}
      <Outlet />
    </div>
  );
}
