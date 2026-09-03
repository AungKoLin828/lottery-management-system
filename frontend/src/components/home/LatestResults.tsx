import { Link } from "react-router-dom";
import { Trophy, CalendarDays, Clock3, ArrowRight } from "lucide-react";

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

    return sessionOrder[b.session] - sessionOrder[a.session];
  });

  const latest2DResult = sortedLatest2DResults[0];
  const latest3DResult = latest3DResults[0];

  return (
    <section className="w-full bg-slate-50 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================================================
            SECTION HEADER
        ============================================================ */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-emerald-500" />

              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Latest Results
              </h2>
            </div>

            <p className="text-xs text-slate-500 sm:text-sm">
              Check the latest 2D and 3D winning numbers
            </p>
          </div>

          <Link
            to="/results-history"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            View All
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
        </div>

        {/* ============================================================
            RESULTS GRID
        ============================================================ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ==========================================================
              LATEST 2D RESULT
              Designed to closely match Player Dashboard Latest Draw
          ========================================================== */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-100 sm:p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Trophy className="h-5 w-5 text-white" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-base font-bold sm:text-lg">
                    Latest Draw
                  </h3>

                  <p className="mt-0.5 text-xs text-emerald-50 sm:text-sm">
                    Most recent 2D result
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-white/20">
                2D
              </span>
            </div>

            {latest2DResult ? (
              <>
                {/* Date / Time */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-center gap-2 text-xs text-emerald-50">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Date</span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {latest2DResult.date}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-center gap-2 text-xs text-emerald-50">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Session</span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {latest2DResult.session}
                    </p>
                  </div>
                </div>

                {/* Winning Number */}
                <div className="mt-4 rounded-xl bg-white p-4 text-center shadow-sm sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Winning Number
                  </p>

                  <div className="mt-2 text-5xl font-extrabold tracking-tight text-emerald-600 sm:text-6xl">
                    {latest2DResult.result}
                  </div>
                </div>

                {/* All Results */}
                <Link
                  to="/results-history"
                  className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-white/95 transition-colors hover:text-white"
                >
                  View 2D Results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-white/10 px-4 py-8 text-center text-sm text-emerald-50 ring-1 ring-white/10">
                No 2D result available.
              </div>
            )}
          </div>

          {/* ==========================================================
              LATEST 3D RESULT
              Same visual language as Latest Draw
          ========================================================== */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-100 sm:p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Trophy className="h-5 w-5 text-white" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-base font-bold sm:text-lg">
                    Latest Draw
                  </h3>

                  <p className="mt-0.5 text-xs text-emerald-50 sm:text-sm">
                    Most recent 3D result
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-white/20">
                3D
              </span>
            </div>

            {latest3DResult ? (
              <>
                {/* Date / Time */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-center gap-2 text-xs text-emerald-50">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Date</span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {latest3DResult.date}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <div className="flex items-center gap-2 text-xs text-emerald-50">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Draw</span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-white">3D</p>
                  </div>
                </div>

                {/* Winning Number */}
                <div className="mt-4 rounded-xl bg-white p-4 text-center shadow-sm sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Winning Number
                  </p>

                  <div className="mt-2 text-5xl font-extrabold tracking-tight text-emerald-600 sm:text-6xl">
                    {latest3DResult.result}
                  </div>
                </div>

                {/* All Results */}
                <Link
                  to="/results-history"
                  className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-white/95 transition-colors hover:text-white"
                >
                  View 3D Results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-white/10 px-4 py-8 text-center text-sm text-emerald-50 ring-1 ring-white/10">
                No 3D result available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
