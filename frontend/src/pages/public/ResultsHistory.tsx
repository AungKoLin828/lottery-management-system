import { useMemo, useState } from "react";

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

   2D:
   - Morning
   - Evening
   - Result
   - Set
   - Value
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

   IMPORTANT:
   3D is completely independent from 2D.

   3D:
   - No Morning
   - No Evening
   - No Set
   - No Value
   - One winning number
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
  /* ==========================================================
     TAB
     ========================================================== */

  const [activeTab, setActiveTab] =
    useState<ResultTab>("2D");

  /* ==========================================================
     COMMON FILTERS
     ========================================================== */

  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  /* ==========================================================
     2D FILTER
     ========================================================== */

  const [session, setSession] =
    useState<"All" | DrawSession>("All");

  /* ==========================================================
     PAGINATION
     ========================================================== */

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 8;

  /* ==========================================================
     FORMAT DATE
     ========================================================== */

  const formatDate = (date: string) => {
    return new Date(
      `${date}T00:00:00`,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ==========================================================
     CHANGE TAB
     ========================================================== */

  const handleTabChange = (
    tab: ResultTab,
  ) => {
    setActiveTab(tab);
    setCurrentPage(1);

    /* Reset search filters when switching
       result type for a cleaner experience. */

    setSearch("");
    setFromDate("");
    setToDate("");
    setSession("All");
  };

  /* ==========================================================
     SEARCH CHANGE
     ========================================================== */

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /* ==========================================================
     SESSION CHANGE
     ========================================================== */

  const handleSessionChange = (
    value: "All" | DrawSession,
  ) => {
    setSession(value);
    setCurrentPage(1);
  };

  /* ==========================================================
     FROM DATE CHANGE
     ========================================================== */

  const handleFromDateChange = (
    value: string,
  ) => {
    setFromDate(value);
    setCurrentPage(1);
  };

  /* ==========================================================
     TO DATE CHANGE
     ========================================================== */

  const handleToDateChange = (
    value: string,
  ) => {
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

  const filteredResults2D =
    useMemo(() => {
      return mockResults2D.filter(
        (item) => {
          const searchValue =
            search.trim().toLowerCase();

          const matchesSearch =
            searchValue === "" ||
            item.result
              .toLowerCase()
              .includes(searchValue) ||
            item.date
              .toLowerCase()
              .includes(searchValue);

          const matchesSession =
            session === "All" ||
            item.session === session;

          const matchesFromDate =
            fromDate === "" ||
            item.date >= fromDate;

          const matchesToDate =
            toDate === "" ||
            item.date <= toDate;

          return (
            matchesSearch &&
            matchesSession &&
            matchesFromDate &&
            matchesToDate
          );
        },
      );
    }, [
      search,
      session,
      fromDate,
      toDate,
    ]);

  /* ==========================================================
     FILTER 3D
     ========================================================== */

  const filteredResults3D =
    useMemo(() => {
      return mockResults3D.filter(
        (item) => {
          const searchValue =
            search.trim().toLowerCase();

          const matchesSearch =
            searchValue === "" ||
            item.result
              .toLowerCase()
              .includes(searchValue) ||
            item.date
              .toLowerCase()
              .includes(searchValue);

          const matchesFromDate =
            fromDate === "" ||
            item.date >= fromDate;

          const matchesToDate =
            toDate === "" ||
            item.date <= toDate;

          return (
            matchesSearch &&
            matchesFromDate &&
            matchesToDate
          );
        },
      );
    }, [
      search,
      fromDate,
      toDate,
    ]);

  /* ==========================================================
     ACTIVE RESULTS
     ========================================================== */

  const activeResults =
    activeTab === "2D"
      ? filteredResults2D
      : filteredResults3D;

  /* ==========================================================
     PAGINATION
     ========================================================== */

  const totalPages = Math.ceil(
    activeResults.length /
      itemsPerPage,
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginatedResults =
    activeResults.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

  /* ==========================================================
     UI
     ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">

            <p className="text-sm font-medium text-blue-100 mb-2">
              Lottery Results
            </p>

            <h1 className="text-3xl md:text-4xl font-bold">
              Results History
            </h1>

            <p className="mt-2 text-blue-100">
              View previous 2D and 3D lottery results.
            </p>

          </div>
      </section>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ===================================================
            RESULT TYPE TABS
            =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-2 mb-6">

          <div className="grid grid-cols-2 gap-2">

            {/* 2D TAB */}

            <button
              type="button"
              onClick={() =>
                handleTabChange("2D")
              }
              className={`
                flex items-center justify-center
                gap-3 px-5 py-4
                rounded-lg
                font-semibold
                transition
                ${
                  activeTab === "2D"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >

              <span
                className={`
                  w-9 h-9
                  rounded-lg
                  flex items-center justify-center
                  text-sm font-bold
                  ${
                    activeTab === "2D"
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }
                `}
              >
                2D
              </span>

              <span>
                2D Results
              </span>

            </button>

            {/* 3D TAB */}

            <button
              type="button"
              onClick={() =>
                handleTabChange("3D")
              }
              className={`
                flex items-center justify-center
                gap-3 px-5 py-4
                rounded-lg
                font-semibold
                transition
                ${
                  activeTab === "3D"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >

              <span
                className={`
                  w-9 h-9
                  rounded-lg
                  flex items-center justify-center
                  text-sm font-bold
                  ${
                    activeTab === "3D"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }
                `}
              >
                3D
              </span>

              <span>
                3D Results
              </span>

            </button>

          </div>

        </div>

        {/* ===================================================
            FILTER CARD
            =================================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">

          <div
            className="flex flex-col md:flex-row
                       md:items-center
                       md:justify-between
                       gap-4 mb-5"
          >

            <div>

              <h2 className="text-xl font-bold text-gray-800">
                Search {activeTab} Results
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {activeTab === "2D"
                  ? "Search and filter previous 2D results."
                  : "Search and filter previous 3D results."}
              </p>

            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2
                         border border-gray-300
                         rounded-lg
                         text-sm font-medium
                         text-gray-700
                         hover:bg-gray-100"
            >
              Clear Filters
            </button>

          </div>

          {/* FILTERS */}

          <div
            className={`
              grid
              grid-cols-1
              sm:grid-cols-2
              ${
                activeTab === "2D"
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-3"
              }
              gap-4
            `}
          >

            {/* SEARCH */}

            <div>

              <label
                htmlFor="result-search"
                className="block text-sm font-medium
                           text-gray-700 mb-1"
              >
                Search
              </label>

              <input
                id="result-search"
                type="text"
                value={search}
                onChange={(e) =>
                  handleSearchChange(
                    e.target.value,
                  )
                }
                placeholder="Number or date"
                className="
                  w-full
                  border border-gray-300
                  rounded-lg
                  px-3 py-2.5
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>

            {/* SESSION — 2D ONLY */}

            {activeTab === "2D" && (
              <div>

                <label
                  htmlFor="session"
                  className="block text-sm font-medium
                             text-gray-700 mb-1"
                >
                  Session
                </label>

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
                  className="
                    w-full
                    border border-gray-300
                    rounded-lg
                    px-3 py-2.5
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
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
            )}

            {/* FROM DATE */}

            <div>

              <label
                htmlFor="from-date"
                className="block text-sm font-medium
                           text-gray-700 mb-1"
              >
                From Date
              </label>

              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) =>
                  handleFromDateChange(
                    e.target.value,
                  )
                }
                className="
                  w-full
                  border border-gray-300
                  rounded-lg
                  px-3 py-2.5
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>

            {/* TO DATE */}

            <div>

              <label
                htmlFor="to-date"
                className="block text-sm font-medium
                           text-gray-700 mb-1"
              >
                To Date
              </label>

              <input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) =>
                  handleToDateChange(
                    e.target.value,
                  )
                }
                className="
                  w-full
                  border border-gray-300
                  rounded-lg
                  px-3 py-2.5
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            RESULT SUMMARY
            =================================================== */}

        <div
          className="flex flex-col sm:flex-row
                     sm:items-center
                     sm:justify-between
                     gap-3 mb-4"
        >

          <div>

            <p className="text-sm text-gray-500">

              Showing{" "}

              <span className="font-semibold text-gray-700">
                {activeResults.length}
              </span>{" "}

              {activeTab} result
              {activeResults.length !== 1
                ? "s"
                : ""}

            </p>

          </div>

          <div>

            <span
              className={`
                inline-flex
                px-3 py-1
                rounded-full
                text-xs
                font-semibold
                ${
                  activeTab === "2D"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                }
              `}
            >
              {activeTab} Results
            </span>

          </div>

        </div>

        {/* ===================================================
            2D TABLE
            =================================================== */}

        {activeTab === "2D" && (
          <div
            className="bg-white rounded-xl
                       shadow-sm border
                       overflow-hidden"
          >

            <div className="overflow-x-auto">

              <table
                className="w-full
                           min-w-[800px]"
              >

                <thead>

                  <tr
                    className="bg-blue-50
                               border-b
                               border-blue-100"
                  >

                    <th className="px-5 py-4 text-left
                                   text-sm font-semibold
                                   text-gray-700">
                      #
                    </th>

                    <th className="px-5 py-4 text-left
                                   text-sm font-semibold
                                   text-gray-700">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left
                                   text-sm font-semibold
                                   text-gray-700">
                      Session
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      Winning Number
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      Set
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      Value
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedResults.length > 0 ? (

                    paginatedResults.map(
                      (item, index) => {

                        const result =
                          item as LotteryResult2D;

                        return (
                          <tr
                            key={result.id}
                            className="
                              border-b
                              last:border-b-0
                              hover:bg-gray-50
                            "
                          >

                            <td className="px-5 py-4
                                           text-sm
                                           text-gray-600">
                              {startIndex +
                                index +
                                1}
                            </td>

                            <td className="px-5 py-4
                                           text-sm
                                           font-medium
                                           text-gray-800">
                              {formatDate(
                                result.date,
                              )}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`
                                  inline-flex
                                  px-3 py-1
                                  rounded-full
                                  text-xs
                                  font-semibold
                                  ${
                                    result.session ===
                                    "Morning"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-indigo-100 text-indigo-700"
                                  }
                                `}
                              >
                                {result.session}
                              </span>

                            </td>

                            <td className="px-5 py-4
                                           text-center">

                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  justify-center
                                  w-12 h-12
                                  rounded-full
                                  text-lg font-bold
                                  ${
                                    result.session ===
                                    "Morning"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-indigo-100 text-indigo-700"
                                  }
                                `}
                              >
                                {result.result}
                              </span>

                            </td>

                            <td className="px-5 py-4
                                           text-center
                                           text-sm
                                           font-medium
                                           text-gray-700">
                              {result.setValue}
                            </td>

                            <td className="px-5 py-4
                                           text-center
                                           text-sm
                                           font-medium
                                           text-gray-700">
                              {result.value}
                            </td>

                            <td className="px-5 py-4
                                           text-center">

                              <span
                                className="
                                  inline-flex
                                  px-3 py-1
                                  rounded-full
                                  text-xs
                                  font-semibold
                                  bg-green-100
                                  text-green-700
                                "
                              >
                                {result.status}
                              </span>

                            </td>

                          </tr>
                        );
                      },
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={7}
                        className="px-5 py-12
                                   text-center"
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

        {/* ===================================================
            3D TABLE
            =================================================== */}

        {activeTab === "3D" && (
          <div
            className="bg-white rounded-xl
                       shadow-sm border
                       overflow-hidden"
          >

            <div className="overflow-x-auto">

              <table
                className="w-full
                           min-w-[600px]"
              >

                <thead>

                  <tr
                    className="
                      bg-emerald-50
                      border-b
                      border-emerald-100
                    "
                  >

                    <th className="px-5 py-4 text-left
                                   text-sm font-semibold
                                   text-gray-700">
                      #
                    </th>

                    <th className="px-5 py-4 text-left
                                   text-sm font-semibold
                                   text-gray-700">
                      Draw Date
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      3D Winning Number
                    </th>

                    <th className="px-5 py-4 text-center
                                   text-sm font-semibold
                                   text-gray-700">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedResults.length > 0 ? (

                    paginatedResults.map(
                      (item, index) => {

                        const result =
                          item as LotteryResult3D;

                        return (
                          <tr
                            key={result.id}
                            className="
                              border-b
                              last:border-b-0
                              hover:bg-gray-50
                            "
                          >

                            <td className="px-5 py-5
                                           text-sm
                                           text-gray-600">
                              {startIndex +
                                index +
                                1}
                            </td>

                            <td className="px-5 py-5
                                           text-sm
                                           font-medium
                                           text-gray-800">
                              {formatDate(
                                result.date,
                              )}
                            </td>

                            <td className="px-5 py-5
                                           text-center">

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  justify-center
                                  min-w-20
                                  h-14
                                  px-4
                                  rounded-xl
                                  bg-emerald-100
                                  text-emerald-700
                                  text-2xl
                                  font-bold
                                  tracking-widest
                                "
                              >
                                {result.result}
                              </span>

                            </td>

                            <td className="px-5 py-5
                                           text-center">

                              <span
                                className="
                                  inline-flex
                                  px-3 py-1
                                  rounded-full
                                  text-xs
                                  font-semibold
                                  bg-green-100
                                  text-green-700
                                "
                              >
                                {result.status}
                              </span>

                            </td>

                          </tr>
                        );
                      },
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-5 py-12
                                   text-center"
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

        {/* ===================================================
            PAGINATION
            =================================================== */}

        {totalPages > 1 && (

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-center
              gap-2
              mt-6
            "
          >

            {/* Previous */}

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      page - 1,
                      1,
                    ),
                )
              }
              className="
                px-4 py-2
                border
                rounded-lg
                text-sm
                font-medium
                disabled:opacity-40
                disabled:cursor-not-allowed
                hover:bg-gray-100
              "
            >
              Previous
            </button>

            {/* Page Numbers */}

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1,
            ).map((page) => (

              <button
                key={page}
                type="button"
                onClick={() =>
                  setCurrentPage(page)
                }
                className={`
                  min-w-10
                  px-3 py-2
                  rounded-lg
                  text-sm
                  font-medium
                  ${
                    currentPage === page
                      ? activeTab === "2D"
                        ? "bg-blue-600 text-white"
                        : "bg-emerald-600 text-white"
                      : "border text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {page}
              </button>

            ))}

            {/* Next */}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      page + 1,
                      totalPages,
                    ),
                )
              }
              className="
                px-4 py-2
                border
                rounded-lg
                text-sm
                font-medium
                disabled:opacity-40
                disabled:cursor-not-allowed
                hover:bg-gray-100
              "
            >
              Next
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
    <div className="text-gray-400">

      <div className="text-4xl mb-3">
        🔍
      </div>

      <p className="font-medium text-gray-600">
        No results found
      </p>

      <p className="text-sm mt-1">
        Try changing your search or filters.
      </p>

    </div>
  );
}
