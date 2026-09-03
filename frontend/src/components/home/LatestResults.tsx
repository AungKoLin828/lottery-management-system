import { Link } from "react-router-dom";
import { Trophy, CalendarDays, Clock3, ArrowRight } from "lucide-react";

import { latest2DResults, latest3DResults } from "@/data/home/lotteryData";

export default function LatestResults() {
  /* ============================================================
     SORT 2D RESULTS
     - Newest date first
     - PM before AM on the same date
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
  ============================================================ */
  const latest2DDate = sortedLatest2DResults[0]?.date;

  const latest2DForDate = sortedLatest2DResults.filter(
    (result) => result.date === latest2DDate,
  );

  const latest2DAM = latest2DForDate.find((result) => result.session === "AM");

  const latest2DPM = latest2DForDate.find((result) => result.session === "PM");

  /* ============================================================
     LATEST 3D RESULT
  ============================================================ */
  const latest3DResult = sortedLatest3DResults[0];

  return (
    <section className="w-full bg-slate-50 py-7 sm:py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            SECTION HEADER
        ======================================================== */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />

              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Latest Results
              </h2>
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Check the latest 2D and 3D winning numbers
            </p>
          </div>

          <Link
            to="/results-history"
            className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            View All
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
        </div>

        {/* ========================================================
            RESULTS
        ======================================================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ======================================================
              2D RESULT PANEL
          ====================================================== */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Latest 2D Results
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    Today&apos;s winning numbers
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                2D
              </span>
            </div>

            {latest2DDate ? (
              <div className="px-4 py-4 sm:px-5">
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-emerald-500"
                    strokeWidth={2}
                  />

                  <span>{latest2DDate}</span>
                </div>

                {/* ------------------------------------------------
                    AM / PM
                ------------------------------------------------ */}
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {/* ==================================================
                      AM
                  ================================================== */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50">
                        <Clock3
                          className="h-3.5 w-3.5 text-slate-400"
                          strokeWidth={2}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          AM
                        </p>

                        <p className="text-[10px] text-slate-400">10:30 AM</p>
                      </div>
                    </div>

                    {latest2DAM ? (
                      <span className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                        {latest2DAM.result}
                      </span>
                    ) : (
                      <span className="text-xl font-semibold text-slate-300">
                        —
                      </span>
                    )}
                  </div>

                  {/* ==================================================
                      PM
                  ================================================== */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50">
                        <Clock3
                          className="h-3.5 w-3.5 text-slate-400"
                          strokeWidth={2}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          PM
                        </p>

                        <p className="text-[10px] text-slate-400">4:30 PM</p>
                      </div>
                    </div>

                    {latest2DPM ? (
                      <span className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                        {latest2DPM.result}
                      </span>
                    ) : (
                      <span className="text-xl font-semibold text-slate-300">
                        —
                      </span>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------
                    VIEW RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="group mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  View 2D Results
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-400 sm:px-5">
                No 2D result available.
              </div>
            )}
          </div>

          {/* ======================================================
              3D RESULT PANEL
          ====================================================== */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Latest 3D Draw
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    Most recent winning number
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                3D
              </span>
            </div>

            {latest3DResult ? (
              <div className="px-4 py-4 sm:px-5">
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-emerald-500"
                    strokeWidth={2}
                  />

                  <span>{latest3DResult.date}</span>
                </div>

                {/* ------------------------------------------------
                    RESULT
                ------------------------------------------------ */}
                <div className="mt-3 flex min-h-[124px] flex-col items-center justify-center rounded-lg bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Winning Number
                  </p>

                  <div className="mt-1 text-4xl font-bold leading-none tracking-[0.08em] text-emerald-600 sm:text-5xl">
                    {latest3DResult.result}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock3 className="h-3 w-3" strokeWidth={2} />

                    <span>3D Draw</span>
                  </div>
                </div>

                {/* ------------------------------------------------
                    VIEW RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="group mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  View 3D Results
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-400 sm:px-5">
                No 3D result available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
