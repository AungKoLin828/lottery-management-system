import type { PublicHoliday as PublicHolidayType } from "@/types/lottery";

import { twoDOffDays } from "@/data/home/publicHolidays";

function getDayName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatDate(date: string): {
  day: string;
  month: string;
  year: string;
} {
  const parsed = new Date(`${date}T00:00:00`);

  return {
    day: parsed.toLocaleDateString("en-US", {
      day: "2-digit",
    }),
    month: parsed.toLocaleDateString("en-US", {
      month: "short",
    }),
    year: parsed.toLocaleDateString("en-US", {
      year: "numeric",
    }),
  };
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
      {/* ============================================================
          SECTION HEADER
      ============================================================ */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50">
            <span className="text-lg">📅</span>
          </div>

          {/* Title */}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
              Public Holidays
            </h2>

            <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
              2D draw off-days and public holidays
            </p>
          </div>
        </div>

        {/* Count */}
        {publicHolidays.length > 0 && (
          <div className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2.5 py-1">
            <span className="text-[10px] font-semibold text-red-600 sm:text-[11px]">
              {publicHolidays.length}{" "}
              {publicHolidays.length === 1 ? "Day" : "Days"}
            </span>
          </div>
        )}
      </div>

      {/* ============================================================
          EMPTY STATE
      ============================================================ */}
      {publicHolidays.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-xl text-emerald-600">✓</span>
            </div>

            <p className="mt-3 text-sm font-semibold text-gray-800">
              No public holidays
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
              There are no configured 2D public holidays at this time.
            </p>
          </div>
        </div>
      ) : (
        /* ============================================================
           HOLIDAY LIST
        ============================================================ */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Top accent */}
          <div className="h-1 bg-red-500" />

          {/* Scroll Area */}
          <div className="max-h-[320px] overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {publicHolidays.map((holiday) => {
                const formatted = formatDate(holiday.date);

                return (
                  <div
                    key={holiday.date}
                    className="group px-3 py-3 transition-colors hover:bg-gray-50 sm:px-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* ==================================================
                          DATE BADGE
                      ================================================== */}
                      <div className="flex w-[52px] shrink-0 flex-col overflow-hidden rounded-xl border border-red-100 bg-white text-center shadow-sm">
                        {/* Month */}
                        <div className="bg-red-500 px-1 py-1">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-white">
                            {formatted.month}
                          </span>
                        </div>

                        {/* Day */}
                        <div className="px-1 py-1.5">
                          <span className="text-base font-bold leading-none text-gray-900">
                            {formatted.day}
                          </span>
                        </div>
                      </div>

                      {/* ==================================================
                          HOLIDAY INFORMATION
                      ================================================== */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate text-xs font-bold text-gray-900 sm:text-sm">
                            {holiday.name}
                          </p>

                          {/* Status */}
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            2D Draw Off
                          </span>
                        </div>

                        {/* Day + date */}
                        <p className="mt-1 text-[10px] text-gray-500 sm:text-[11px]">
                          {holiday.day} · {formatted.year}
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-gray-400 sm:text-[10px]">
                          2D results are not available on this date
                        </p>
                      </div>

                      {/* ==================================================
                          RIGHT ARROW / STATUS ICON
                      ================================================== */}
                      <div className="hidden shrink-0 sm:flex">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-red-50 group-hover:text-red-500">
                          <span className="text-sm">›</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              FOOTER
          ============================================================ */}
          <div className="border-t border-gray-100 bg-gray-50/70 px-3 py-2.5 sm:px-4">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px]">
                📅
              </span>

              <p className="text-[10px] text-gray-500 sm:text-[11px]">
                {publicHolidays.length} public holiday
                {publicHolidays.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
