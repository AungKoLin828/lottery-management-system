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

  const response = await fetch(`/api/results-history?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  let body: ApiResponse<T[]>;

  try {
    body = (await response.json()) as ApiResponse<T[]>;
  } catch {
    throw new Error("Invalid response from results API");
  }

  if (!response.ok || !body.success) {
    throw new Error(body.message || "Failed to load lottery results");
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

  const [session, setSession] = useState<"All" | DrawSession>("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [results2D, setResults2D] = useState<LotteryResult2D[]>([]);

  const [results3D, setResults3D] = useState<LotteryResult3D[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const itemsPerPage = 10;

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
      month: "short",
      day: "numeric",
      year: "numeric",
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

        console.error("Failed to load lottery results:", err);

        setError(
          err instanceof Error ? err.message : "Failed to load lottery results",
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
    [activeTab, search, fromDate, toDate, session],
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
  ========================================================== */

  const groupedResults2D = useMemo<Grouped2DResult[]>(() => {
    const grouped = new Map<string, Grouped2DResult>();

    for (const item of results2D) {
      const existing = grouped.get(item.date);

      if (!existing) {
        grouped.set(item.date, {
          date: item.date,
          morning: item.session === "Morning" ? item : null,
          evening: item.session === "Evening" ? item : null,
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
     FILTER HANDLERS
  ========================================================== */

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleSessionChange = (value: "All" | DrawSession) => {
    setSession(value);
    setCurrentPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setCurrentPage(1);
  };

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
     RESULT COUNT
  ========================================================== */

  const activeResultCount =
    activeTab === "2D" ? groupedResults2D.length : results3D.length;

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages = Math.ceil(activeResultCount / itemsPerPage);

  const safeCurrentPage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;

  const paginatedResults2D = useMemo(() => {
    return groupedResults2D.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedResults2D, startIndex]);

  const paginatedResults3D = useMemo(() => {
    return results3D.slice(startIndex, startIndex + itemsPerPage);
  }, [results3D, startIndex]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HERO
      ======================================================= */}

      <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-6 text-white shadow-md sm:px-7 sm:py-7">
          {/* Decorative shapes */}

          <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-violet-300/10" />

          <div className="absolute -left-14 bottom-0 h-28 w-28 rounded-full bg-indigo-300/10" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* HERO TEXT */}

            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
                <Trophy className="h-3.5 w-3.5 text-amber-300" />

                <span>Lottery Results</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Results History
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-indigo-100 sm:text-sm">
                Browse previous 2D and 3D lottery results, search winning
                numbers, and filter by date or session.
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-indigo-100">
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

            <div className="flex w-full shrink-0 rounded-lg bg-indigo-950/25 p-1 ring-1 ring-white/10 lg:w-auto">
              <button
                type="button"
                onClick={() => handleTabChange("2D")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition lg:min-w-[105px] ${
                  activeTab === "2D"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                    activeTab === "2D"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-white/10 text-white"
                  }`}
                >
                  2D
                </span>
                Results
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("3D")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition lg:min-w-[105px] ${
                  activeTab === "3D"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                    activeTab === "3D"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-white/10 text-white"
                  }`}
                >
                  3D
                </span>
                Results
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-1 sm:px-6 lg:px-8">
        {/* ====================================================
            SECTION HEADER
        ===================================================== */}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                activeTab === "2D"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              {activeTab === "2D" ? (
                <Hash className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800">
                {activeTab} Results
              </h2>

              <p className="truncate text-[11px] text-slate-500">
                {activeTab === "2D"
                  ? "AM and PM results grouped by date"
                  : "Three-digit lottery results"}
              </p>
            </div>
          </div>

          <div
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:block ${
              activeTab === "2D"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-violet-100 text-violet-700"
            }`}
          >
            {activeResultCount} {activeTab === "2D" ? "dates" : "results"}
          </div>
        </div>

        {/* ====================================================
            FILTER CARD
        ===================================================== */}

        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Search & Filter
              </h3>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Filter {activeTab} results by number, date, or session.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </button>
          </div>

          <div className="p-4">
            <div
              className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                activeTab === "2D" ? "lg:grid-cols-4" : "lg:grid-cols-3"
              }`}
            >
              {/* SEARCH */}

              <div>
                <label
                  htmlFor="result-search"
                  className="mb-1 block text-[10px] font-semibold text-slate-500"
                >
                  Search
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="result-search"
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Number or date"
                    className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* SESSION */}

              {activeTab === "2D" && (
                <div>
                  <label
                    htmlFor="session"
                    className="mb-1 block text-[10px] font-semibold text-slate-500"
                  >
                    Session
                  </label>

                  <select
                    id="session"
                    value={session}
                    onChange={(e) =>
                      handleSessionChange(e.target.value as "All" | DrawSession)
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="All">All Sessions</option>

                    <option value="Morning">Morning</option>

                    <option value="Evening">Evening</option>
                  </select>
                </div>
              )}

              {/* FROM DATE */}

              <div>
                <label
                  htmlFor="from-date"
                  className="mb-1 block text-[10px] font-semibold text-slate-500"
                >
                  From Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* TO DATE */}

              <div>
                <label
                  htmlFor="to-date"
                  className="mb-1 block text-[10px] font-semibold text-slate-500"
                >
                  To Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />

                  <input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* ====================================================
            RESULT SUMMARY
        ===================================================== */}

        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {activeResultCount}
            </span>{" "}
            {activeTab === "2D" ? "dates" : "results"}
          </p>

          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Trophy className="h-3 w-3 text-amber-500" />
            Latest first
          </div>
        </div>

        {/* ====================================================
            RESULTS
        ===================================================== */}

        {loading ? (
          <LoadingResults activeTab={activeTab} />
        ) : (
          <>
            {/* ==================================================
                2D TABLE
            ================================================== */}

            {activeTab === "2D" && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] table-fixed">
                    <colgroup>
                      <col className="w-[42px]" />
                      <col className="w-[32%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                      <col className="w-[20%]" />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          #
                        </th>

                        <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Date
                        </th>

                        <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-amber-600">
                          AM
                        </th>

                        <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                          PM
                        </th>

                        <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedResults2D.length > 0 ? (
                        paginatedResults2D.map((item, index) => {
                          const am = item.morning;

                          const pm = item.evening;

                          const isPublished =
                            am?.status === "Published" ||
                            pm?.status === "Published";

                          return (
                            <tr
                              key={item.date}
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                            >
                              {/* NUMBER */}

                              <td className="px-3 py-2.5 align-middle text-[10px] font-medium text-slate-400">
                                {startIndex + index + 1}
                              </td>

                              {/* DATE */}

                              <td className="px-3 py-2.5 align-middle">
                                <div className="flex items-center gap-2">
                                  <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500 sm:flex">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                      {formatDate(item.date)}
                                    </div>

                                    <div className="hidden text-[9px] text-slate-400 sm:block">
                                      Draw date
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* AM */}

                              <td className="px-3 py-2.5 text-center align-middle">
                                {am ? (
                                  <ResultNumber
                                    value={am.result}
                                    variant="am"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-300">
                                    —
                                  </span>
                                )}
                              </td>

                              {/* PM */}

                              <td className="px-3 py-2.5 text-center align-middle">
                                {pm ? (
                                  <ResultNumber
                                    value={pm.result}
                                    variant="pm"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-300">
                                    —
                                  </span>
                                )}
                              </td>

                              {/* STATUS */}

                              <td className="px-3 py-2.5 text-center align-middle">
                                <StatusBadge
                                  status={isPublished ? "Published" : "Pending"}
                                />
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center">
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
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] table-fixed">
                    <colgroup>
                      <col className="w-[48px]" />
                      <col className="w-[34%]" />
                      <col className="w-[32%]" />
                      <col className="w-[22%]" />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          #
                        </th>

                        <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Draw Date
                        </th>

                        <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-violet-600">
                          Winning Number
                        </th>

                        <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedResults3D.length > 0 ? (
                        paginatedResults3D.map((result, index) => (
                          <tr
                            key={result.id}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                          >
                            {/* NUMBER */}

                            <td className="px-3 py-2.5 text-[10px] font-medium text-slate-400">
                              {startIndex + index + 1}
                            </td>

                            {/* DATE */}

                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-500 sm:flex">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                </div>

                                <div>
                                  <div className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                    {formatDate(result.date)}
                                  </div>

                                  <div className="hidden text-[9px] text-slate-400 sm:block">
                                    Draw date
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* RESULT */}

                            <td className="px-3 py-2.5 text-center">
                              <span className="inline-flex h-8 min-w-[64px] items-center justify-center rounded-md bg-violet-50 px-3 text-sm font-bold tracking-[0.18em] text-violet-700 ring-1 ring-violet-100">
                                {result.result}
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-3 py-2.5 text-center">
                              <StatusBadge status={result.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center">
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
          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />

              <span className="hidden sm:inline">Previous</span>

              <span className="sm:hidden">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 min-w-7 rounded-md px-2 text-[10px] font-semibold transition ${
                      safeCurrentPage === page
                        ? activeTab === "2D"
                          ? "bg-indigo-600 text-white"
                          : "bg-violet-600 text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>

              <span className="sm:hidden">Next</span>

              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   RESULT NUMBER
============================================================ */

function ResultNumber({
  value,
  variant,
}: {
  value: string;
  variant: "am" | "pm";
}) {
  return (
    <span
      className={`inline-flex h-8 min-w-[48px] items-center justify-center rounded-md px-2 text-sm font-bold tracking-wider ${
        variant === "am"
          ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
          : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
      }`}
    >
      {value}
    </span>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }: { status: "Published" | "Pending" }) {
  const isPublished = status === "Published";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
        isPublished
          ? "bg-emerald-50 text-emerald-600"
          : "bg-amber-50 text-amber-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPublished ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />

      {status}
    </span>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingResults({ activeTab }: { activeTab: ResultTab }) {
  if (activeTab === "2D") {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="grid grid-cols-5 gap-3">
            <div className="h-2.5 rounded bg-slate-200" />
            <div className="h-2.5 rounded bg-slate-200" />
            <div className="h-2.5 rounded bg-slate-200" />
            <div className="h-2.5 rounded bg-slate-200" />
            <div className="h-2.5 rounded bg-slate-200" />
          </div>
        </div>

        <div className="animate-pulse">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
            >
              <div className="h-3 rounded bg-slate-100" />

              <div className="h-3 rounded bg-slate-100" />

              <div className="mx-auto h-8 w-12 rounded-md bg-slate-100" />

              <div className="mx-auto h-8 w-12 rounded-md bg-slate-100" />

              <div className="mx-auto h-4 w-16 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <div className="grid grid-cols-4 gap-3">
          <div className="h-2.5 rounded bg-slate-200" />
          <div className="h-2.5 rounded bg-slate-200" />
          <div className="h-2.5 rounded bg-slate-200" />
          <div className="h-2.5 rounded bg-slate-200" />
        </div>
      </div>

      <div className="animate-pulse">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
          >
            <div className="h-3 rounded bg-slate-100" />

            <div className="h-3 rounded bg-slate-100" />

            <div className="mx-auto h-8 w-16 rounded-md bg-slate-100" />

            <div className="mx-auto h-4 w-16 rounded-full bg-slate-100" />
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
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
        <Search className="h-4 w-4 text-indigo-400" />
      </div>

      <p className="text-xs font-semibold text-slate-600">No results found</p>

      <p className="mt-0.5 text-[10px] text-slate-400">
        Try changing your search or filters.
      </p>
    </div>
  );
}
