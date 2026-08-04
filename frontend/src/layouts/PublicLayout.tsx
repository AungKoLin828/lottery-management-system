import { Outlet, Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="font-bold text-xl">Public</h1>
          {/* <h1 className="font-bold text-xl">2D Lottery</h1> */}
          <nav className="space-x-5">
            <Link to="/">Home</Link>

            <Link to="/results">Results</Link>

            <Link to="/history">History</Link>

            <Link to="/login">Login</Link>

            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white text-center p-4">
        © 2026 Lottery Management System
      </footer>
    </div>
  );
}
