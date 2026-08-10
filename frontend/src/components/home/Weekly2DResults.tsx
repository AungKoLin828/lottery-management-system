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
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              2D Weekly Results
            </h2>

            <p className="mt-1 text-gray-500">Monday to Friday — AM and PM</p>
          </div>

          <Link
            to="/results-history"
            className="font-medium text-blue-600 hover:underline"
          >
            View Full History
          </Link>
        </div>

        <div className="space-y-5">
          {weekly2DResults.map((day) => {
            const holidayName = twoDOffDays[day.date];

            const isOffDay = Object.prototype.hasOwnProperty.call(
              twoDOffDays,
              day.date,
            );

            return (
              <div
                key={day.date}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Date Header */}
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">{day.day}</h3>

                      <p className="text-sm text-gray-500">{day.date}</p>
                    </div>

                    {isOffDay ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        OFF DAY
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        2D
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {isOffDay ? (
                    <TwoDOffDayCard holidayName={holidayName} />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {/* AM */}
                      {day.morning ? (
                        <TwoDResultCard
                          title="Morning"
                          session="AM"
                          result={day.morning.result}
                        />
                      ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                          <p className="text-sm text-gray-500">No AM result</p>
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
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                          <p className="text-sm text-gray-500">No PM result</p>
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
