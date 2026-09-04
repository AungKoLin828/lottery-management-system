import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  Dice5,
  Gamepad2,
  Medal,
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

function formatDate(date: string): string {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const value = name.trim();

  if (!value) {
    return "P";
  }

  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function maskPlayerName(name: string): string {
  if (!name) {
    return "Player";
  }

  const trimmed = name.trim();

  if (trimmed.length <= 2) {
    return `${trimmed[0] ?? "P"}***`;
  }

  if (trimmed.length <= 5) {
    return `${trimmed.slice(0, 2)}***`;
  }

  return `${trimmed.slice(0, 3)}***`;
}

function normalizeNumber(value: string, type: "2D" | "3D"): string {
  const length = type === "2D" ? 2 : 3;

  return String(value ?? "")
    .replace(/\D/g, "")
    .padStart(length, "0")
    .slice(-length);
}

function getResultLabel(draw: LatestDraw): string {
  if (draw.type === "3D") {
    return "3D";
  }

  return draw.session === "AM" ? "2D AM" : "2D PM";
}

/* ============================================================
   NUMBER BALL
============================================================ */

function NumberBall({
  value,
  size = "normal",
}: {
  value: string;
  size?: "small" | "normal" | "large";
}) {
  const sizeClass =
    size === "small"
      ? "h-8 w-8 text-[11px]"
      : size === "large"
        ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl"
        : "h-14 w-14 text-lg";

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center rounded-full",
        "border border-white/15 bg-white/[0.08]",
        "font-black tracking-tight text-white",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        "before:absolute before:inset-[5px] before:rounded-full",
        "before:border before:border-white/[0.08]",
        sizeClass,
      ].join(" ")}
    >
      <span className="relative z-10">{value}</span>
    </div>
  );
}

/* ============================================================
   RESULT CARD
============================================================ */

function ResultCard({
  draw,
  featured = false,
}: {
  draw: LatestDraw;
  featured?: boolean;
}) {
  const number = normalizeNumber(draw.number, draw.type);
  const label = getResultLabel(draw);

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[24px] border",
        "transition-all duration-300",
        featured
          ? "border-emerald-400/30 bg-[#10251f]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl",
      ].join(" ")}
    >
      {featured && (
        <>
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />
        </>
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                  featured
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-slate-900 text-white",
                ].join(" ")}
              >
                {draw.type}
              </span>

              {draw.session && (
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    featured
                      ? "bg-white/10 text-white/70"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {draw.session}
                </span>
              )}
            </div>

            <p
              className={[
                "mt-2 text-xs font-medium",
                featured ? "text-white/50" : "text-slate-400",
              ].join(" ")}
            >
              {label}
            </p>
          </div>

          {featured && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <Sparkles size={15} />
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center">
          <div
            className={[
              "relative flex items-center justify-center rounded-2xl px-6 py-4",
              featured ? "bg-black/20" : "bg-slate-50",
            ].join(" ")}
          >
            <span
              className={[
                "font-black tracking-[0.16em]",
                featured
                  ? "text-3xl text-white sm:text-4xl"
                  : "text-3xl text-slate-900",
              ].join(" ")}
            >
              {number}
            </span>
          </div>
        </div>

        <div
          className={[
            "mt-4 flex items-center justify-between text-[11px]",
            featured ? "text-white/40" : "text-slate-400",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={12} />
            {formatDate(draw.date)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} />
            {draw.time || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   QUICK PLAY CARD
============================================================ */

function QuickPlayCard({
  type,
  title,
  subtitle,
  example,
  href,
  icon,
}: {
  type: "2D" | "3D";
  title: string;
  subtitle: string;
  example: string;
  href: string;
  icon: React.ReactNode;
}) {
  const is2D = type === "2D";

  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101923] p-5 text-white shadow-[0_18px_50px_rgba(2,8,23,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(2,8,23,0.25)] sm:p-6"
    >
      {/* Decorative circles */}
      <div
        className={[
          "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-[1px]",
          is2D ? "bg-emerald-400/10" : "bg-indigo-400/10",
        ].join(" ")}
      />

      <div
        className={[
          "absolute -bottom-16 -left-12 h-36 w-36 rounded-full",
          "border border-white/[0.04]",
        ].join(" ")}
      />

      <div className="absolute right-5 top-5 flex gap-1.5 opacity-50">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              is2D
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-indigo-400/10 text-indigo-300",
            ].join(" ")}
          >
            {icon}
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
            Play now
          </span>
        </div>

        <div className="mt-6">
          <div className="flex items-end gap-3">
            <h3 className="text-2xl font-black tracking-tight">{title}</h3>

            <span className="mb-0.5 text-xs font-semibold text-white/35">
              {subtitle}
            </span>
          </div>

          <p className="mt-2 max-w-[260px] text-sm leading-6 text-white/50">
            Pick your lucky number and place your {type} bet.
          </p>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              Lucky format
            </p>

            <p className="mt-1 text-2xl font-black tracking-[0.22em] text-white/80">
              {example}
            </p>
          </div>

          <div
            className={[
              "flex h-11 w-11 items-center justify-center rounded-full",
              "border border-white/10 bg-white/5",
              "transition-transform duration-300 group-hover:translate-x-1",
            ].join(" ")}
          >
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   WINNER ROW
============================================================ */

function WinnerRow({ winner, rank }: { winner: Winner; rank: number }) {
  const number = normalizeNumber(winner.number, winner.type);

  const rankIcon =
    rank === 1 ? (
      <Crown size={15} />
    ) : rank === 2 ? (
      <Medal size={15} />
    ) : (
      <Trophy size={15} />
    );

  return (
    <div
      className={[
        "group flex items-center gap-3 rounded-2xl border p-3 transition-all",
        rank === 1
          ? "border-amber-200 bg-amber-50/70"
          : "border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          rank === 1
            ? "bg-amber-100 text-amber-600"
            : "bg-white text-slate-400 shadow-sm",
        ].join(" ")}
      >
        {rankIcon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-800">
            {maskPlayerName(winner.player)}
          </p>

          <span className="hidden rounded-full bg-slate-200/70 px-2 py-0.5 text-[9px] font-bold text-slate-500 sm:inline-flex">
            #{rank}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
          <span className="font-semibold">
            {winner.type}
            {winner.session ? ` ${winner.session}` : ""}
          </span>

          <span>•</span>

          <span>{formatDate(winner.date)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5">
          <span className="text-xs font-black tracking-widest text-white">
            {number}
          </span>
        </div>

        <p className="mt-1 text-[10px] font-black text-emerald-600">
          +{formatMoney(winner.prize)}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f7f8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-40 rounded-[28px] bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56 rounded-[28px] bg-slate-200" />
          <div className="h-56 rounded-[28px] bg-slate-200" />
        </div>

        <div className="h-80 rounded-[28px] bg-slate-200" />

        <div className="h-64 rounded-[28px] bg-slate-200" />
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY RESULTS
============================================================ */

function EmptyResults() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <Dice5 size={22} />
      </div>

      <p className="mt-3 text-sm font-bold text-slate-600">
        No results available yet
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Latest winning numbers will appear here.
      </p>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

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
     LATEST FEATURED RESULT
  ========================================================== */

  const featuredResult = useMemo(() => {
    if (latestResults.length === 0) {
      return null;
    }

    return latestResults[latestResults.length - 1];
  }, [latestResults]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !data) {
    return (
      <div className="min-h-full bg-[#f5f7f8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <RefreshCw size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-red-700">
                    Unable to load dashboard
                  </p>

                  <p className="mt-0.5 text-xs text-red-500">
                    Something went wrong while loading your dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm text-slate-500">{error}</p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="min-h-full bg-[#f5f7f8] px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* ====================================================
            WELCOME HERO
        ==================================================== */}

        <section className="relative overflow-hidden rounded-[30px] bg-[#0b151d] shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          {/* Background decoration */}
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-emerald-300/10" />
          <div className="absolute -right-5 -top-10 h-40 w-40 rounded-full border border-emerald-300/[0.07]" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-emerald-400/[0.04] blur-2xl" />

          <div className="absolute right-[18%] top-8 hidden gap-2 opacity-30 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
          </div>

          <div className="relative flex flex-col gap-7 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-300/[0.06] px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  Player Lobby
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Welcome back,{" "}
                <span className="text-emerald-300">{displayName}</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                Ready to try your luck? Choose a game, pick your numbers, and
                play your way.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/player/play-2d"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-[#07130f] transition hover:bg-emerald-300"
                >
                  <Zap size={14} />
                  Play 2D
                </Link>

                <Link
                  to="/player/play-3d"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  <Dice5 size={14} />
                  Play 3D
                </Link>
              </div>
            </div>

            {/* Featured latest number */}
            <div className="relative shrink-0">
              {featuredResult ? (
                <div className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                      Latest draw
                    </p>

                    <p className="mt-1 text-sm font-bold text-white/70">
                      {getResultLabel(featuredResult)}
                    </p>
                  </div>

                  <NumberBall
                    value={normalizeNumber(
                      featuredResult.number,
                      featuredResult.type,
                    )}
                    size="large"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Dice5 size={30} className="text-white/20" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            QUICK PLAY
        ==================================================== */}

        <section>
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 size={16} className="text-emerald-600" />

                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  Quick Play
                </h2>
              </div>

              <p className="mt-0.5 text-xs text-slate-400">
                Pick a game and start your lucky run
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QuickPlayCard
              type="2D"
              title="2D"
              subtitle="Two Digits"
              example="00 — 99"
              href="/player/play-2d"
              icon={<Dice5 size={22} />}
            />

            <QuickPlayCard
              type="3D"
              title="3D"
              subtitle="Three Digits"
              example="000 — 999"
              href="/player/play-3d"
              icon={<Sparkles size={22} />}
            />
          </div>
        </section>

        {/* ====================================================
            RESULTS BOARD
        ==================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-emerald-300">
                    <Trophy size={15} />
                  </div>

                  <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                    Latest Results
                  </h2>

                  <span className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 sm:inline-flex">
                    Live Board
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Check the latest winning numbers
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh dashboard"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin" : undefined}
                  />
                </button>

                <Link
                  to="/player/results-history"
                  className="hidden items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-900 sm:flex"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {latestResults.length === 0 ? (
              <EmptyResults />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {latestResults.slice(0, 3).map((draw, index) => (
                  <ResultCard
                    key={draw.id}
                    draw={draw}
                    featured={Boolean(
                      featuredResult && draw.id === featuredResult.id,
                    )}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 sm:hidden">
              <Link
                to="/player/results-history"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
              >
                View complete results
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            WINNERS
        ==================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Crown size={15} />
                </div>

                <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                  Latest Winners
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Players who hit the lucky numbers
              </p>
            </div>

            <div className="hidden items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-600 sm:flex">
              <Sparkles size={12} />
              Top 3
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {latestWinners.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <Trophy size={22} />
                </div>

                <p className="mt-3 text-sm font-bold text-slate-600">
                  No winners yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Winners will appear here after results are published.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {latestWinners.map((winner, index) => (
                  <WinnerRow key={winner.id} winner={winner} rank={index + 1} />
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-medium text-slate-400">
                Your lucky number could be next.
              </p>

              <Link
                to="/player/play-2d"
                className="ml-2 inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700"
              >
                Play now
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            BOTTOM CTA
        ==================================================== */}

        <section className="relative overflow-hidden rounded-[24px] bg-[#101923] px-5 py-5 sm:px-6">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-400/[0.03]" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Zap size={18} />
              </div>

              <div>
                <p className="text-sm font-black text-white">Feeling lucky?</p>

                <p className="mt-0.5 text-xs text-white/35">
                  Choose your numbers and make your next play.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to="/player/play-2d"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-[#07130f] transition hover:bg-emerald-300"
              >
                2D
                <ArrowRight size={13} />
              </Link>

              <Link
                to="/player/play-3d"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
              >
                3D
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        <div className="h-2" />
      </div>
    </div>
  );
}
