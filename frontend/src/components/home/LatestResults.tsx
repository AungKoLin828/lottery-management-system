import { Link } from "react-router-dom";

import { latest2DResults, latest3DResults } from "@/data/home/lotteryData";

export default function LatestResults() {
  const sortedLatest2DResults = [...latest2DResults].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const sessionOrder = {
      AM: 1,
      PM: 2,
    };

    return sessionOrder[a.session] - sessionOrder[b.session];
  });

  const latest3DResult = latest3DResults[0];

  return (
    <section className="w-full bg-slate-50w-full bg-purple-50/40 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-1 rounded-full bg-gradient-to-b from-purple-700 to-violet-500" />

              <h2 className="text-xl font-bold text-slate-900">
                Latest Results
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Latest published 2D and 3D lottery results
            </p>
          </div>

          <Link
            to="/results-history"
            className="inline-flex w-fit items-center rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 hover:text-purple-800"
          >
            View All
            <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {/* ==================================================
            RESULTS GRID
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* ==================================================
              2D RESULTS
          ================================================== */}

          {sortedLatest2DResults.map((item) => {
            const isMorning = item.session === "AM";

            return (
              <div
                key={`2d-${item.id}`}
                className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isMorning
                    ? "border-indigo-100 hover:border-indigo-200"
                    : "border-violet-100 hover:border-violet-200"
                }`}
              >
                {/* ==================================================
                    CARD HEADER
                ================================================== */}

                <div
                  className={`px-4 py-3 ${
                    isMorning
                      ? "border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50"
                      : "border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Session Badge */}

                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isMorning
                            ? "bg-indigo-600 text-white"
                            : "bg-violet-600 text-white"
                        }`}
                      >
                        2D {item.session}
                      </span>

                      {/* Date */}

                      <p className="mt-1.5 text-xs text-slate-400">
                        {item.date}
                      </p>

                      {/* Draw Name */}

                      <h3 className="mt-0.5 text-sm font-bold text-slate-800">
                        {isMorning ? "Morning Draw" : "Evening Draw"}
                      </h3>
                    </div>

                    {/* Published */}

                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                      ● Published
                    </span>
                  </div>
                </div>

                {/* ==================================================
                    WINNING NUMBER
                ================================================== */}

                <div className="p-5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Winning Number
                  </p>

                  <div
                    className={`mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                      isMorning
                        ? "bg-indigo-50 ring-4 ring-indigo-100"
                        : "bg-violet-50 ring-4 ring-violet-100"
                    }`}
                  >
                    <p
                      className={`text-3xl font-extrabold tracking-wider ${
                        isMorning
                          ? "text-indigo-600"
                          : "text-violet-600"
                      }`}
                    >
                      {item.result}
                    </p>
                  </div>

                  {/* Small accent */}

                  <div
                    className={`mx-auto mt-3 h-1 w-8 rounded-full ${
                      isMorning ? "bg-indigo-200" : "bg-violet-200"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* ==================================================
              3D RESULT
          ================================================== */}

          {latest3DResult && (
            <div className="group overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg">
              {/* ==================================================
                  CARD HEADER
              ================================================== */}

              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {/* 3D Badge */}

                    <span className="inline-flex rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      3D
                    </span>

                    {/* Date */}

                    <p className="mt-1.5 text-xs text-slate-400">
                      {latest3DResult.date}
                    </p>

                    {/* Draw Name */}

                    <h3 className="mt-0.5 text-sm font-bold text-slate-800">
                      3D Draw
                    </h3>
                  </div>

                  {/* Published */}

                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                    ● Published
                  </span>
                </div>
              </div>

              {/* ==================================================
                  WINNING NUMBER
              ================================================== */}

              <div className="p-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Winning Number
                </p>

                <div className="mx-auto mt-2 flex h-16 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-md shadow-purple-200/60 ring-4 ring-violet-100 transition-transform duration-200 group-hover:scale-105">
                  <p className="text-3xl font-extrabold tracking-widest text-white">
                    {latest3DResult.result}
                  </p>
                </div>

                <p className="mt-3 text-[10px] text-slate-400">
                  One winning number per 3D draw
                </p>

                {/* Small accent */}

                <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-gradient-to-r from-violet-300 to-purple-300" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}