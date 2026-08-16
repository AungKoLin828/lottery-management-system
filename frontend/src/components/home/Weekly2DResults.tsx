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
    <section className="bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              2D Weekly Results
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Monday to Friday — AM and PM
            </p>
          </div>

          <Link
            to="/results-history"
            className="text-sm font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
          >
            View Full History
          </Link>
        </div>

        {/* Weekly Results */}
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
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:shadow-md"
              >
                {/* Date Header */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">
                          {day.day}
                        </h3>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {day.date}
                        </p>
                      </div>
                    </div>

                    {isOffDay ? (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        OFF DAY
                      </span>
                    ) : (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                        2D
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  {isOffDay ? (
                    <TwoDOffDayCard holidayName={holidayName} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {/* AM */}
                      {day.morning ? (
                        <TwoDResultCard
                          title="Morning"
                          session="AM"
                          result={day.morning.result}
                        />
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs text-gray-400">
                            No AM result
                          </p>
                        </div>
                      )}

                      {/* PM */}
                      {day.evening ? (
                        <TwoDResultCard
                          title="Evening"
                          session="PM"
                          result={day.evening.result}
                        />
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs text-gray-400">
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