// src/routes/PlayerRoutes.tsx

import { Route } from "react-router-dom";

import PlayerLayout from "@/layouts/PlayerLayout";
import Dashboard from "@/pages/player/PlayerDashboard";
import Play2D from "@/pages/player/Play2D";
import Play3D from "@/pages/player/Play3D";
import MyTickets from "@/pages/player/MyTickets";
import Wallet from "@/pages/player/Wallet";
import Profile from "@/pages/player/Profile";
import Contact from "@/pages/player/Contact";
import ResultsHistory from "@/pages/public/ResultsHistory";
import PlayerNotifications from "@/pages/player/Notifications";

export function PlayerRoutes() {
  return (
    <Route path="/player" element={<PlayerLayout />}>
      <Route index element={<Dashboard />} />

      <Route path="play-2d" element={<Play2D />} />

      <Route path="play-3d" element={<Play3D />} />

      <Route path="tickets" element={<MyTickets />} />

      <Route path="wallet" element={<Wallet />} />

      <Route path="profile" element={<Profile />} />

      <Route path="contact" element={<Contact />} />

      <Route path="results-history" element={<ResultsHistory />} />

      <Route path="notifications" element={<PlayerNotifications />} />
    </Route>
  );
}
