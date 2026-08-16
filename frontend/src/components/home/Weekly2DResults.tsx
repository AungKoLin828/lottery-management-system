import { Link } from "react-router-dom";

import { dayNames, twoDResults, weekDates } from "@/data/home/lotteryData";
import { twoDOffDays } from "@/data/home/publicHolidays";

import TwoDOffDayCard from "./TwoDOffDayCard";
import TwoDResultCard from "./TwoDResultCard";

export default function Weekly2DResults() {
  const weekly2DResults = weekDates.map((date, index) => {
    const isOffDay = Object.prototype.hasOwnProperty.call(twoDOffDays, date);

    return {
      date,
      day: dayNames[index],
      morning: isOffDay ? null : (twoDResults[date]?.morning ?? null),
      evening: isOffDay ? null : (twoDResults[date]?.evening ?? null),
    };
  });

  return (
    <section className="w-full bg-purple-50/40 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              2D Weekly Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monday to Friday — AM and PM
            </p>
          </div>

          <Link
            to="/results-history"
            className="inline-flex w-fit items-center rounded-lg px-2 py-1 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 hover:text-purple-800 hover:underline"
          >
            View Full History
          </Link>
        </div>

        {/* ==================================================
            WEEKLY RESULTS
        ================================================== */}

        <div className="space-y-3">
          {weekly2DResults.map((day) => {
            const holidayName = twoDOffDays[day.date];

            const isOffDay = Object.prototype.hasOwnProperty.call(
              twoDOffDays,
              day.date,
            );

            return (
              <div
                key={day.date}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isOffDay
                    ? "border-rose-100 hover:shadow-rose-100/60"
                    : "border-purple-100 hover:shadow-purple-100/70"
                }`}
              >
                {/* ==================================================
                    DATE HEADER
                ================================================== */}

                <div
                  className={`border-b px-4 py-3 ${
                    isOffDay
                      ? "border-rose-100 bg-rose-50/60"
                      : "border-purple-100 bg-gradient-to-r from-purple-50/80 via-violet-50/60 to-purple-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Day Information */}

                    <div className="flex items-center gap-3">
                      {/* Day Indicator */}

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm ${
                          isOffDay
                            ? "bg-gradient-to-br from-rose-500 to-rose-600"
                            : "bg-gradient-to-br from-purple-700 to-violet-600"
                        }`}
                      >
                        {day.day.slice(0, 2)}
                      </div>

                      {/* Date */}

                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {day.day}
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {day.date}
                        </p>
                      </div>
                    </div>

                    {/* ==================================================
                        STATUS BADGE
                    ================================================== */}

                    {isOffDay ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-600">
                        OFF DAY
                      </span>
                    ) : (
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                        2D
                      </span>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="p-3">
                  {isOffDay ? (
                    <TwoDOffDayCard holidayName={holidayName} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {/* ==================================================
                          AM RESULT
                      ================================================== */}

                      {day.morning ? (
                        <TwoDResultCard
                          title="Morning"
                          session="AM"
                          result={day.morning.result}
                        />
                      ) : (
                        <div className="rounded-lg border border-purple-100 bg-purple-50/40 px-4 py-3">
                          <p className="text-xs text-slate-400">
                            No AM result
                          </p>
                        </div>
                      )}

                      {/* ==================================================
                          PM RESULT
                      ================================================== */}

                      {day.evening ? (
                        <TwoDResultCard
                          title="Evening"
                          session="PM"
                          result={day.evening.result}
                        />
                      ) : (
                        <div className="rounded-lg border border-purple-100 bg-purple-50/40 px-4 py-3">
                          <p className="text-xs text-slate-400">
                            No PM result
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}