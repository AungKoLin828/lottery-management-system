import { Routes, Route } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ResultManagement from "@/pages/admin/ResultManagement";
import BalanceManagement from "@/pages/admin/BalanceManagement";
import UserManagement from "@/pages/admin/UserManagement";
import Settings from "@/pages/admin/Settings";
import Reports from "@/pages/admin/Reports";
import PlayerLayout from "@/layouts/PlayerLayout";
import PlayerDashboard from "@/pages/player/PlayerDashboard";
import Wallet from "@/pages/player/Wallet";
import PublicLayout from "@/layouts/PublicLayout";
import Home from "@/pages/public/Home";
import Contact from "@/pages/public/Contact";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/results" element={<ResultManagement />} />
        <Route path="/admin/balance" element={<BalanceManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Route>

      {/* Player */}
      <Route element={<PlayerLayout />}>
        <Route path="/player" element={<PlayerDashboard />} />
        <Route path="/player/wallet" element={<Wallet />} />
      </Route>

      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}
