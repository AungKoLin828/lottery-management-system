import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dice5,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

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

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  if (!value) return "—";

  /*
   * Handles:
   * 10:30
   * 10:30:00
   * 2026-09-04T10:30:00
   */
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const parts = value.split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const suffix = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getSessionLabel = (draw: LatestDraw) => {
  if (draw.type === "3D") return "3D";
  return draw.session ? `2D ${draw.session}` : "2D";
};

const getWinnerSessionLabel = (winner: Winner) => {
  if (winner.type === "3D") return "3D";
  return winner.session ? `2D ${winner.session}` : "2D";
};

/* ============================================================
   RESULT CARD
============================================================ */

function ResultCard({ draw }: { draw: LatestDraw }) {
  const is3D = draw.type === "3D";
  const isAM = draw.session === "AM";

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              is3D
                ? "bg-blue-50 text-blue-600"
                : isAM
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-orange-50 text-orange-600",
            ].join(" ")}
          >
            <Dice5 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {getSessionLabel(draw)}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">Latest result</p>
          </div>
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            is3D
              ? "bg-blue-50 text-blue-600"
              : isAM
                ? "bg-emerald-50 text-emerald-600"
                : "bg-orange-50 text-orange-600",
          ].join(" ")}
        >
          {draw.type}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">Winning Number</p>

          <div className="mt-2 flex h-14 items-center rounded-xl bg-slate-50 px-5">
            <span
              className={[
                "font-mono font-bold tracking-[0.18em] text-slate-900",
                is3D ? "text-2xl" : "text-3xl",
              ].join(" ")}
            >
              {draw.number}
            </span>
          </div>
        </div>

        <div className="pb-1 text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{formatTime(draw.time)}</span>
          </div>

          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(draw.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WINNER ROW
============================================================ */

function WinnerRow({ winner, rank }: { winner: Winner; rank: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-slate-100/70">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-600 shadow-sm">
        {rank}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
          <UserRound className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {winner.player || "Player"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            <span>{getWinnerSessionLabel(winner)}</span>

            {winner.date && (
              <>
                <span className="text-slate-300">•</span>
                <span>{formatDate(winner.date)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="inline-flex rounded-lg bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-slate-900 shadow-sm">
          {winner.number}
        </div>

        <p className="mt-1 text-xs font-semibold text-emerald-600">
          +{formatMoney(winner.prize)}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY RESULT
============================================================ */

function EmptyResults() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <div>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
          <Trophy className="h-5 w-5" />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-700">
          No results available
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Latest lottery results will appear here.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-5 h-6 w-40 animate-pulse rounded bg-slate-100" />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function PlayerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================================================
     LOAD DASHBOARD
  ============================================================ */

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

      const result = (await response.json()) as DashboardResponse;

      console.log("Dashboard API response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      if (!result.user) {
        console.error("Dashboard response does not contain user:", result);

        throw new Error("Dashboard user data is unavailable");
      }

      if (!result.stats) {
        console.error("Dashboard response does not contain stats:", result);

        throw new Error("Dashboard statistics are unavailable");
      }

      /* ========================================================
         NORMALIZE LATEST RESULTS
      ======================================================== */

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

      /* ========================================================
         FALLBACK TO latestDraw
      ======================================================== */

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

      /* ========================================================
         NORMALIZE WINNERS
      ======================================================== */

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

      /* ========================================================
         NORMALIZED DATA
      ======================================================== */

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

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* ============================================================
     DISPLAY NAME
  ============================================================ */

  const displayName = useMemo(() => {
    if (!data?.user) return "Player";

    return data.user.fullName?.trim() || data.user.username || "Player";
  }, [data]);

  /* ============================================================
     LATEST RESULTS
     
     Always display:
       1. 2D AM
       2. 2D PM
       3. 3D
  ============================================================ */

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

  /* ============================================================
     LATEST WINNERS
  ============================================================ */

  const latestWinners = useMemo(() => {
    return (data?.winners ?? []).slice(0, 3);
  }, [data]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50/60 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error || !data) {
    return (
      <div className="min-h-full bg-slate-50/60 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error || "Something went wrong while loading your dashboard."}
            </p>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     DASHBOARD
  ============================================================ */

  return (
    <div className="min-h-full bg-slate-50/60 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ======================================================
            WELCOME
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
          {/* Decorative background shapes */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-emerald-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Player
                </span>

                {data.user.isVerified && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                    Verified
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back, {displayName}
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                Ready to play? Choose your game and check the latest winning
                numbers.
              </p>
            </div>

            <Link
              to="/player/results-history"
              className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:self-center"
            >
              Results History
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* ======================================================
            QUICK PLAY
        ====================================================== */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Play</h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Choose a lottery game to start
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* 2D */}
            <Link
              to="/player/play-2d"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Dice5 className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Play 2D
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      AM &amp; PM sessions
                    </p>
                  </div>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  00 — 99
                </span>

                <span className="text-xs text-slate-400">
                  Two-digit lottery
                </span>
              </div>
            </Link>

            {/* 3D */}
            <Link
              to="/player/play-3d"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Dice5 className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Play 3D
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Three-digit lottery
                    </p>
                  </div>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                  000 — 999
                </span>

                <span className="text-xs text-slate-400">
                  Three-digit lottery
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ======================================================
            LATEST RESULTS
        ====================================================== */}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Latest Results
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Most recent winning numbers
              </p>
            </div>

            <Link
              to="/player/results-history"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {latestResults.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {latestResults.map((draw) => (
                <ResultCard key={draw.id} draw={draw} />
              ))}
            </div>
          ) : (
            <EmptyResults />
          )}
        </section>

        {/* ======================================================
            LATEST WINNERS
        ====================================================== */}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Trophy className="h-4 w-4" />
                </div>

                <h2 className="text-base font-bold text-slate-900">
                  Latest Winners
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Recent winning players
              </p>
            </div>
          </div>

          {latestWinners.length > 0 ? (
            <div className="space-y-2.5">
              {latestWinners.map((winner, index) => (
                <WinnerRow key={winner.id} winner={winner} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
              <div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                  <Trophy className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No winners yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Winning players will appear here.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
