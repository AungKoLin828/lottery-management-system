import {
  ArrowRight,
  CalendarDays,
  Clock3,
  RefreshCw,
  Trophy,
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

  /*
   * Existing statistics are still loaded because
   * the backend already returns them.
   *
   * They are intentionally NOT displayed on this dashboard.
   */
  stats: DashboardStats;

  /*
   * New dashboard result list.
   *
   * Expected:
   * 2D AM
   * 2D PM
   * 3D
   */
  latestResults: LatestDraw[];

  /*
   * Kept for backward compatibility with the
   * current backend response.
   */
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

  /*
   * New field recommended for the dashboard.
   */
  latestResults?: LatestDraw[];

  /*
   * Existing field.
   */
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
         NORMALIZE LATEST RESULTS
      ====================================================== */

      let normalizedLatestResults: LatestDraw[] = [];

      /*
       * Preferred:
       *
       * result.latestResults
       *
       * This should contain:
       * 2D AM
       * 2D PM
       * 3D
       */
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

      /*
       * Backward compatibility:
       *
       * If the backend has not yet been changed and only
       * returns latestDraw, use that as a single result.
       */
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

  /* ==========================================================
     USER DISPLAY NAME
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

    /*
     * Keep the dashboard ordering:
     *
     * 2D AM
     * 2D PM
     * 3D
     */
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
        {/* HEADER */}

        <div>
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        {/* QUICK PLAY */}

        <div>
          <div className="mb-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

            <div className="mt-2 h-3 w-44 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />

            <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>

        {/* LATEST RESULTS */}

        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

        {/* WINNERS */}

        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="space-y-5 pb-6">
        {/* HEADER */}

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
            Here’s the latest lottery information for you.
          </p>
        </div>

        {/* ERROR */}

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

  /* ==========================================================
     PAGE
  ========================================================== */

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
          Welcome back, {displayName}
        </h1>

        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
          Here’s the latest lottery information for you.
        </p>
      </div>

      {/* ======================================================
          QUICK PLAY
      ======================================================= */}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Quick Play
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              Choose a lottery game to start playing
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* ==================================================
              2D
          ================================================== */}

          <Link
            to="/player/play-2d"
            className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5"
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/60 transition duration-300 group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                <span className="text-sm font-extrabold tracking-tight">
                  2D
                </span>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:bg-emerald-500 group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="relative mt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Lottery
              </p>

              <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                Play 2D
              </h3>

              <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-slate-500">
                Select your AM or PM session and place your 2D bets.
              </p>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-emerald-100 pt-3">
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
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-100/60 transition duration-300 group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm shadow-blue-200">
                <span className="text-sm font-extrabold tracking-tight">
                  3D
                </span>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition group-hover:bg-blue-500 group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <div className="relative mt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Lottery
              </p>

              <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                Play 3D
              </h3>

              <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-slate-500">
                Select your 3D number and enter your bet amount.
              </p>
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-blue-100 pt-3">
              <span className="text-[10px] font-bold text-blue-600">
                Start playing
              </span>

              <span className="text-lg text-blue-500 transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ======================================================
          LATEST RESULTS
      ======================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Trophy className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                Latest Results
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                Latest published lottery results
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

        {/* RESULTS */}

        {latestResults.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {latestResults.slice(0, 3).map((result) => (
              <div
                key={result.id}
                className="px-4 py-3.5 transition hover:bg-slate-50 sm:px-5"
              >
                <div className="flex items-center gap-3">
                  {/* TYPE */}

                  <div className="w-10 shrink-0 sm:w-12">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-extrabold ${
                        result.type === "2D"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {result.type}
                    </span>
                  </div>

                  {/* SESSION */}

                  <div className="w-12 shrink-0">
                    {result.session ? (
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[9px] font-extrabold ${
                          result.session === "AM"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {result.session}
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-300">
                        —
                      </span>
                    )}
                  </div>

                  {/* NUMBER */}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex min-w-[58px] items-center justify-center rounded-lg px-3 py-1.5 text-base font-black tracking-[0.15em] sm:text-lg ${
                          result.type === "2D"
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                            : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                        }`}
                      >
                        {result.number}
                      </span>
                    </div>
                  </div>

                  {/* DATE / TIME */}

                  <div className="shrink-0 text-right">
                    {result.time && (
                      <div className="flex items-center justify-end gap-1 text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                        <Clock3 className="h-3 w-3 text-slate-400" />

                        <span>{result.time}</span>
                      </div>
                    )}

                    {result.date && (
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                        <CalendarDays className="h-3 w-3" />

                        <span>{result.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <Trophy className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-2 text-xs font-bold text-slate-500">
              No published results yet
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              The latest lottery results will appear here once published.
            </p>
          </div>
        )}

        {/* FOOTER */}

        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-slate-400 sm:text-[10px]">
              Showing the latest available results
            </p>

            <Link
              to="/player/results-history"
              className="text-[10px] font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              Results History →
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          LATEST WINNERS
      ======================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                Latest Winners
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                Recent winning tickets
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

        {/* TABLE HEADER */}

        <div className="hidden grid-cols-[55px_minmax(0,1fr)_150px_140px] items-center border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
          <span>#</span>

          <span>Winner</span>

          <span>Number</span>

          <span className="text-right">Prize</span>
        </div>

        {/* WINNERS */}

        {latestWinners.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {latestWinners.map((winner, index) => (
              <div
                key={winner.id}
                className="px-4 py-3 transition hover:bg-slate-50 sm:px-5"
              >
                {/* ==================================================
                    DESKTOP
                ================================================== */}

                <div className="hidden grid-cols-[55px_minmax(0,1fr)_150px_140px] items-center gap-3 sm:grid">
                  {/* RANK */}

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

                  {/* PLAYER */}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {winner.player}
                    </p>

                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400">
                      <span>{winner.type}</span>

                      {winner.session && (
                        <>
                          <span>·</span>

                          <span>{winner.session}</span>
                        </>
                      )}

                      {winner.date && (
                        <>
                          <span>·</span>

                          <span>{winner.date}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* NUMBER */}

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-8 items-center rounded-lg px-3 text-sm font-extrabold tracking-[0.18em] ${
                        winner.type === "2D"
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                          : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      }`}
                    >
                      {winner.number}
                    </span>

                    {winner.session && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                        {winner.session}
                      </span>
                    )}
                  </div>

                  {/* PRIZE */}

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-amber-600">
                      +{formatMoney(winner.prize)}
                    </p>

                    <p className="text-[9px] font-semibold text-slate-400">
                      MMK
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    MOBILE
                ================================================== */}

                <div className="sm:hidden">
                  <div className="flex items-center gap-3">
                    {/* RANK */}

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

                    {/* PLAYER */}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {winner.player}
                      </p>

                      <p className="mt-0.5 truncate text-[9px] text-slate-400">
                        {winner.type}

                        {winner.session ? ` · ${winner.session}` : ""}

                        {winner.date ? ` · ${winner.date}` : ""}
                      </p>
                    </div>

                    {/* NUMBER */}

                    <div className="shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-extrabold tracking-[0.15em] ${
                            winner.type === "2D"
                              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                          }`}
                        >
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

                  {/* PRIZE */}

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
              Showing the latest available winners
            </p>

            <Link
              to="/player/results-history"
              className="text-[10px] font-semibold text-slate-500 transition hover:text-emerald-600"
            >
              Results History →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
