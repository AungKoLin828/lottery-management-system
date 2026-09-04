import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Crown,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
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
  latestResults: LatestDraw[];
  latestDraw: LatestDraw | null;
  winners: Winner[];
};

/* ============================================================
   API RESPONSE
============================================================ */

type DashboardResponse = {
  success: boolean;
  message?: string;

  user?: DashboardUser;

  stats?: DashboardStats;

  latestResults?: LatestDraw[];

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
   RESULT STYLE
============================================================ */

function getResultTheme(type: "2D" | "3D") {
  if (type === "3D") {
    return {
      card: "border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-50/70",
      badge: "bg-blue-100 text-blue-700 ring-blue-200",
      number: "bg-white text-blue-700 ring-blue-200 shadow-blue-100/70",
      accent: "bg-blue-500",
      glow: "bg-blue-200/30",
    };
  }

  return {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/70",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    number: "bg-white text-emerald-700 ring-emerald-200 shadow-emerald-100/70",
    accent: "bg-emerald-500",
    glow: "bg-emerald-200/30",
  };
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
         NORMALIZE LATEST RESULTS
      ====================================================== */

      let normalizedLatestResults: LatestDraw[] = [];

      if (
        Array.isArray(result.latestResults) &&
        result.latestResults.length > 0
      ) {
        normalizedLatestResults = result.latestResults
          .filter(
            (draw): draw is LatestDraw =>
              Boolean(draw) &&
              typeof draw.id === "string" &&
              (draw.type === "2D" || draw.type === "3D") &&
              typeof draw.number === "string",
          )
          .map((draw) => ({
            id: draw.id,
            type: draw.type,
            number: draw.number,
            session: draw.session ?? null,
            date: draw.date ?? "",
            time: draw.time ?? "",
          }));
      }

      /* ======================================================
         BACKWARD COMPATIBILITY
      ====================================================== */

      if (normalizedLatestResults.length === 0 && result.latestDraw) {
        normalizedLatestResults = [
          {
            id: result.latestDraw.id,
            type: result.latestDraw.type,
            number: result.latestDraw.number,
            session: result.latestDraw.session ?? null,
            date: result.latestDraw.date ?? "",
            time: result.latestDraw.time ?? "",
          },
        ];
      }

      /* ======================================================
         NORMALIZE WINNERS
      ====================================================== */

      const normalizedWinners: Winner[] = Array.isArray(result.winners)
        ? result.winners
            .filter((winner) => winner && typeof winner.id === "string")
            .map((winner) => ({
              ...winner,
              prize: Number(winner.prize ?? 0),
              session: winner.session ?? null,
              date: winner.date ?? "",
            }))
        : [];

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

        latestResults: normalizedLatestResults,

        latestDraw: result.latestDraw ?? null,

        winners: normalizedWinners,
      };

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

  /* ==========================================================
     DISPLAY NAME
  ========================================================== */

  const displayName = useMemo(() => {
    if (!data?.user) {
      return "Player";
    }

    return data.user.fullName?.trim() || data.user.username || "Player";
  }, [data]);

  /* ==========================================================
     LATEST RESULTS
  ========================================================== */

  const latestResults = useMemo(() => {
    const results = data?.latestResults ?? [];

    return [...results].sort((a, b) => {
      const order = (draw: LatestDraw) => {
        if (draw.type === "2D" && draw.session === "AM") {
          return 1;
        }

        if (draw.type === "2D" && draw.session === "PM") {
          return 2;
        }

        if (draw.type === "3D") {
          return 3;
        }

        return 99;
      };

      return order(a) - order(b);
    });
  }, [data]);

  /* ==========================================================
     LATEST WINNERS
  ========================================================== */

  const latestWinners = useMemo(() => {
    return (data?.winners ?? []).slice(0, 3);
  }, [data]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="space-y-5 pb-6">
        {/* HERO */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="animate-pulse">
            <div className="h-6 w-24 rounded-full bg-slate-200" />

            <div className="mt-5 h-8 w-80 max-w-full rounded-xl bg-slate-200" />

            <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-slate-100" />

            <div className="mt-6 h-10 w-32 rounded-xl bg-slate-100" />
          </div>
        </div>

        {/* QUICK PLAY */}

        <section>
          <div className="mb-3 h-5 w-28 animate-pulse rounded bg-slate-200" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
            <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </section>

        {/* RESULTS */}

        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />

        {/* WINNERS */}

        <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className="text-slate-400">Player</span>

            <span className="text-emerald-400">/</span>

            <span className="text-emerald-600">Dashboard</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Player Dashboard
          </h1>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm sm:p-6">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-600">
                Something went wrong
              </div>

              <p className="mt-3 text-sm font-extrabold text-slate-900">
                Unable to load your dashboard
              </p>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="space-y-6 pb-8">
      {/* ======================================================
          WELCOME HERO
      ======================================================= */}

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
        {/* Decorative shapes */}

        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />

        <div className="pointer-events-none absolute right-12 top-8 hidden h-28 w-28 rounded-full border border-emerald-100 sm:block" />

        <div className="pointer-events-none absolute right-20 top-16 hidden h-14 w-14 rounded-full border border-emerald-100 sm:block" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Welcome */}

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black tracking-[0.14em] text-emerald-600">
                <Sparkles className="h-3 w-3" />
                LOTTERY PLAYER
              </div>

              <h1 className="mt-4 max-w-2xl text-[26px] font-black leading-tight tracking-[-0.03em] text-slate-900 sm:text-3xl">
                Welcome back,{" "}
                <span className="text-emerald-600">{displayName}</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                Your numbers, results and winning moments — all in one place.
                Choose a game and see what’s happening today.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  to="/player/play-2d"
                  className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:text-xs"
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  Quick Play
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/player/results-history"
                  className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-extrabold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 sm:text-xs"
                >
                  View Results
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Decorative number panel */}

            <div className="hidden shrink-0 lg:block">
              <div className="relative flex h-36 w-52 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/80">
                <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-100/60" />

                <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-blue-100/50" />

                <div className="relative flex items-end gap-2">
                  <div className="flex h-16 w-14 items-center justify-center rounded-2xl bg-white text-3xl font-black text-emerald-600 shadow-sm ring-1 ring-slate-200">
                    2
                  </div>

                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl font-black text-slate-400 shadow-sm ring-1 ring-slate-200">
                    0
                  </div>

                  <div className="flex h-16 w-14 items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-600 shadow-sm ring-1 ring-slate-200">
                    8
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          QUICK PLAY
      ======================================================= */}

      <section>
        <div className="mb-3.5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                Quick Play
              </h2>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                Games
              </span>
            </div>

            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              Pick a game and start your next play
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* ==================================================
              2D CARD
          ================================================== */}

          <Link
            to="/player/play-2d"
            className="group relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[0_10px_30px_-20px_rgba(16,185,129,0.55)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_40px_-20px_rgba(16,185,129,0.4)]"
          >
            {/* Background number */}

            <div className="pointer-events-none absolute -right-3 -top-8 select-none text-[150px] font-black leading-none text-emerald-500/[0.055] transition duration-500 group-hover:scale-110">
              2D
            </div>

            {/* Accent */}

            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

            <div className="relative flex min-h-[158px] items-center gap-4 p-5 sm:p-6">
              {/* Game icon */}

              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-md" />

                <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200/70">
                  <span className="text-xl font-black tracking-tight">2D</span>
                </div>
              </div>

              {/* Content */}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    Play 2D
                  </h3>

                  <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-100">
                    AM / PM
                  </span>
                </div>

                <p className="mt-1.5 max-w-xs text-[10px] leading-4 text-slate-500 sm:text-xs">
                  Choose your lucky two-digit number and play for the AM or PM
                  draw.
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600">
                  Start playing
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* ==================================================
              3D CARD
          ================================================== */}

          <Link
            to="/player/play-3d"
            className="group relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-white shadow-[0_10px_30px_-20px_rgba(59,130,246,0.55)] transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_-20px_rgba(59,130,246,0.4)]"
          >
            {/* Background number */}

            <div className="pointer-events-none absolute -right-5 -top-8 select-none text-[150px] font-black leading-none text-blue-500/[0.055] transition duration-500 group-hover:scale-110">
              3D
            </div>

            {/* Accent */}

            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />

            <div className="relative flex min-h-[158px] items-center gap-4 p-5 sm:p-6">
              {/* Game icon */}

              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-md" />

                <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-200/70">
                  <span className="text-xl font-black tracking-tight">3D</span>
                </div>
              </div>

              {/* Content */}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    Play 3D
                  </h3>

                  <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-wider text-blue-600 ring-1 ring-blue-100">
                    3 DIGITS
                  </span>
                </div>

                <p className="mt-1.5 max-w-xs text-[10px] leading-4 text-slate-500 sm:text-xs">
                  Pick your three-digit number and try your luck in the 3D draw.
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600">
                  Start playing
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ======================================================
          LATEST RESULTS
      ======================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        {/* Header */}

        <div className="relative border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Trophy className="h-[18px] w-[18px]" />

                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 sm:text-base">
                    Latest Results
                  </h2>

                  <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 sm:inline-flex">
                    Live Board
                  </span>
                </div>

                <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                  The latest published winning numbers
                </p>
              </div>
            </div>

            <Link
              to="/player/results-history"
              className="group inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[9px] font-black text-emerald-600 transition hover:bg-emerald-50 sm:text-[10px]"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Result Content */}

        {latestResults.length > 0 ? (
          <div className="p-3 sm:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {latestResults.slice(0, 3).map((result) => {
                const theme = getResultTheme(result.type);

                return (
                  <div
                    key={result.id}
                    className={`group relative overflow-hidden rounded-2xl border ${theme.card} p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    {/* Decorative glow */}

                    <div
                      className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${theme.glow} blur-2xl`}
                    />

                    <div className="relative">
                      {/* Top */}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-lg px-2 py-1 text-[9px] font-black ring-1 ${theme.badge}`}
                          >
                            {result.type}
                          </span>

                          {result.session && (
                            <span
                              className={`rounded-lg px-2 py-1 text-[9px] font-black ${
                                result.session === "AM"
                                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                                  : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
                              }`}
                            >
                              {result.session}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {result.date && (
                            <p className="text-[8px] font-semibold text-slate-400">
                              {result.date}
                            </p>
                          )}

                          {result.time && (
                            <p className="mt-0.5 flex items-center justify-end gap-1 text-[8px] font-bold text-slate-500">
                              <Clock3 className="h-2.5 w-2.5" />
                              {result.time}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Label */}

                      <div className="mt-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Winning Number
                        </p>

                        {/* Number */}

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div
                            className={`inline-flex min-w-[86px] items-center justify-center rounded-xl px-4 py-2.5 text-2xl font-black tracking-[0.18em] ring-1 shadow-sm ${theme.number}`}
                          >
                            {result.number}
                          </div>

                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-300 ring-1 ring-white transition group-hover:text-slate-400`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom */}

                      <div className="mt-4 flex items-center gap-1.5 text-[8px] font-semibold text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        Latest published result
                      </div>
                    </div>

                    {/* Bottom accent */}

                    <div
                      className={`absolute inset-x-4 bottom-0 h-0.5 origin-center scale-x-0 ${theme.accent} transition duration-300 group-hover:scale-x-100`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
              <Trophy className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-700">
              No published results yet
            </p>

            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400">
              Results will appear here as soon as the lottery draw has been
              published.
            </p>
          </div>
        )}

        {/* Footer */}

        {latestResults.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-1.5 text-[8px] font-medium text-slate-400 sm:text-[9px]">
              <CalendarDays className="h-3 w-3 shrink-0" />

              <span className="truncate">Latest available lottery results</span>
            </div>

            <Link
              to="/player/results-history"
              className="shrink-0 text-[9px] font-black text-slate-500 transition hover:text-emerald-600"
            >
              Results History →
            </Link>
          </div>
        )}
      </section>

      {/* ======================================================
          LATEST WINNERS
      ======================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        {/* Header */}

        <div className="relative border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
                <Crown className="h-[18px] w-[18px]" />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900 sm:text-base">
                  Latest Winners
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                  Recent winning tickets
                </p>
              </div>
            </div>

            <Link
              to="/player/results-history"
              className="group inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[9px] font-black text-emerald-600 transition hover:bg-emerald-50 sm:text-[10px]"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Winners */}

        {latestWinners.length > 0 ? (
          <div className="p-3 sm:p-5">
            {/* Winner podium */}

            <div className="grid gap-3 md:grid-cols-3">
              {latestWinners.map((winner, index) => {
                const rankStyles =
                  index === 0
                    ? {
                        wrapper:
                          "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/50",
                        rank: "bg-amber-400 text-white shadow-amber-200",
                        icon: "text-amber-500",
                        prize: "text-amber-600",
                      }
                    : index === 1
                      ? {
                          wrapper:
                            "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50",
                          rank: "bg-slate-400 text-white shadow-slate-200",
                          icon: "text-slate-400",
                          prize: "text-slate-600",
                        }
                      : {
                          wrapper:
                            "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50/40",
                          rank: "bg-orange-400 text-white shadow-orange-200",
                          icon: "text-orange-500",
                          prize: "text-orange-600",
                        };

                return (
                  <div
                    key={winner.id}
                    className={`group relative overflow-hidden rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${rankStyles.wrapper}`}
                  >
                    {/* Decorative crown */}

                    {index === 0 && (
                      <Crown
                        className={`absolute -right-1 -top-1 h-16 w-16 rotate-12 opacity-[0.07] ${rankStyles.icon}`}
                      />
                    )}

                    <div className="relative">
                      {/* Rank / player */}

                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-md ${rankStyles.rank}`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-900">
                            {winner.player}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black ${
                                winner.type === "2D"
                                  ? "text-emerald-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {winner.type}
                            </span>

                            {winner.session && (
                              <>
                                <span className="text-slate-300">•</span>

                                <span className="text-[8px] font-semibold text-slate-400">
                                  {winner.session}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Number */}

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Winning Number
                          </p>

                          <span
                            className={`mt-1.5 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-black tracking-[0.16em] shadow-sm ring-1 ${
                              winner.type === "2D"
                                ? "text-emerald-600 ring-emerald-100"
                                : "text-blue-600 ring-blue-100"
                            }`}
                          >
                            {winner.number}
                          </span>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-black ${rankStyles.prize}`}
                          >
                            +{formatMoney(winner.prize)}
                          </p>

                          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            MMK
                          </p>
                        </div>
                      </div>

                      {/* Date */}

                      {winner.date && (
                        <div className="mt-3 flex items-center gap-1.5 text-[8px] font-semibold text-slate-400">
                          <CalendarDays className="h-3 w-3" />

                          {winner.date}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-300 ring-1 ring-amber-100">
              <Trophy className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-700">
              No winners yet
            </p>

            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400">
              Winning tickets will appear here after a result is processed.
            </p>
          </div>
        )}

        {/* Footer */}

        {latestWinners.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
            <p className="text-[8px] font-medium text-slate-400 sm:text-[9px]">
              Showing the 3 latest winners
            </p>

            <Link
              to="/player/results-history"
              className="text-[9px] font-black text-slate-500 transition hover:text-emerald-600 sm:text-[10px]"
            >
              View all results →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
