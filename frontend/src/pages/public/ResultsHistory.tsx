import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
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
  id: number;
  date: string;
  session: DrawSession;
  result: string;
  setValue: string;
  value: string;
  status: "Published" | "Pending";
}

interface LotteryResult3D {
  id: number;
  date: string;
  result: string;
  status: "Published" | "Pending";
}

/* ============================================================
   MOCK 2D RESULTS
============================================================ */

const mockResults2D: LotteryResult2D[] = [
  {
    id: 1,
    date: "2026-08-08",
    session: "Morning",
    result: "27",
    setValue: "123.45",
    value: "67.89",
    status: "Published",
  },
  {
    id: 2,
    date: "2026-08-07",
    session: "Evening",
    result: "58",
    setValue: "456.78",
    value: "12.34",
    status: "Published",
  },
  {
    id: 3,
    date: "2026-08-07",
    session: "Morning",
    result: "14",
    setValue: "234.56",
    value: "45.67",
    status: "Published",
  },
  {
    id: 4,
    date: "2026-08-06",
    session: "Evening",
    result: "92",
    setValue: "345.67",
    value: "78.90",
    status: "Published",
  },
  {
    id: 5,
    date: "2026-08-06",
    session: "Morning",
    result: "36",
    setValue: "567.89",
    value: "23.45",
    status: "Published",
  },
  {
    id: 6,
    date: "2026-08-05",
    session: "Evening",
    result: "81",
    setValue: "678.90",
    value: "34.56",
    status: "Published",
  },
  {
    id: 7,
    date: "2026-08-05",
    session: "Morning",
    result: "45",
    setValue: "789.01",
    value: "56.78",
    status: "Published",
  },
  {
    id: 8,
    date: "2026-08-04",
    session: "Evening",
    result: "63",
    setValue: "890.12",
    value: "67.89",
    status: "Published",
  },
  {
    id: 9,
    date: "2026-08-04",
    session: "Morning",
    result: "19",
    setValue: "901.23",
    value: "78.90",
    status: "Published",
  },
  {
    id: 10,
    date: "2026-08-03",
    session: "Evening",
    result: "74",
    setValue: "112.23",
    value: "89.01",
    status: "Published",
  },
  {
    id: 11,
    date: "2026-08-03",
    session: "Morning",
    result: "08",
    setValue: "223.34",
    value: "90.12",
    status: "Published",
  },
  {
    id: 12,
    date: "2026-08-02",
    session: "Evening",
    result: "51",
    setValue: "334.45",
    value: "01.23",
    status: "Published",
  },
];

/* ============================================================
   MOCK 3D RESULTS
============================================================ */

const mockResults3D: LotteryResult3D[] = [
  {
    id: 1,
    date: "2026-08-03",
    result: "428",
    status: "Published",
  },
  {
    id: 2,
    date: "2026-07-16",
    result: "615",
    status: "Published",
  },
  {
    id: 3,
    date: "2026-07-01",
    result: "392",
    status: "Published",
  },
  {
    id: 4,
    date: "2026-06-16",
    result: "731",
    status: "Published",
  },
  {
    id: 5,
    date: "2026-06-01",
    result: "284",
    status: "Published",
  },
  {
    id: 6,
    date: "2026-05-16",
    result: "915",
    status: "Published",
  },
  {
    id: 7,
    date: "2026-05-01",
    result: "367",
    status: "Published",
  },
  {
    id: 8,
    date: "2026-04-16",
    result: "542",
    status: "Published",
  },
];

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

  const itemsPerPage = 8;

  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ==========================================================
     CHANGE RESULT TYPE
  ========================================================== */

  const handleTabChange = (tab: ResultTab) => {
    setActiveTab(tab);
    setCurrentPage(1);

    setSearch("");
    setFromDate("");
    setToDate("");
    setSession("All");
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
  };

  /* ==========================================================
     FILTER 2D
  ========================================================== */

  const filteredResults2D = useMemo(() => {
    return mockResults2D.filter((item) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        item.result.toLowerCase().includes(searchValue) ||
        item.date.toLowerCase().includes(searchValue);

      const matchesSession = session === "All" || item.session === session;

      const matchesFromDate = fromDate === "" || item.date >= fromDate;

      const matchesToDate = toDate === "" || item.date <= toDate;

      return (
        matchesSearch && matchesSession && matchesFromDate && matchesToDate
      );
    });
  }, [search, session, fromDate, toDate]);

  /* ==========================================================
     FILTER 3D
  ========================================================== */

  const filteredResults3D = useMemo(() => {
    return mockResults3D.filter((item) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        item.result.toLowerCase().includes(searchValue) ||
        item.date.toLowerCase().includes(searchValue);

      const matchesFromDate = fromDate === "" || item.date >= fromDate;

      const matchesToDate = toDate === "" || item.date <= toDate;

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [search, fromDate, toDate]);

  /* ==========================================================
     ACTIVE RESULTS
  ========================================================== */

  const activeResults =
    activeTab === "2D" ? filteredResults2D : filteredResults3D;

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages = Math.ceil(activeResults.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedResults = activeResults.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <section className="bg-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* HEADER TEXT */}

            <div>
              <p className="mb-1 text-sm font-medium text-blue-100">
                Lottery Results
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Results History
              </h1>

              <p className="mt-1.5 text-sm text-blue-100 sm:text-base">
                View previous 2D and 3D lottery results.
              </p>
            </div>

            {/* ==================================================
                RESULT TYPE SWITCHER
            =================================================== */}

            <div className="flex w-full rounded-xl bg-blue-700/50 p-1 lg:w-auto">
              <button
                type="button"
                onClick={() => handleTabChange("2D")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all lg:min-w-[120px] ${
                  activeTab === "2D"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    activeTab === "2D"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-blue-600 text-blue-100"
                  }`}
                >
                  2D
                </span>

                <span>Results</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("3D")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all lg:min-w-[120px] ${
                  activeTab === "3D"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    activeTab === "3D"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-blue-600 text-blue-100"
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ====================================================
            CURRENT RESULT TYPE
        ===================================================== */}

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                activeTab === "2D"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
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
                  ? "Morning and evening lottery results"
                  : "Three-digit lottery results"}
              </p>
            </div>
          </div>

          <div
            className={`hidden rounded-full px-3 py-1.5 text-[11px] font-semibold sm:block ${
              activeTab === "2D"
                ? "bg-blue-50 text-blue-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {activeResults.length} result
            {activeResults.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ====================================================
            FILTER CARD
        ===================================================== */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Search & Filter
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Search and filter previous {activeTab} results.
                </p>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            </div>
          </div>

          <div className="p-5">
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
                activeTab === "2D" ? "lg:grid-cols-4" : "lg:grid-cols-3"
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
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="result-search"
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Number or date"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      id="session"
                      value={session}
                      onChange={(e) =>
                        handleSessionChange(
                          e.target.value as "All" | DrawSession,
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="All">All Sessions</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
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
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            RESULTS COUNT
        ===================================================== */}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {activeResults.length}
            </span>{" "}
            {activeTab} result
            {activeResults.length !== 1 ? "s" : ""}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Trophy className="h-3.5 w-3.5" />
            Latest results
          </div>
        </div>

        {/* ====================================================
            2D TABLE
        ===================================================== */}

        {activeTab === "2D" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Session
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Winning Number
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Set
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Value
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedResults.length > 0 ? (
                    paginatedResults.map((item, index) => {
                      const result = item as LotteryResult2D;

                      const isMorning = result.session === "Morning";

                      return (
                        <tr
                          key={result.id}
                          className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-400">
                            {startIndex + index + 1}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                            {formatDate(result.date)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                                isMorning
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-indigo-50 text-indigo-600"
                              }`}
                            >
                              {result.session}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold ${
                                isMorning
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-indigo-50 text-indigo-600"
                              }`}
                            >
                              {result.result}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                            {result.setValue}
                          </td>

                          <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                            {result.value}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <EmptyResults />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================
            3D TABLE
        ===================================================== */}

        {activeTab === "3D" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Draw Date
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      3D Winning Number
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedResults.length > 0 ? (
                    paginatedResults.map((item, index) => {
                      const result = item as LotteryResult3D;

                      return (
                        <tr
                          key={result.id}
                          className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-400">
                            {startIndex + index + 1}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                            {formatDate(result.date)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex h-10 min-w-[76px] items-center justify-center rounded-lg bg-emerald-50 px-3 text-lg font-bold tracking-widest text-emerald-600">
                              {result.result}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <EmptyResults />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================
            PAGINATION
        ===================================================== */}

        {totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-9 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    currentPage === page
                      ? activeTab === "2D"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-emerald-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
   EMPTY RESULTS
============================================================ */

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <Search className="h-5 w-5 text-slate-400" />
      </div>

      <p className="text-sm font-semibold text-slate-600">No results found</p>

      <p className="mt-1 text-xs text-slate-400">
        Try changing your search or filters.
      </p>
    </div>
  );
}
