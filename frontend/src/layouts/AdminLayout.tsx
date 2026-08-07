import { Outlet, Link } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-5">
        <h1 className="text-xl font-bold mb-8">Administrator</h1>
        <nav className="space-y-3">
          <Link to="/admin" className="block px-4 py-2 hover:text-blue-400">
            Dashboard
          </Link>

          <Link
            to="/admin/results"
            className="block px-4 py-2 hover:text-blue-400"
          >
            Results Management
          </Link>

          <Link
            to="/admin/users"
            className="block px-4 py-2 hover:text-blue-400"
          >
            User Management
          </Link>

          <Link
            to="/admin/balance"
            className="block px-4 py-2 hover:text-blue-400"
          >
            Balance Management
          </Link>

          <Link
            to="/admin/settings"
            className="block px-4 py-2 hover:text-blue-400"
          >
            Settings
          </Link>

          <Link
            to="/admin/reports"
            className="block px-4 py-2 hover:text-blue-400"
          >
            Reports
          </Link>
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-white shadow p-4 flex justify-between">
          <h2 className="font-semibold">Admin Dashboard</h2>
          <button className=" text-red-600">Logout</button>
        </header>

        {/* Page Content */}
        <section className="p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
