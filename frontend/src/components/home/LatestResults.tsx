import { Link } from "react-router-dom";
import { Trophy, CalendarDays, Clock3, ArrowRight } from "lucide-react";

import { latest2DResults, latest3DResults } from "@/data/home/lotteryData";

export default function LatestResults() {
  /* ============================================================
     SORT 2D RESULTS
     - Newest date first
     - PM appears before AM on the same date
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
  ============================================================ */
  const sortedLatest3DResults = [...latest3DResults].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  /* ============================================================
     LATEST 2D DATE
     Show AM + PM results from the same latest date.
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
    <section className="w-full bg-slate-50 py-7 sm:py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            SECTION HEADER
        ======================================================== */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />

              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Latest Results
              </h2>
            </div>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Check the latest 2D and 3D winning numbers
            </p>
          </div>

          <Link
            to="/results-history"
            className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 sm:text-sm"
          >
            View All
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4"
              strokeWidth={2.2}
            />
          </Link>
        </div>

        {/* ========================================================
            RESULTS GRID
        ======================================================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ======================================================
              LATEST 2D RESULTS
          ====================================================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {/* ----------------------------------------------------
                CARD HEADER
            ---------------------------------------------------- */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                    Latest 2D Results
                  </h3>

                  <p className="text-[11px] text-slate-500 sm:text-xs">
                    Today&apos;s winning numbers
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-700 sm:text-xs">
                2D
              </span>
            </div>

            {latest2DDate ? (
              <>
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-emerald-500"
                    strokeWidth={2}
                  />

                  <span>{latest2DDate}</span>
                </div>

                {/* ------------------------------------------------
                    AM / PM RESULTS
                ------------------------------------------------ */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {/* ==================================================
                      AM
                  ================================================== */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock3
                        className="h-3 w-3 text-slate-400"
                        strokeWidth={2}
                      />

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        AM
                      </span>
                    </div>

                    {latest2DAM ? (
                      <>
                        <div className="mt-1 text-3xl font-bold leading-none tracking-tight text-emerald-600 sm:text-4xl">
                          {latest2DAM.result}
                        </div>

                        <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                          10:30 AM
                        </p>
                      </>
                    ) : (
                      <div className="mt-2 text-xl font-semibold text-slate-300">
                        —
                      </div>
                    )}
                  </div>

                  {/* ==================================================
                      PM
                  ================================================== */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock3
                        className="h-3 w-3 text-slate-400"
                        strokeWidth={2}
                      />

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        PM
                      </span>
                    </div>

                    {latest2DPM ? (
                      <>
                        <div className="mt-1 text-3xl font-bold leading-none tracking-tight text-emerald-600 sm:text-4xl">
                          {latest2DPM.result}
                        </div>

                        <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                          4:30 PM
                        </p>
                      </>
                    ) : (
                      <div className="mt-2 text-xl font-semibold text-slate-300">
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
                  className="group mt-3 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  View 2D Results
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                No 2D result available.
              </div>
            )}
          </div>

          {/* ======================================================
              LATEST 3D RESULT
          ====================================================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {/* ----------------------------------------------------
                CARD HEADER
            ---------------------------------------------------- */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                    Latest Draw
                  </h3>

                  <p className="text-[11px] text-slate-500 sm:text-xs">
                    Most recent 3D result
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-700 sm:text-xs">
                3D
              </span>
            </div>

            {latest3DResult ? (
              <>
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-emerald-500"
                    strokeWidth={2}
                  />

                  <span>{latest3DResult.date}</span>
                </div>

                {/* ------------------------------------------------
                    WINNING NUMBER
                ------------------------------------------------ */}
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Winning Number
                  </p>

                  <div className="mt-1.5 text-4xl font-bold leading-none tracking-tight text-emerald-600 sm:text-5xl">
                    {latest3DResult.result}
                  </div>

                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400">
                    <Clock3 className="h-3 w-3" strokeWidth={2} />

                    <span>3D Draw</span>
                  </div>
                </div>

                {/* ------------------------------------------------
                    VIEW 3D RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="group mt-3 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  View 3D Results
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                No 3D result available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
