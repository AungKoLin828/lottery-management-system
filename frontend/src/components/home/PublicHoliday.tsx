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
    <section className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-lg">
          📅
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-800">Public Holiday</h2>

          <p className="text-xs text-gray-500">
            2D draw off-days and public holidays
          </p>
        </div>
      </div>

      {/* Empty State */}
      {publicHolidays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
            ✓
          </div>

          <p className="mt-3 font-semibold text-gray-700">No public holidays</p>

          <p className="mt-1 text-xs text-gray-500">
            There are no configured 2D public holidays at this time.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
          {/* Vertical Scroll Only */}
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-red-200 bg-red-50">
                  <th className="w-[27%] px-2 py-2 text-left text-[11px] font-semibold text-red-800">
                    Date
                  </th>

                  <th className="w-[50%] px-2 py-2 text-left text-[11px] font-semibold text-red-800">
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
                    {/* Date */}
                    <td className="px-2 py-1.5 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100 text-[10px] text-red-600">
                          📅
                        </div>

                        <span className="min-w-0 truncate text-[10px] font-semibold text-gray-800">
                          {holiday.date}
                        </span>
                      </div>
                    </td>

                    {/* Holiday */}
                    <td className="px-2 py-1.5 align-middle">
                      <div className="min-w-0">
                        <p className="break-words text-[10px] font-semibold leading-4 text-gray-800">
                          {holiday.name}
                        </p>

                        <p className="mt-0.5 text-[9px] leading-3 text-gray-500">
                          2D draw is not available
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-red-100 bg-red-50/40 px-2 py-1.5">
            <p className="text-center text-[9px] text-gray-500">
              {publicHolidays.length} public holiday
              {publicHolidays.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
