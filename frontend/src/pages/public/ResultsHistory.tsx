import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Hash,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type ResultTab = "2D" | "3D";

type DrawSession = "Morning" | "Evening";

interface LotteryResult2D {
  id: string;
  drawId: string;
  date: string;
  session: DrawSession | null;
  result: string;
  note: string | null;
  status: "Published" | "Pending";
  publishedAt: string | null;
}

interface LotteryResult3D {
  id: string;
  drawId: string;
  date: string;
  result: string;
  note: string | null;
  status: "Published" | "Pending";
  publishedAt: string | null;
}

/* ============================================================
   GROUPED 2D RESULT
============================================================ */

interface Grouped2DResult {
  date: string;

  morning: LotteryResult2D | null;

  evening: LotteryResult2D | null;
}

/* ============================================================
   API RESPONSE
============================================================ */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/* ============================================================
   API
============================================================ */

async function fetchResults<T>(
  type: ResultTab,
  search: string,
  fromDate: string,
  toDate: string,
  session: "All" | DrawSession,
): Promise<T[]> {
  const params = new URLSearchParams();

  params.set("type", type);

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (fromDate) {
    params.set("fromDate", fromDate);
  }

  if (toDate) {
    params.set("toDate", toDate);
  }

  if (type === "2D" && session !== "All") {
    params.set("session", session);
  }

  const response = await fetch(
    `/api/results-history?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    },
  );

  let body: ApiResponse<T[]>;

  try {
    body = (await response.json()) as ApiResponse<T[]>;
  } catch {
    throw new Error("Invalid response from results API");
  }

  if (!response.ok || !body.success) {
    throw new Error(
      body.message || "Failed to load lottery results",
    );
  }

  return body.data ?? [];
}

/* ============================================================
   PAGE
============================================================ */

export default function ResultsHistory() {
  const [activeTab, setActiveTab] = useState<ResultTab>("2D");

  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [session, setSession] = useState<
    "All" | DrawSession
  >("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [results2D, setResults2D] = useState<
    LotteryResult2D[]
  >([]);

  const [results3D, setResults3D] = useState<
    LotteryResult3D[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const itemsPerPage = 8;

  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ==========================================================
     LOAD RESULTS
  ========================================================== */

  const loadResults = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        if (activeTab === "2D") {
          const data = await fetchResults<LotteryResult2D>(
            "2D",
            search,
            fromDate,
            toDate,
            session,
          );

          if (!signal?.aborted) {
            setResults2D(data);
          }
        } else {
          const data = await fetchResults<LotteryResult3D>(
            "3D",
            search,
            fromDate,
            toDate,
            "All",
          );

          if (!signal?.aborted) {
            setResults3D(data);
          }
        }
      } catch (err) {
        if (signal?.aborted) {
          return;
        }

        console.error(
          "Failed to load lottery results:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load lottery results",
        );

        if (activeTab === "2D") {
          setResults2D([]);
        } else {
          setResults3D([]);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      activeTab,
      search,
      fromDate,
      toDate,
      session,
    ],
  );

  /* ==========================================================
     LOAD WHEN FILTER CHANGES
  ========================================================== */

  useEffect(() => {
    const controller = new AbortController();

    void loadResults(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadResults]);

  /* ==========================================================
     GROUP 2D BY DATE
     
     AM + PM become ONE ROW.
========================================================== */

  const groupedResults2D = useMemo<Grouped2DResult[]>(() => {
    const grouped = new Map<string, Grouped2DResult>();

    for (const item of results2D) {
      const existing = grouped.get(item.date);

      if (!existing) {
        grouped.set(item.date, {
          date: item.date,
          morning:
            item.session === "Morning"
              ? item
              : null,
          evening:
            item.session === "Evening"
              ? item
              : null,
        });

        continue;
      }

      if (item.session === "Morning") {
        existing.morning = item;
      }

      if (item.session === "Evening") {
        existing.evening = item;
      }
    }

    return Array.from(grouped.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [results2D]);

  /* ==========================================================
     CHANGE TAB
========================================================== */

  const handleTabChange = (tab: ResultTab) => {
    setActiveTab(tab);

    setCurrentPage(1);

    setSearch("");

    setFromDate("");

    setToDate("");

    setSession("All");

    setError("");
  };

  /* ==========================================================
     SEARCH
========================================================== */

  const handleSearchChange = (value: string) => {
    setSearch(value);

    setCurrentPage(1);
  };

  /* ==========================================================
     SESSION
========================================================== */

  const handleSessionChange = (
    value: "All" | DrawSession,
  ) => {
    setSession(value);

    setCurrentPage(1);
  };

  /* ==========================================================
     FROM DATE
========================================================== */

  const handleFromDateChange = (value: string) => {
    setFromDate(value);

    setCurrentPage(1);
  };

  /* ==========================================================
     TO DATE
========================================================== */

  const handleToDateChange = (value: string) => {
    setToDate(value);

    setCurrentPage(1);
  };

  /* ==========================================================
     CLEAR FILTERS
========================================================== */

  const clearFilters = () => {
    setSearch("");

    setSession("All");

    setFromDate("");

    setToDate("");

    setCurrentPage(1);

    setError("");
  };

  /* ==========================================================
     ACTIVE RESULT COUNT
     
     IMPORTANT:
     2D count is grouped date count.
========================================================== */

  const activeResultCount =
    activeTab === "2D"
      ? groupedResults2D.length
      : results3D.length;

  /* ==========================================================
     PAGINATION
========================================================== */

  const totalPages = Math.ceil(
    activeResultCount / itemsPerPage,
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const startIndex =
    (safeCurrentPage - 1) * itemsPerPage;

  /* ==========================================================
     PAGINATED 2D
========================================================== */

  const paginatedResults2D = useMemo(() => {
    return groupedResults2D.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [
    groupedResults2D,
    startIndex,
  ]);

  /* ==========================================================
     PAGINATED 3D
========================================================== */

  const paginatedResults3D = useMemo(() => {
    return results3D.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [
    results3D,
    startIndex,
  ]);

  /* ==========================================================
     RENDER
========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HERO
      ======================================================= */}

      <section className="w-full bg-indigo-50/40 px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-7 text-white shadow-lg shadow-indigo-200/60 sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />

          <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-violet-300/10" />

          <div className="absolute -left-16 bottom-0 h-36 w-36 rounded-full bg-indigo-300/10" />

          <div className="absolute right-20 top-10 h-20 w-20 rounded-full bg-amber-300/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-300" />

                <span>Lottery Results</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Results History
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
                Browse previous 2D and 3D lottery results,
                search winning numbers, and filter results by
                date or session.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-indigo-100">
                <span className="flex items-center gap-1">
                  <span className="text-amber-300">✓</span>
                  2D Results
                </span>

                <span className="flex items-center gap-1">
                  <span className="text-amber-300">✓</span>
                  3D Results
                </span>

                <span className="flex items-center gap-1">
                  <span className="text-amber-300">✓</span>
                  Date Search
                </span>
              </div>
            </div>

            {/* RESULT TYPE SWITCHER */}

            <div className="relative flex w-full rounded-xl bg-indigo-950/25 p-1.5 ring-1 ring-white/10 backdrop-blur-sm lg:w-auto">
              <button
                type="button"
                onClick={() => handleTabChange("2D")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all lg:min-w-[125px] ${
                  activeTab === "2D"
                    ? "bg-white text-indigo-700 shadow-md"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    activeTab === "2D"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-white/10 text-white"
                  }`}
                >
                  2D
                </span>

                <span>Results</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("3D")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all lg:min-w-[125px] ${
                  activeTab === "3D"
                    ? "bg-white text-violet-700 shadow-md"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    activeTab === "3D"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-white/10 text-white"
                  }`}
                >
                  3D
                </span>

                <span>Results</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {/* CURRENT TYPE */}

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                activeTab === "2D"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              {activeTab === "2D" ? (
                <Hash className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                {activeTab} Results
              </h2>

              <p className="text-xs text-slate-500">
                {activeTab === "2D"
                  ? "AM and PM results grouped by date"
                  : "Three-digit lottery results"}
              </p>
            </div>
          </div>

          <div
            className={`hidden rounded-full px-3 py-1.5 text-[11px] font-semibold sm:block ${
              activeTab === "2D"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-violet-100 text-violet-700"
            }`}
          >
            {activeResultCount} date
            {activeResultCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ====================================================
            FILTER CARD
        ===================================================== */}

        <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Search & Filter
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Search and filter previous {activeTab}{" "}
                  results.
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />

                Clear Filters
              </button>
            </div>
          </div>

          <div className="p-5">
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
                activeTab === "2D"
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-3"
              }`}
            >
              {/* SEARCH */}

              <div>
                <label
                  htmlFor="result-search"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Search
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="result-search"
                    type="text"
                    value={search}
                    onChange={(e) =>
                      handleSearchChange(e.target.value)
                    }
                    placeholder="Number or date"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* SESSION */}

              {activeTab === "2D" && (
                <div>
                  <label
                    htmlFor="session"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    Session
                  </label>

                  <div className="relative">
                    <select
                      id="session"
                      value={session}
                      onChange={(e) =>
                        handleSessionChange(
                          e.target.value as
                            | "All"
                            | DrawSession,
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="All">
                        All Sessions
                      </option>

                      <option value="Morning">
                        Morning
                      </option>

                      <option value="Evening">
                        Evening
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* FROM DATE */}

              <div>
                <label
                  htmlFor="from-date"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  From Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) =>
                      handleFromDateChange(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* TO DATE */}

              <div>
                <label
                  htmlFor="to-date"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  To Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) =>
                      handleToDateChange(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* RESULTS COUNT */}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {activeResultCount}
            </span>{" "}
            {activeTab === "2D" ? "date" : "result"}
            {activeResultCount !== 1 ? "s" : ""}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-indigo-500">
            <Trophy className="h-3.5 w-3.5" />

            Latest results
          </div>
        </div>

        {/* ====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <LoadingResults activeTab={activeTab} />
        ) : (
          <>
            {/* ==================================================
                2D TABLE
            ================================================== */}

            {activeTab === "2D" && (
              <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          #
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Date
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
                          AM
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          PM
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedResults2D.length > 0 ? (
                        paginatedResults2D.map(
                          (item, index) => {
                            const am = item.morning;

                            const pm = item.evening;

                            const hasAm =
                              Boolean(am);

                            const hasPm =
                              Boolean(pm);

                            const isPublished =
                              am?.status ===
                                "Published" ||
                              pm?.status ===
                                "Published";

                            return (
                              <tr
                                key={item.date}
                                className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-indigo-50/40"
                              >
                                {/* NUMBER */}

                                <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-400">
                                  {startIndex +
                                    index +
                                    1}
                                </td>

                                {/* DATE */}

                                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-700">
                                  {formatDate(
                                    item.date,
                                  )}
                                </td>

                                {/* AM */}

                                <td className="px-4 py-4 text-center">
                                  {hasAm ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="inline-flex h-11 w-12 items-center justify-center rounded-lg bg-amber-50 text-lg font-bold tracking-wide text-amber-600 ring-1 ring-amber-100">
                                        {am?.result}
                                      </span>

                                      <span className="text-[10px] font-medium text-amber-500">
                                        Morning
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-300">
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* PM */}

                                <td className="px-4 py-4 text-center">
                                  {hasPm ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="inline-flex h-11 w-12 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                                        {pm?.result}
                                      </span>

                                      <span className="text-[10px] font-medium text-indigo-500">
                                        Evening
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-300">
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* STATUS */}

                                <td className="px-4 py-4 text-center">
                                  <span
                                    className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                                      isPublished
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-amber-50 text-amber-600"
                                    }`}
                                  >
                                    {isPublished
                                      ? "Published"
                                      : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          },
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center"
                          >
                            <EmptyResults />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================================================
                3D TABLE
            ================================================== */}

            {activeTab === "3D" && (
              <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-violet-700">
                          #
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Draw Date
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-violet-700">
                          3D Winning Number
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedResults3D.length > 0 ? (
                        paginatedResults3D.map(
                          (result, index) => (
                            <tr
                              key={result.id}
                              className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-violet-50/40"
                            >
                              <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-400">
                                {startIndex +
                                  index +
                                  1}
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-700">
                                {formatDate(
                                  result.date,
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex h-11 min-w-[82px] items-center justify-center rounded-lg bg-violet-50 px-3 text-lg font-bold tracking-widest text-violet-700 ring-1 ring-violet-100">
                                  {result.result}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                                  {result.status}
                                </span>
                              </td>
                            </tr>
                          ),
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center"
                          >
                            <EmptyResults />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ====================================================
            PAGINATION
        ===================================================== */}

        {!loading && totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(page - 1, 1),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />

              Previous
            </button>

            {/* PAGES */}

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-9 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  safeCurrentPage === page
                    ? activeTab === "2D"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-violet-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}

            <button
              type="button"
              disabled={
                safeCurrentPage === totalPages
              }
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    page + 1,
                    totalPages,
                  ),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next

              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingResults({
  activeTab,
}: {
  activeTab: ResultTab;
}) {
  if (activeTab === "2D") {
    return (
      <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
        <div className="animate-pulse">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 border-b border-slate-100 px-4 py-4"
            >
              <div className="h-4 rounded bg-slate-100" />

              <div className="h-4 rounded bg-slate-100" />

              <div className="mx-auto h-11 w-12 rounded-lg bg-slate-100" />

              <div className="mx-auto h-11 w-12 rounded-lg bg-slate-100" />

              <div className="mx-auto h-5 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
      <div className="animate-pulse">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 border-b border-slate-100 px-4 py-4"
          >
            <div className="h-4 rounded bg-slate-100" />

            <div className="h-4 rounded bg-slate-100" />

            <div className="mx-auto h-11 w-20 rounded-lg bg-slate-100" />

            <div className="mx-auto h-5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50">
        <Search className="h-5 w-5 text-indigo-400" />
      </div>

      <p className="text-sm font-semibold text-slate-600">
        No results found
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Try changing your search or filters.
      </p>
    </div>
  );
}