import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ticket,
  Trophy,
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

/* ============================================================
   RECENT WINNERS
   Replace this with API data later.
============================================================ */

const winners = [
  {
    id: 1,
    player: "Aung K***",
    type: "2D",
    number: "25",
    session: "AM",
    date: "12 Aug 2026",
    prize: 100000,
  },
  {
    id: 2,
    player: "M*** L***",
    type: "2D",
    number: "25",
    session: "AM",
    date: "12 Aug 2026",
    prize: 100000,
  },
  {
    id: 3,
    player: "Ko T***",
    type: "2D",
    number: "25",
    session: "AM",
    date: "12 Aug 2026",
    prize: 100000,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <p className="text-sm text-emerald-400">Welcome back</p>

        <h1 className="mt-1 text-3xl font-bold">Player Dashboard</h1>

        <p className="mt-2 text-slate-400">
          Manage your lottery play, tickets and wallet.
        </p>
      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

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

      {/* =====================================================
          PLAY LOTTERY
      ====================================================== */}

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
      {/* =====================================================
    LATEST DRAW WINNERS
====================================================== */}

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-sm">
        {/* Header */}

        <div className="flex flex-col gap-3 border-b border-slate-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy size={19} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Latest Winners
                </h2>

                <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-400">
                  2D · AM
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Draw result · 12 Aug 2026
              </p>
            </div>
          </div>

          <Link
            to="/player/results-history"
            className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            View Results →
          </Link>
        </div>

        {/* Table Header */}

        <div className="hidden grid-cols-[55px_1fr_120px_150px] items-center border-b border-slate-700/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>#</span>

          <span>Winner</span>

          <span>Number</span>

          <span className="text-right">Prize</span>
        </div>

        {/* Winners */}

        <div className="divide-y divide-slate-800">
          {winners.slice(0, 3).map((winner, index) => (
            <div
              key={winner.id}
              className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[55px_1fr_120px_150px] sm:items-center"
            >
              {/* Rank */}

              <div className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-amber-500/15 text-amber-400"
                      : index === 1
                        ? "bg-slate-500/15 text-slate-300"
                        : "bg-orange-500/10 text-orange-400"
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Winner */}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {winner.player}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Winner · {winner.date}
                </p>
              </div>

              {/* Number */}

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-bold tracking-widest text-emerald-400 ring-1 ring-emerald-500/20">
                  {winner.number}
                </span>

                <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">
                  {winner.session}
                </span>
              </div>

              {/* Prize */}

              <div className="flex items-center justify-between sm:block sm:text-right">
                <span className="text-xs text-slate-500 sm:hidden">Prize</span>

                <p className="text-sm font-bold text-amber-400">
                  {winner.prize.toLocaleString()} MMK
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}

        <div className="border-t border-slate-700/60 px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing winners from the latest draw
            </p>

            <Link
              to="/player/results-history"
              className="text-xs font-medium text-slate-400 transition hover:text-white"
            >
              Results History →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
