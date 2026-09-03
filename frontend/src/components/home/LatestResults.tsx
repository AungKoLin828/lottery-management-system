import { Link } from "react-router-dom";
import {
  Trophy,
  CalendarDays,
  Clock3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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
    <section className="w-full bg-slate-50 py-7 sm:py-9">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            SECTION HEADER
        ======================================================== */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-emerald-500" />

              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Latest Results
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Check the latest 2D and 3D winning numbers
            </p>
          </div>

          <Link
            to="/results-history"
            className="
              group inline-flex shrink-0 items-center gap-1.5
              rounded-lg px-2.5 py-1.5
              text-xs font-semibold
              text-slate-600
              transition-all
              hover:bg-white
              hover:text-emerald-600
              hover:shadow-sm
            "
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
              2D CARD
          ====================================================== */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              border border-emerald-700
              bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700
              shadow-lg shadow-emerald-900/10
            "
          >
            {/* Decorative background */}
            <div
              className="
                pointer-events-none absolute
                -right-12 -top-12
                h-36 w-36
                rounded-full
                border-[18px]
                border-white/5
              "
            />

            <div
              className="
                pointer-events-none absolute
                -bottom-16 -left-10
                h-32 w-32
                rounded-full
                bg-white/[0.04]
              "
            />

            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
            <div
              className="
                relative flex items-center justify-between
                border-b border-white/10
                px-4 py-3.5
                sm:px-5
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-xl
                    bg-white/10
                    ring-1 ring-white/15
                    text-amber-300
                  "
                >
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Latest 2D</h3>

                    <span
                      className="
                        rounded-full
                        bg-amber-300/15
                        px-2 py-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-amber-200
                        ring-1 ring-amber-200/20
                      "
                    >
                      2D
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-emerald-100/70">
                    Today&apos;s winning numbers
                  </p>
                </div>
              </div>

              <Sparkles
                className="h-4 w-4 text-amber-300/70"
                strokeWidth={1.8}
              />
            </div>

            {latest2DDate ? (
              <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div
                  className="
                    mb-3 flex items-center gap-1.5
                    text-[11px] font-medium
                    text-emerald-100/75
                  "
                >
                  <CalendarDays
                    className="h-3.5 w-3.5 text-amber-300"
                    strokeWidth={2}
                  />

                  <span>{latest2DDate}</span>
                </div>

                {/* ------------------------------------------------
                    AM / PM RESULTS
                ------------------------------------------------ */}
                <div
                  className="
                    overflow-hidden
                    rounded-xl
                    border border-white/10
                    bg-white/95
                    shadow-md
                  "
                >
                  {/* ==================================================
                      AM
                  ================================================== */}
                  <div
                    className="
                      flex items-center justify-between
                      px-4 py-3.5
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-8 w-8 items-center justify-center
                          rounded-lg
                          bg-emerald-50
                          text-emerald-600
                        "
                      >
                        <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">AM</p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          10:30 AM
                        </p>
                      </div>
                    </div>

                    {latest2DAM ? (
                      <div className="flex items-center gap-2">
                        <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                          Result
                        </span>

                        <span
                          className="
                            min-w-[58px]
                            text-right
                            text-2xl
                            font-extrabold
                            leading-none
                            tracking-tight
                            text-emerald-700
                          "
                        >
                          {latest2DAM.result}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-slate-300">
                        —
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="mx-4 border-t border-slate-100" />

                  {/* ==================================================
                      PM
                  ================================================== */}
                  <div
                    className="
                      flex items-center justify-between
                      px-4 py-3.5
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-8 w-8 items-center justify-center
                          rounded-lg
                          bg-emerald-50
                          text-emerald-600
                        "
                      >
                        <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">PM</p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          4:30 PM
                        </p>
                      </div>
                    </div>

                    {latest2DPM ? (
                      <div className="flex items-center gap-2">
                        <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                          Result
                        </span>

                        <span
                          className="
                            min-w-[58px]
                            text-right
                            text-2xl
                            font-extrabold
                            leading-none
                            tracking-tight
                            text-emerald-700
                          "
                        >
                          {latest2DPM.result}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-slate-300">
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
                  className="
                    group mt-3 inline-flex items-center gap-1.5
                    rounded-lg
                    px-1 py-1
                    text-xs font-semibold
                    text-white
                    transition-all
                    hover:text-amber-200
                  "
                >
                  View 2D Results
                  <ArrowRight
                    className="
                      h-3.5 w-3.5
                      transition-transform
                      group-hover:translate-x-0.5
                    "
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : (
              <div className="relative px-4 pb-5 text-center text-xs text-emerald-100/70">
                No 2D result available.
              </div>
            )}
          </div>

          {/* ======================================================
              3D CARD
          ====================================================== */}
          <div
            className="
              relative overflow-hidden
              rounded-2xl
              border border-indigo-700
              bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-800
              shadow-lg shadow-indigo-900/10
            "
          >
            {/* Decorative background */}
            <div
              className="
                pointer-events-none absolute
                -right-10 -bottom-14
                h-40 w-40
                rounded-full
                border-[20px]
                border-white/5
              "
            />

            <div
              className="
                pointer-events-none absolute
                right-16 top-8
                h-16 w-16
                rounded-full
                bg-violet-300/[0.06]
              "
            />

            {/* ----------------------------------------------------
                HEADER
            ---------------------------------------------------- */}
            <div
              className="
                relative flex items-center justify-between
                border-b border-white/10
                px-4 py-3.5
                sm:px-5
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-xl
                    bg-white/10
                    ring-1 ring-white/15
                    text-violet-200
                  "
                >
                  <Trophy className="h-4 w-4" strokeWidth={2} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Latest 3D</h3>

                    <span
                      className="
                        rounded-full
                        bg-violet-300/15
                        px-2 py-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-violet-200
                        ring-1 ring-violet-200/20
                      "
                    >
                      3D
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-indigo-100/70">
                    Most recent winning number
                  </p>
                </div>
              </div>

              <Sparkles
                className="h-4 w-4 text-violet-200/70"
                strokeWidth={1.8}
              />
            </div>

            {latest3DResult ? (
              <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                {/* ------------------------------------------------
                    DATE
                ------------------------------------------------ */}
                <div
                  className="
                    mb-3 flex items-center gap-1.5
                    text-[11px] font-medium
                    text-indigo-100/75
                  "
                >
                  <CalendarDays
                    className="h-3.5 w-3.5 text-violet-200"
                    strokeWidth={2}
                  />

                  <span>{latest3DResult.date}</span>
                </div>

                {/* ------------------------------------------------
                    3D RESULT
                ------------------------------------------------ */}
                <div
                  className="
                    relative flex min-h-[138px]
                    flex-col items-center justify-center
                    overflow-hidden
                    rounded-xl
                    border border-white/10
                    bg-white/95
                    shadow-md
                  "
                >
                  {/* Small decorative shine */}
                  <div
                    className="
                      pointer-events-none absolute
                      -right-8 -top-8
                      h-20 w-20
                      rounded-full
                      bg-violet-100
                    "
                  />

                  <div
                    className="
                      relative flex items-center gap-1.5
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Winning Number
                  </div>

                  <div
                    className="
                      relative mt-2
                      text-4xl
                      font-extrabold
                      leading-none
                      tracking-[0.12em]
                      text-indigo-700
                      sm:text-[2.75rem]
                    "
                  >
                    {latest3DResult.result}
                  </div>

                  <div
                    className="
                      relative mt-3
                      flex items-center gap-1
                      text-[10px] text-slate-400
                    "
                  >
                    <Clock3 className="h-3 w-3" strokeWidth={2} />

                    <span>3D Draw</span>
                  </div>
                </div>

                {/* ------------------------------------------------
                    VIEW RESULTS
                ------------------------------------------------ */}
                <Link
                  to="/results-history"
                  className="
                    group mt-3 inline-flex items-center gap-1.5
                    rounded-lg
                    px-1 py-1
                    text-xs font-semibold
                    text-white
                    transition-all
                    hover:text-violet-200
                  "
                >
                  View 3D Results
                  <ArrowRight
                    className="
                      h-3.5 w-3.5
                      transition-transform
                      group-hover:translate-x-0.5
                    "
                    strokeWidth={2}
                  />
                </Link>
              </div>
            ) : (
              <div className="relative px-4 pb-5 text-center text-xs text-indigo-100/70">
                No 3D result available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
