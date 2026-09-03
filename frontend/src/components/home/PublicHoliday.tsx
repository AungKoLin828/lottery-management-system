import type { PublicHoliday as PublicHolidayType } from "@/types/lottery";

import { CalendarDays, CalendarOff } from "lucide-react";

import { twoDOffDays } from "@/data/home/publicHolidays";

/* ============================================================
   HELPERS
============================================================ */

function getDayName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function getMonthName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
  });
}

function getDayNumber(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "2-digit",
  });
}

function getYear(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
  });
}

/* ============================================================
   COMPONENT
============================================================ */

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
      {/* ========================================================
          HEADER
      ======================================================== */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50">
            <CalendarDays className="h-4.5 w-4.5 text-red-500" />
          </div>

          {/* Heading */}
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
              Public Holidays
            </h2>

            <p className="truncate text-[10px] text-gray-500 sm:text-xs">
              2D draw off-days and public holidays
            </p>
          </div>
        </div>

        {/* Count */}
        {publicHolidays.length > 0 && (
          <div className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2.5 py-1">
            <span className="text-[10px] font-semibold text-red-600">
              {publicHolidays.length}{" "}
              {publicHolidays.length === 1 ? "Holiday" : "Holidays"}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================
          EMPTY STATE
      ======================================================== */}
      {publicHolidays.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
            <CalendarDays className="h-5 w-5 text-emerald-500" />
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-800">
            No public holidays
          </p>

          <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-gray-500">
            There are no configured 2D public holidays at this time.
          </p>
        </div>
      ) : (
        /* ========================================================
           TABLE CARD
        ======================================================== */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* ======================================================
              TABLE
          ====================================================== */}
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full border-collapse">
              {/* ==================================================
                  TABLE HEADER
              ================================================== */}
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  {/* Date */}
                  <th className="w-[34%] px-3 py-2.5 text-left sm:w-[30%] sm:px-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-red-500" />

                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        Date
                      </span>
                    </div>
                  </th>

                  {/* Holiday */}
                  <th className="px-3 py-2.5 text-left sm:px-4">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                      Public Holiday
                    </span>
                  </th>
                </tr>
              </thead>

              {/* ==================================================
                  TABLE BODY
              ================================================== */}
              <tbody>
                {publicHolidays.map((holiday, index) => (
                  <tr
                    key={holiday.date}
                    className={`group border-b border-gray-100 last:border-b-0 transition-colors duration-200 hover:bg-red-50/40 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    {/* =================================================
                        DATE COLUMN
                    ================================================= */}
                    <td className="px-3 py-2.5 align-middle sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2.5">
                        {/* Calendar Date */}
                        <div className="flex h-9 w-9 shrink-0 flex-col overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
                          {/* Month */}
                          <div className="flex h-3.5 items-center justify-center bg-red-500">
                            <span className="text-[7px] font-bold uppercase tracking-wide text-white">
                              {getMonthName(holiday.date)}
                            </span>
                          </div>

                          {/* Day */}
                          <div className="flex flex-1 items-center justify-center">
                            <span className="text-xs font-bold leading-none text-gray-800">
                              {getDayNumber(holiday.date)}
                            </span>
                          </div>
                        </div>

                        {/* Full Date */}
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-gray-800 sm:text-[11px]">
                            {holiday.date}
                          </p>

                          <p className="mt-0.5 truncate text-[9px] text-gray-400 sm:text-[10px]">
                            {holiday.day}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* =================================================
                        HOLIDAY COLUMN
                    ================================================= */}
                    <td className="px-3 py-2.5 align-middle sm:px-4 sm:py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="break-words text-[10px] font-semibold leading-4 text-gray-800 sm:text-[11px]">
                            {holiday.name}
                          </p>

                          <p className="mt-0.5 text-[9px] leading-3.5 text-gray-400 sm:text-[10px]">
                            {getYear(holiday.date)} · 2D draw unavailable
                          </p>
                        </div>

                        {/* Status */}
                        <span className="hidden shrink-0 rounded-full bg-red-50 px-2 py-1 text-[8px] font-semibold text-red-600 sm:inline-flex">
                          DRAW OFF
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================
              FOOTER
          ======================================================== */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-1.5">
              <CalendarOff className="h-3 w-3 text-red-400" />

              <span className="text-[9px] text-gray-500 sm:text-[10px]">
                2D draw is unavailable on public holidays
              </span>
            </div>

            <span className="text-[9px] font-medium text-gray-400 sm:text-[10px]">
              {publicHolidays.length} total
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
