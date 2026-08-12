// src/pages/player/Dashboard.tsx

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ticket,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    title: "Wallet Balance",
    value: "125,000 MMK",
    icon: WalletCards,
  },
  {
    title: "Total Tickets",
    value: "24",
    icon: Ticket,
  },
  {
    title: "Total Deposit",
    value: "500,000 MMK",
    icon: ArrowDownToLine,
  },
  {
    title: "Total Withdraw",
    value: "375,000 MMK",
    icon: ArrowUpFromLine,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-emerald-400">Welcome back</p>

        <h1 className="mt-1 text-3xl font-bold">Player Dashboard</h1>

        <p className="mt-2 text-slate-400">
          Manage your lottery play, tickets and wallet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-400">{item.title}</p>

              <p className="mt-1 text-xl font-bold">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          to="/player/play-2d"
          className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 transition hover:border-emerald-400/40"
        >
          <p className="text-sm font-medium text-emerald-400">Lottery</p>

          <h2 className="mt-2 text-2xl font-bold">Play 2D</h2>

          <p className="mt-2 text-sm text-slate-400">
            Select AM or PM session and place your 2D bets.
          </p>

          <div className="mt-5 text-sm font-semibold text-emerald-400">
            Start playing →
          </div>
        </Link>

        <Link
          to="/player/play-3d"
          className="group rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-6 transition hover:border-blue-400/40"
        >
          <p className="text-sm font-medium text-blue-400">Lottery</p>

          <h2 className="mt-2 text-2xl font-bold">Play 3D</h2>

          <p className="mt-2 text-sm text-slate-400">
            Select your 3D number and bet amount.
          </p>

          <div className="mt-5 text-sm font-semibold text-blue-400">
            Start playing →
          </div>
        </Link>
      </div>
    </div>
  );
}
