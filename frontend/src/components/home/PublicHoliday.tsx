import type { PublicHoliday as PublicHolidayType } from "@/types/lottery";

import { twoDOffDays } from "@/data/home/publicHolidays";

function getDayName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

export default function PublicHoliday() {
  const publicHolidays: PublicHolidayType[] = Object.entries(twoDOffDays)
    .map(([date, name]) => ({
      date,
      day: getDayName(date),
      name,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl text-red-600">
              📅
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Public Holiday
              </h2>

              <p className="mt-1 text-gray-500">
                2D draw off-days and public holidays
              </p>
            </div>
          </div>
        </div>

        {publicHolidays.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>

            <p className="mt-4 font-semibold text-gray-700">
              No public holidays
            </p>

            <p className="mt-1 text-sm text-gray-500">
              There are no configured 2D public holidays at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-red-200 bg-red-50">
                    <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                      Day
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                      Holiday
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {publicHolidays.map((holiday, index) => (
                    <tr
                      key={holiday.date}
                      className={`border-b border-red-100 transition-colors hover:bg-red-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-red-50/30"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-sm text-red-600">
                            📅
                          </div>

                          <span className="text-sm font-semibold text-gray-800">
                            {holiday.date}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          {holiday.day}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {holiday.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            2D draw is not available
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
