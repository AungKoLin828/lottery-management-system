import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ticket,
  Trophy,
  WalletCards,
  ArrowRight,
  CalendarDays,
  Clock3,
  RefreshCw,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

/* ============================================================
   TYPES
============================================================ */

type DashboardStats = {
  walletBalance: number;
  totalTickets: number;
  totalDeposit: number;
  totalWithdraw: number;
};

type LatestDraw = {
  id: string;
  type: "2D" | "3D";
  number: string;
  session: "AM" | "PM" | null;
  date: string;
  time: string;
};

type Winner = {
  id: string;
  player: string;
  type: "2D" | "3D";
  number: string;
  session: "AM" | "PM" | null;
  date: string;
  prize: number;
};

type DashboardUser = {
  id: string;
  username: string;
  fullName: string | null;
  phone: string;
  role?: "ADMIN" | "PLAYER";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified?: boolean;
};

type DashboardData = {
  user: DashboardUser;
  stats: DashboardStats;
  latestDraw: LatestDraw | null;
  winners: Winner[];
};

/* ============================================================
   API RESPONSE

   Backend currently returns:

   {
     success: true,
     user: {...},
     stats: {...},
     latestDraw: null,
     winners: []
   }
============================================================ */

type DashboardResponse = {
  success: boolean;
  message?: string;

  user?: DashboardUser;

  stats?: DashboardStats;

  latestDraw?: LatestDraw | null;

  winners?: Winner[];
};

/* ============================================================
   HELPERS
============================================================ */

function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/* ============================================================
   PAGE
============================================================ */

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/player/dashboard", {
        method: "GET",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      /* ======================================================
         CONTENT TYPE
      ====================================================== */

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        const text = await response.text();

        console.error("Dashboard API returned non-JSON response:", {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text.substring(0, 500),
        });

        if (response.status === 404) {
          throw new Error("Dashboard API endpoint was not found");
        }

        throw new Error("Dashboard API returned an invalid response");
      }

      /* ======================================================
         PARSE JSON
      ====================================================== */

      const result = (await response.json()) as DashboardResponse;

      console.log("Dashboard API response:", result);

      /* ======================================================
         API ERROR
      ====================================================== */

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      /* ======================================================
         VALIDATE USER
      ====================================================== */

      if (!result.user) {
        console.error("Dashboard response does not contain user:", result);

        throw new Error("Dashboard user data is unavailable");
      }

      /* ======================================================
         VALIDATE STATS
      ====================================================== */

      if (!result.stats) {
        console.error("Dashboard response does not contain stats:", result);

        throw new Error("Dashboard statistics are unavailable");
      }

      /* ======================================================
         NORMALIZE DATA
      ====================================================== */

      const normalizedData: DashboardData = {
        user: {
          id: result.user.id,

          username: result.user.username,

          fullName: result.user.fullName ?? null,

          phone: result.user.phone,

          role: result.user.role,

          status: result.user.status,

          isVerified: result.user.isVerified,
        },

        stats: {
          walletBalance: Number(result.stats.walletBalance ?? 0),

          totalTickets: Number(result.stats.totalTickets ?? 0),

          totalDeposit: Number(result.stats.totalDeposit ?? 0),

          totalWithdraw: Number(result.stats.totalWithdraw ?? 0),
        },

        latestDraw: result.latestDraw ?? null,

        winners: Array.isArray(result.winners)
          ? result.winners.map((winner) => ({
              ...winner,

              prize: Number(winner.prize ?? 0),
            }))
          : [],
      };

      /* ======================================================
         SET DATA
      ====================================================== */

      setData(normalizedData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setData(null);

      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const stats = useMemo(() => {
    const values = data?.stats ?? {
      walletBalance: 0,
      totalTickets: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
    };

    return [
      {
        title: "Wallet Balance",

        value: formatMoney(values.walletBalance),

        unit: "MMK",

        icon: WalletCards,

        iconBg: "bg-emerald-100",

        iconColor: "text-emerald-600",
      },

      {
        title: "Total Tickets",

        value: Number(values.totalTickets || 0).toLocaleString("en-US"),

        unit: "Tickets",

        icon: Ticket,

        iconBg: "bg-indigo-100",

        iconColor: "text-indigo-600",
      },

      {
        title: "Total Deposit",

        value: formatMoney(values.totalDeposit),

        unit: "MMK",

        icon: ArrowDownToLine,

        iconBg: "bg-blue-100",

        iconColor: "text-blue-600",
      },

      {
        title: "Total Withdraw",

        value: formatMoney(values.totalWithdraw),

        unit: "MMK",

        icon: ArrowUpFromLine,

        iconBg: "bg-amber-100",

        iconColor: "text-amber-600",
      },
    ];
  }, [data]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />

              <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-100" />

              <div className="mt-2 h-6 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="text-slate-400">Player</span>

            <span className="text-emerald-400">/</span>

            <span className="text-emerald-500">Dashboard</span>
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Player Dashboard
          </h1>

          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            Manage your lottery play, tickets and wallet.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700">
                Unable to load dashboard
              </p>

              <p className="mt-1 text-xs text-red-600">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     DATA
  ============================================================ */

  const latestDraw = data?.latestDraw ?? null;

  const winners = data?.winners ?? [];

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="space-y-5 pb-6">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div>
        <div className="flex items-center gap-1 text-xs font-semibold">
          <span className="text-slate-400">Player</span>

          <span className="text-emerald-400">/</span>

          <span className="text-emerald-500">Dashboard</span>
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Player Dashboard
        </h1>

        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
          Manage your lottery play, tickets and wallet.
        </p>
      </div>

      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </div>

              <p className="mt-4 truncate text-[10px] font-semibold text-slate-400 sm:text-xs">
                {item.title}
              </p>

              <div className="mt-1 flex min-w-0 items-baseline gap-1.5">
                <p className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                  {item.value}
                </p>

                <span className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">
                  {item.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================
          QUICK PLAY
      ======================================================= */}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Play Lottery</h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Choose your lottery game
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
            Quick Play
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* ==================================================
              2D
          ================================================== */}

          <Link
            to="/player/play-2d"
            className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60 transition group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                <span className="text-sm font-extrabold tracking-tight">
                  2D
                </span>
              </div>

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:bg-emerald-500 group-hover:text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="relative mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Lottery
              </p>

              <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
                Play 2D
              </h3>

              <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">
                Select AM or PM session and place your 2D bets.
              </p>
            </div>

            <div className="relative mt-4 flex items-center justify-between border-t border-emerald-100 pt-3">
              <span className="text-[10px] font-bold text-emerald-600">
                Start playing
              </span>

              <span className="text-lg text-emerald-500 transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>

          {/* ==================================================
              3D
          ================================================== */}

          <Link
            to="/player/play-3d"
            className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-5"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/60 transition group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm shadow-blue-200">
                <span className="text-sm font-extrabold tracking-tight">
                  3D
                </span>
              </div>

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:bg-blue-500 group-hover:text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="relative mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Lottery
              </p>

              <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
                Play 3D
              </h3>

              <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">
                Select your 3D number and enter your bet amount.
              </p>
            </div>

            <div className="relative mt-4 flex items-center justify-between border-t border-blue-100 pt-3">
              <span className="text-[10px] font-bold text-blue-600">
                Start playing
              </span>

              <span className="text-lg text-blue-500 transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ======================================================
          LATEST DRAW
      ======================================================= */}

      {latestDraw ? (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-100 sm:p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />

          <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/10">
                <Trophy className="h-5 w-5 text-amber-300" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold sm:text-base">
                    Latest Draw
                  </h2>

                  <span className="rounded-md bg-white/15 px-2 py-1 text-[9px] font-bold text-emerald-50">
                    {latestDraw.type}
                  </span>

                  {latestDraw.session && (
                    <span className="rounded-md bg-amber-400 px-2 py-1 text-[9px] font-extrabold text-amber-950">
                      {latestDraw.session}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-emerald-100">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />

                    {latestDraw.date}
                  </span>

                  {latestDraw.time && (
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />

                      {latestDraw.time}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10 sm:min-w-[210px]">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-100">
                  Winning Number
                </p>

                <p className="mt-0.5 text-[10px] text-emerald-200">
                  Latest result
                </p>
              </div>

              <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-white text-3xl font-black tracking-[0.15em] text-emerald-600 shadow-lg">
                {latestDraw.number}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Trophy className="mx-auto h-7 w-7 text-slate-300" />

          <p className="mt-2 text-sm font-bold text-slate-600">
            No published result yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            The latest lottery result will appear here once published.
          </p>
        </div>
      )}

      {/* ======================================================
          LATEST WINNERS
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                  Latest Winners
                </h2>

                {latestDraw && (
                  <span className="hidden rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600 sm:inline-block">
                    {latestDraw.type}
                    {latestDraw.session ? ` · ${latestDraw.session}` : ""}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                {latestDraw
                  ? `Draw result · ${latestDraw.date}`
                  : "Latest winning tickets"}
              </p>
            </div>
          </div>

          <Link
            to="/player/results-history"
            className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 sm:text-xs"
          >
            View Results →
          </Link>
        </div>

        {/* DRAW NUMBER */}

        {latestDraw && (
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                Latest Draw Number
              </span>

              <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-black tracking-[0.15em] text-white shadow-sm">
                {latestDraw.number}
              </span>

              {latestDraw.session && (
                <span className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-slate-500 ring-1 ring-emerald-100">
                  {latestDraw.session}
                </span>
              )}
            </div>

            <span className="hidden text-[9px] font-medium text-slate-400 sm:block">
              {latestDraw.date}
            </span>
          </div>
        )}

        {/* TABLE HEADER */}

        <div className="hidden grid-cols-[55px_minmax(0,1fr)_150px_140px] items-center border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
          <span>#</span>

          <span>Winner</span>

          <span>Number</span>

          <span className="text-right">Prize</span>
        </div>

        {/* WINNERS */}

        {winners.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {winners.slice(0, 3).map((winner, index) => (
              <div
                key={winner.id}
                className="px-4 py-3 transition hover:bg-slate-50 sm:px-5"
              >
                {/* DESKTOP */}

                <div className="hidden grid-cols-[55px_minmax(0,1fr)_150px_140px] items-center gap-3 sm:grid">
                  <div>
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        index === 0
                          ? "bg-amber-100 text-amber-600"
                          : index === 1
                            ? "bg-slate-100 text-slate-500"
                            : "bg-orange-50 text-orange-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {winner.player}
                    </p>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      Winner · {winner.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 items-center rounded-lg bg-emerald-50 px-3 text-sm font-extrabold tracking-[0.18em] text-emerald-600 ring-1 ring-emerald-100">
                      {winner.number}
                    </span>

                    {winner.session && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                        {winner.session}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-amber-600">
                      +{formatMoney(winner.prize)}
                    </p>

                    <p className="text-[9px] font-semibold text-slate-400">
                      MMK
                    </p>
                  </div>
                </div>

                {/* MOBILE */}

                <div className="sm:hidden">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        index === 0
                          ? "bg-amber-100 text-amber-600"
                          : index === 1
                            ? "bg-slate-100 text-slate-500"
                            : "bg-orange-50 text-orange-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {winner.player}
                      </p>

                      <p className="mt-0.5 truncate text-[9px] text-slate-400">
                        {winner.type} · {winner.date}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-8 items-center rounded-lg bg-emerald-50 px-2.5 text-xs font-extrabold tracking-[0.15em] text-emerald-600 ring-1 ring-emerald-100">
                          {winner.number}
                        </span>

                        {winner.session && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[8px] font-bold text-slate-500">
                            {winner.session}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 pl-11">
                    <span className="text-[9px] text-slate-400">Prize</span>

                    <span className="text-xs font-extrabold text-amber-600">
                      +{formatMoney(winner.prize)} MMK
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <Trophy className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-2 text-xs font-bold text-slate-500">
              No winners yet
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Winning tickets will appear here after a result is processed.
            </p>
          </div>
        )}

        {/* FOOTER */}

        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-slate-400 sm:text-[10px]">
              Showing winners from the latest available winning tickets
            </p>

            <Link
              to="/player/results-history"
              className="text-[10px] font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              Results History →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
