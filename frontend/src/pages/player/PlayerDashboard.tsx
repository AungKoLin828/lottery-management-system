import {
  ArrowRight,
  CalendarDays,
  Clock3,
  RefreshCw,
  Trophy,
  Sparkles,
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
        {/* HERO SKELETON */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        {/* QUICK PLAY SKELETON */}

        <div>
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-slate-200" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>

        {/* RESULTS */}

        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />

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
        <div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="text-slate-400">Player</span>

            <span className="text-emerald-400">/</span>

            <span className="text-emerald-500">Dashboard</span>
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Player Dashboard
          </h1>
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

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="space-y-6 pb-6">
      {/* ======================================================
          WELCOME HERO
      ======================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Decorative background */}

        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Welcome */}

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                <Sparkles className="h-3 w-3" />
                PLAYER
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back,{" "}
                <span className="text-emerald-600">{displayName}</span>
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                Check the latest lottery results, see recent winners, or choose
                a game and start playing.
              </p>
            </div>

            {/* Small action */}

            <Link
              to="/player/results-history"
              className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 sm:self-center sm:text-xs"
            >
              Results History
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          QUICK PLAY
      ======================================================= */}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">
              Quick Play
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              Choose your game
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* ==================================================
              2D
          ================================================== */}

          <Link
            to="/player/play-2d"
            className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
          >
            {/* Accent */}

            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

            <div className="relative flex items-center gap-4 p-4 sm:p-5">
              {/* Number */}

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-200">
                <span className="text-base font-black tracking-tight">2D</span>
              </div>

              {/* Content */}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Play 2D
                  </h3>

                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-600">
                    AM / PM
                  </span>
                </div>

                <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                  Pick your number and place a 2D bet.
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  Start playing
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* ==================================================
              3D
          ================================================== */}

          <Link
            to="/player/play-3d"
            className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
          >
            {/* Accent */}

            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />

            <div className="relative flex items-center gap-4 p-4 sm:p-5">
              {/* Number */}

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md shadow-blue-200">
                <span className="text-base font-black tracking-tight">3D</span>
              </div>

              {/* Content */}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Play 3D
                  </h3>

                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-600">
                    3 DIGITS
                  </span>
                </div>

                <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                  Choose your 3-digit number and place a bet.
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                  Start playing
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </div>
              </div>
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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Trophy className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                Latest Results
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                Most recent published numbers
              </p>
            </div>
          </div>

          <Link
            to="/player/results-history"
            className="group inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-50"
          >
            View Results
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* RESULT CONTENT */}

        {latestResults.length > 0 ? (
          <>
            {/* Desktop / Tablet */}

            <div className="hidden divide-x divide-slate-100 sm:grid sm:grid-cols-3">
              {latestResults.slice(0, 3).map((result) => (
                <div
                  key={result.id}
                  className="group relative p-5 transition hover:bg-slate-50/70"
                >
                  {/* Top row */}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-2 py-1 text-[9px] font-black ${
                          result.type === "2D"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {result.type}
                      </span>

                      {result.session && (
                        <span
                          className={`rounded-md px-2 py-1 text-[9px] font-black ${
                            result.session === "AM"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {result.session}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-medium text-slate-400">
                      {result.date}
                    </span>
                  </div>

                  {/* Number */}

                  <div className="mt-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Winning Number
                    </p>

                    <div
                      className={`mt-2 inline-flex rounded-xl px-4 py-2.5 text-2xl font-black tracking-[0.18em] shadow-sm ${
                        result.type === "2D"
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                          : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      }`}
                    >
                      {result.number}
                    </div>
                  </div>

                  {/* Time */}

                  {result.time && (
                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-semibold text-slate-400">
                      <Clock3 className="h-3 w-3" />

                      {result.time}
                    </div>
                  )}

                  {/* Bottom accent */}

                  <div
                    className={`absolute inset-x-5 bottom-0 h-0.5 scale-x-0 transition group-hover:scale-x-100 ${
                      result.type === "2D" ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Mobile */}

            <div className="divide-y divide-slate-100 sm:hidden">
              {latestResults.slice(0, 3).map((result) => (
                <div key={result.id} className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* Type */}

                    <div className="w-12 shrink-0">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[9px] font-black ${
                          result.type === "2D"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {result.type}
                      </span>

                      {result.session && (
                        <span
                          className={`mt-1 inline-flex rounded-md px-2 py-1 text-[8px] font-black ${
                            result.session === "AM"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {result.session}
                        </span>
                      )}
                    </div>

                    {/* Number */}

                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        Winning Number
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-lg px-3 py-1.5 text-xl font-black tracking-[0.15em] ${
                          result.type === "2D"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {result.number}
                      </span>
                    </div>

                    {/* Date / time */}

                    <div className="shrink-0 text-right">
                      {result.time && (
                        <div className="flex items-center justify-end gap-1 text-[9px] font-semibold text-slate-500">
                          <Clock3 className="h-3 w-3" />

                          {result.time}
                        </div>
                      )}

                      {result.date && (
                        <div className="mt-1 flex items-center justify-end gap-1 text-[8px] text-slate-400">
                          <CalendarDays className="h-3 w-3" />

                          {result.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Trophy className="h-5 w-5" />
            </div>

            <p className="mt-3 text-xs font-bold text-slate-600">
              No published results yet
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Results will appear here after the lottery draw is published.
            </p>
          </div>
        )}

        {/* FOOTER */}

        {latestResults.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                <CalendarDays className="h-3 w-3" />
                Latest available lottery results
              </div>

              <Link
                to="/player/results-history"
                className="text-[9px] font-bold text-slate-500 transition hover:text-emerald-600"
              >
                Results History →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          LATEST WINNERS
      ======================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
              <Trophy className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                Latest Winners
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                Recent winning tickets
              </p>
            </div>
          </div>

          <Link
            to="/player/results-history"
            className="group inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-50"
          >
            View Results
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* WINNERS */}

        {latestWinners.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {latestWinners.map((winner, index) => (
              <div
                key={winner.id}
                className="group px-4 py-3.5 transition hover:bg-slate-50/70 sm:px-5"
              >
                {/* Desktop */}

                <div className="hidden items-center gap-4 sm:flex">
                  {/* Rank */}

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      index === 0
                        ? "bg-amber-100 text-amber-600"
                        : index === 1
                          ? "bg-slate-100 text-slate-500"
                          : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Player */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-900">
                      {winner.player}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                      <span
                        className={`font-bold ${
                          winner.type === "2D"
                            ? "text-emerald-600"
                            : "text-blue-600"
                        }`}
                      >
                        {winner.type}
                      </span>

                      {winner.session && (
                        <>
                          <span>•</span>

                          <span>{winner.session}</span>
                        </>
                      )}

                      {winner.date && (
                        <>
                          <span>•</span>

                          <span>{winner.date}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Number */}

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-3 py-1.5 text-sm font-black tracking-[0.16em] ${
                        winner.type === "2D"
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                          : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      }`}
                    >
                      {winner.number}
                    </span>

                    {winner.session && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[8px] font-bold text-slate-500">
                        {winner.session}
                      </span>
                    )}
                  </div>

                  {/* Prize */}

                  <div className="w-32 shrink-0 text-right">
                    <p className="text-xs font-black text-amber-600">
                      +{formatMoney(winner.prize)}
                    </p>

                    <p className="mt-0.5 text-[8px] font-bold text-slate-400">
                      MMK
                    </p>
                  </div>
                </div>

                {/* Mobile */}

                <div className="flex items-center gap-3 sm:hidden">
                  {/* Rank */}

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      index === 0
                        ? "bg-amber-100 text-amber-600"
                        : index === 1
                          ? "bg-slate-100 text-slate-500"
                          : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Player */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-900">
                      {winner.player}
                    </p>

                    <p className="mt-1 truncate text-[9px] text-slate-400">
                      <span
                        className={
                          winner.type === "2D"
                            ? "font-bold text-emerald-600"
                            : "font-bold text-blue-600"
                        }
                      >
                        {winner.type}
                      </span>

                      {winner.session ? ` · ${winner.session}` : ""}

                      {winner.date ? ` · ${winner.date}` : ""}
                    </p>
                  </div>

                  {/* Number / prize */}

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-black tracking-[0.14em] ${
                        winner.type === "2D"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {winner.number}
                    </span>

                    <p className="mt-1 text-[10px] font-black text-amber-600">
                      +{formatMoney(winner.prize)} MMK
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>

            <p className="mt-3 text-xs font-bold text-slate-600">
              No winners yet
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Winning tickets will appear here after a result is processed.
            </p>
          </div>
        )}

        {/* FOOTER */}

        {latestWinners.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] text-slate-400 sm:text-[10px]">
                Showing the 3 latest winners
              </p>

              <Link
                to="/player/results-history"
                className="text-[9px] font-bold text-slate-500 transition hover:text-emerald-600 sm:text-[10px]"
              >
                View all results →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
