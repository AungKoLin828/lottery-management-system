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
    <section className="w-full bg-slate-50 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-purple-600" />

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Latest Results
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Latest published 2D and 3D lottery results
            </p>
          </div>

          <Link
            to="/results-history"
            className="group inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 sm:px-4 sm:text-sm"
          >
            View All
            <span className="text-base leading-none transition-transform duration-200 group-hover:translate-x-0.5">
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
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                {/* ==================================================
                    TOP ACCENT
                ================================================== */}

                <div
                  className={`h-1 ${
                    isMorning ? "bg-indigo-500" : "bg-purple-500"
                  }`}
                />

                {/* ==================================================
                    CARD CONTENT
                ================================================== */}

                <div className="p-4">
                  {/* Header */}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Session */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                          isMorning
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        2D
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {isMorning ? "Morning Draw" : "Evening Draw"}
                          </h3>

                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              isMorning
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.session}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.date}
                        </p>
                      </div>
                    </div>

                    {/* Status */}

                    <span className="shrink-0 text-[10px] font-semibold text-emerald-600">
                      ● Published
                    </span>
                  </div>

                  {/* Divider */}

                  <div className="my-4 border-t border-slate-100" />

                  {/* Winning Number */}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Winning Number
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${
                          isMorning ? "text-indigo-500" : "text-purple-500"
                        }`}
                      >
                        2D Lottery Result
                      </p>
                    </div>

                    <div
                      className={`flex h-14 min-w-[72px] items-center justify-center rounded-lg border px-3 transition-transform duration-200 group-hover:scale-105 ${
                        isMorning
                          ? "border-indigo-100 bg-indigo-50"
                          : "border-purple-100 bg-purple-50"
                      }`}
                    >
                      <span
                        className={`text-3xl font-black leading-none tracking-widest ${
                          isMorning ? "text-indigo-600" : "text-purple-600"
                        }`}
                      >
                        {item.result}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ==================================================
              3D RESULT
          ================================================== */}

          {latest3DResult && (
            <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              {/* Top Accent */}

              <div className="h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />

              <div className="p-4">
                {/* Header */}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* 3D Icon */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-xs font-extrabold text-white shadow-sm">
                      3D
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">
                        3D Draw
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {latest3DResult.date}
                      </p>
                    </div>
                  </div>

                  {/* Status */}

                  <span className="shrink-0 text-[10px] font-semibold text-emerald-600">
                    ● Published
                  </span>
                </div>

                {/* Divider */}

                <div className="my-4 border-t border-slate-100" />

                {/* Winning Number */}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Winning Number
                    </p>

                    <p className="mt-1 text-xs font-medium text-purple-500">
                      3D Lottery Result
                    </p>
                  </div>

                  <div className="flex h-14 min-w-[86px] items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 px-3 shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <span className="text-3xl font-black leading-none tracking-widest text-white">
                      {latest3DResult.result}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            MOBILE VIEW ALL
        ================================================== */}

        <div className="mt-5 flex justify-center sm:hidden">
          <Link
            to="/results-history"
            className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-50"
          >
            View All Results
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
