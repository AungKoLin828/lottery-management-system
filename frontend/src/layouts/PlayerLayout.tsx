import { Outlet, Link } from "react-router-dom";

export default function PlayerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600  text-white p-4 flex justify-between">
        <h1 className="font-bold text-xl">Player</h1>
        <div>
          Wallet:
          <span className="font-bold ml-2">1000 MMK</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60  bg-white shadow p-5">
          <nav className="space-y-3">
            <Link to="/player" className="block hover:text-blue-600">
              Dashboard
            </Link>

            <Link to="/player/tickets" className="block hover:text-blue-600">
              My Tickets
            </Link>

            <Link to="/player/buy" className="block hover:text-blue-600">
              Buy Ticket
            </Link>

            <Link to="/player/wallet" className="block hover:text-blue-600">
              Wallet
            </Link>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center p-4">
        © {new Date().getFullYear()} Lottery Management System. All rights
        reserved.
      </footer>
    </div>
  );
}
