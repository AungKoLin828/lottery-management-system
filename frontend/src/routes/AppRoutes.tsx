import { Routes, Route } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ResultManagement from "@/pages/admin/ResultManagement";
import BalanceManagement from "@/pages/admin/BalanceManagement";
import UserManagement from "@/pages/admin/UserManagement";
import Settings from "@/pages/admin/Settings";
import Reports from "@/pages/admin/Reports";
import { PlayerRoutes } from "@/routes/PlayerRoutes";
import PublicLayout from "@/layouts/PublicLayout";
import Home from "@/pages/public/Home";
import Contact from "@/pages/public/Contact";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ResultsHistory from "@/pages/public/ResultsHistory";

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
      {PlayerRoutes()}

      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/results-history" element={<ResultsHistory />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}
