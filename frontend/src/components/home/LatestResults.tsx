import { Link } from "react-router-dom";
import { Trophy, CalendarDays, Clock3, ArrowRight } from "lucide-react";

import { latest2DResults, latest3DResults } from "@/data/home/lotteryData";

export default function LatestResults() {
  /* ============================================================
     SORT 2D RESULTS
     - Newest date first
     - PM appears before AM when both exist on the same date
  ============================================================ */
  const sortedLatest2DResults = [...latest2DResults].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const sessionOrder: Record<string, number> = {
      AM: 1,
      PM: 2,
    };

    return (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0);
  });

  /* ============================================================
     SORT 3D RESULTS
     - Newest result first
  ============================================================ */
  const sortedLatest3DResults = [...latest3DResults].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  /* ============================================================
     GET LATEST 2D DATE
     The card will display AM + PM from the same latest date.
  ============================================================ */
  const latest2DDate = sortedLatest2DResults[0]?.date;

  const latest2DForDate = sortedLatest2DResults.filter(
    (result) => result.date === latest2DDate,
  );

  const latest2DAM = latest2DForDate.find((result) => result.session === "AM");

  const latest2DPM = latest2DForDate.find((result) => result.session === "PM");

  /* ============================================================
     LATEST 3D
  ============================================================ */
  const latest3DResult = sortedLatest3DResults[0];

  return (
    <section className="w-full bg-slate-50 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            SECTION HEADER
        ======================================================== */}
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

        {/* ========================================================
            RESULTS GRID
        ======================================================== */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ======================================================
              LATEST 2D RESULTS
              Shows AM + PM together
          ====================================================== */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-100 sm:p-5">
            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Trophy className="h-5 w-5 text-white" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-base font-bold sm:text-lg">
                    Latest 2D Results
                  </h3>

                  <p className="mt-0.5 text-xs text-emerald-50 sm:text-sm">
                    Today&apos;s winning numbers
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-white/20">
                2D
              </span>
            </div>

            {latest2DDate ? (
              <>
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="mt-5 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 text-xs text-emerald-50">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span>Date</span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {latest2DDate}
                  </p>
                </div>

                {/* ------------------------------------------------
                    AM / PM RESULTS
                ------------------------------------------------ */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* ==============================================
                      AM
                  ============================================== */}
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-emerald-600" />

                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        AM
                      </span>
                    </div>

                    {latest2DAM ? (
                      <>
                        <div className="mt-2 text-4xl font-extrabold tracking-tight text-emerald-600 sm:text-5xl">
                          {latest2DAM.result}
                        </div>

                        <p className="mt-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                          10:30 AM
                        </p>
                      </>
                    ) : (
                      <div className="mt-4 text-2xl font-bold text-slate-300">
                        —
                      </div>
                    )}
                  </div>

                  {/* ==============================================
                      PM
                  ============================================== */}
                  <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-emerald-600" />

                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        PM
                      </span>
                    </div>

                    {latest2DPM ? (
                      <>
                        <div className="mt-2 text-4xl font-extrabold tracking-tight text-emerald-600 sm:text-5xl">
                          {latest2DPM.result}
                        </div>

                        <p className="mt-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                          4:30 PM
                        </p>
                      </>
                    ) : (
                      <div className="mt-4 text-2xl font-bold text-slate-300">
                        —
                      </div>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------
                    VIEW 2D RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="group mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-white/95 transition-colors hover:text-white"
                >
                  View 2D Results
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-white/10 px-4 py-8 text-center text-sm text-emerald-50 ring-1 ring-white/10">
                No 2D result available.
              </div>
            )}
          </div>

          {/* ======================================================
              LATEST 3D RESULT
          ====================================================== */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-100 sm:p-5">
            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
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
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="mt-5 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 text-xs text-emerald-50">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span>Date</span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {latest3DResult.date}
                  </p>
                </div>

                {/* ------------------------------------------------
                    WINNING NUMBER
                ------------------------------------------------ */}
                <div className="mt-4 rounded-xl bg-white p-4 text-center shadow-sm sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Winning Number
                  </p>

                  <div className="mt-2 text-5xl font-extrabold tracking-tight text-emerald-600 sm:text-6xl">
                    {latest3DResult.result}
                  </div>
                </div>

                {/* ------------------------------------------------
                    DRAW INFORMATION
                ------------------------------------------------ */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-50">
                  <Clock3 className="h-3.5 w-3.5" />

                  <span>3D Draw</span>
                </div>

                {/* ------------------------------------------------
                    VIEW 3D RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="group mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-white/95 transition-colors hover:text-white"
                >
                  View 3D Results
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
