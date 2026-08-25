import { Routes, Route } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ResultManagement from "@/pages/admin/ResultManagement";
import TransactionManagement from "@/pages/admin/TransactionManagement";
import UserManagement from "@/pages/admin/UserManagement";
import PlayerList from "@/pages/admin/PlayerList";
import PlayerWalletManagement from "@/pages/admin/PlayerWalletManagement";
import Settings from "@/pages/admin/Settings";
import Reports from "@/pages/admin/Reports";
import AdminNotifications from "@/pages/admin/Notifications";

import { PlayerRoutes } from "@/routes/PlayerRoutes";

import PublicLayout from "@/layouts/PublicLayout";
import Home from "@/pages/public/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResultsHistory from "@/pages/public/ResultsHistory";
import About from "@/pages/public/About";

export default function AppRoutes() {
  return (
    <Routes>
      {/* =====================================================
          ADMIN
      ===================================================== */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/admin/results" element={<ResultManagement />} />

        <Route path="/admin/balance" element={<TransactionManagement />} />

        {/* USER MANAGEMENT */}
        <Route path="/admin/users" element={<UserManagement />}>
          {/* /admin/users */}
          <Route index element={<PlayerList />} />

          {/* /admin/users/wallet */}
          <Route path="wallet" element={<PlayerWalletManagement />} />
        </Route>

        <Route path="/admin/settings" element={<Settings />} />

        <Route path="/admin/reports" element={<Reports />} />

        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>

      {/* =====================================================
          PLAYER
      ===================================================== */}
      {PlayerRoutes()}

      {/* =====================================================
          PUBLIC
      ===================================================== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/results-history" element={<ResultsHistory />} />

        <Route path="/register" element={<Register />} />

        <Route path="/about" element={<About />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
    </Routes>
  );
}
