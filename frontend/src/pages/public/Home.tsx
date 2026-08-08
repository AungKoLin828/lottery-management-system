import { Link } from "react-router-dom";

/* ============================================================
   TYPES
   ============================================================ */

type Session2D = "AM" | "PM";

interface Result2D {
  result: string;
  setValue: string;
  value: string;
}

interface Result3D {
  result: string;
}

interface Weekly2D {
  date: string;
  day: string;
  morning: Result2D | null;
  evening: Result2D | null;
}

interface ThreeDDraw {
  date: string;
  day: string;
  result: string | null;
}

interface PublicHoliday {
  date: string;
  day: string;
  name: string;
}

interface Latest2DResult {
  id: number;
  date: string;
  session: Session2D;
  result: string;
  setValue: string;
  value: string;
}

interface Latest3DResult {
  id: number;
  date: string;
  result: string;
}

/* ============================================================
   WEEK DATES
   Monday - Friday
   ============================================================ */

const weekDates = [
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
];

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/* ============================================================
   2D PUBLIC HOLIDAYS / OFF DAYS

   These affect 2D ONLY.
   They do NOT affect 3D.

   Example:

   "2026-08-04": "Public Holiday",
   "2026-08-06": "Special Holiday",

   ============================================================ */


/* ============================================================
   2D PUBLIC HOLIDAYS / OFF DAYS
   ============================================================

   These affect 2D ONLY.

   IMPORTANT:
   - Public holidays stop 2D AM/PM draws.
   - Public holidays DO NOT cancel 3D draws.
   - 3D schedule is completely independent.

   2026 Myanmar Public Holidays
   ============================================================ */

const twoDOffDays: Record<string, string> = {
  /* January */

  "2026-01-01": "New Year's Day",
  "2026-01-02": "New Year Holiday",

  "2026-01-04": "Independence Day",

  /* February */

  "2026-02-12": "Union Day",
  "2026-02-13": "Union Day Holiday",

  "2026-02-16": "Chinese New Year",
  "2026-02-17": "Chinese New Year Holiday",

  /* March */

  "2026-03-02": "Peasants' Day / Full Moon Day of Tabaung",

  "2026-03-27": "Armed Forces Day",
  /* May */

  "2026-05-01": "Labour Day",

  "2026-05-28": "Eid Al-Adha",

  /* July */

  "2026-07-19": "Martyrs' Day",
  /* December */

  "2026-12-04": "National Day",

  "2026-12-25": "Christmas Day",
};


/* ============================================================
   2D RESULTS

   2D has:
   - AM
   - PM
   - Set
   - Value

   ============================================================ */

const twoDResults: Record<
  string,
  {
    morning: Result2D;
    evening: Result2D;
  }
> = {
  "2026-08-03": {
    morning: {
      result: "08",
      setValue: "223.34",
      value: "90.12",
    },
    evening: {
      result: "74",
      setValue: "112.23",
      value: "89.01",
    },
  },

  "2026-08-04": {
    morning: {
      result: "19",
      setValue: "901.23",
      value: "78.90",
    },
    evening: {
      result: "63",
      setValue: "890.12",
      value: "67.89",
    },
  },

  "2026-08-05": {
    morning: {
      result: "45",
      setValue: "789.01",
      value: "56.78",
    },
    evening: {
      result: "81",
      setValue: "678.90",
      value: "34.56",
    },
  },

  "2026-08-06": {
    morning: {
      result: "36",
      setValue: "567.89",
      value: "23.45",
    },
    evening: {
      result: "92",
      setValue: "345.67",
      value: "78.90",
    },
  },

  "2026-08-07": {
    morning: {
      result: "14",
      setValue: "234.56",
      value: "45.67",
    },
    evening: {
      result: "58",
      setValue: "456.78",
      value: "12.34",
    },
  },
};

/* ============================================================
   BUILD WEEKLY 2D RESULTS

   2D is completely independent from 3D.

   ============================================================ */

const weekly2DResults: Weekly2D[] = weekDates.map(
  (date, index) => {
    const isOffDay = Object.prototype.hasOwnProperty.call(
      twoDOffDays,
      date,
    );

    return {
      date,
      day: dayNames[index],

      morning: isOffDay
        ? null
        : twoDResults[date]?.morning ?? null,

      evening: isOffDay
        ? null
        : twoDResults[date]?.evening ?? null,
    };
  },
);

/* ============================================================
   3D RESULTS

   3D is completely independent from 2D.

   3D:
   - No AM
   - No PM
   - No Set
   - No Value
   - One winning number
   - Scheduled independently

   Example: two 3D draws per month.
   ============================================================ */

const threeDDraws: Record<string, Result3D> = {
  "2026-08-03": {
    result: "428",
  },

  "2026-08-17": {
    result: "562",
  },

  "2026-09-01": {
    result: "731",
  },

  "2026-09-16": {
    result: "284",
  },

  "2026-10-01": {
    result: "915",
  },

  "2026-10-16": {
    result: "367",
  },
};

/* ============================================================
   3D DRAW DATES

   Separate from weekly 2D results.
   ============================================================ */

const threeDDrawDates = [
  "2026-08-03",
  "2026-08-17",
  "2026-09-01",
  "2026-09-16",
  "2026-10-01",
  "2026-10-16",
];

const getDayName = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  );
};

/* ============================================================
   BUILD 3D RESULTS

   3D is NOT connected to 2D weekly data.
   ============================================================ */

const weekly3DResults: ThreeDDraw[] =
  threeDDrawDates.map((date) => ({
    date,
    day: getDayName(date),
    result: threeDDraws[date]?.result ?? null,
  }));

  

/* ============================================================
   PUBLIC HOLIDAYS

   These are 2D off-days only.

   IMPORTANT:
   Public holidays do NOT cancel 3D draws.

   ============================================================ */

/* ============================================================
   PUBLIC HOLIDAY TABLE DATA
   ============================================================

   Generated from twoDOffDays so that:

   twoDOffDays
        ↓
   Public Holiday Table

   This prevents duplicate holiday data.

   IMPORTANT:
   These holidays affect 2D only.
   They do NOT affect 3D.
   ============================================================ */

const publicHolidays: PublicHoliday[] = Object.entries(
  twoDOffDays,
)
  .map(([date, name]) => ({
    date,
    day: getDayName(date),
    name,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));


/* ============================================================
   LATEST 2D RESULTS
   ============================================================ */

const latest2DResults: Latest2DResult[] = [
  {
    id: 1,
    date: "2026-08-07",
    session: "PM",
    result: "58",
    setValue: "456.78",
    value: "12.34",
  },

  {
    id: 2,
    date: "2026-08-07",
    session: "AM",
    result: "14",
    setValue: "234.56",
    value: "45.67",
  },
];

/* ============================================================
   LATEST 3D RESULTS

   The first item is the latest 3D result.
   ============================================================ */

const latest3DResults: Latest3DResult[] = [
  {
    id: 1,
    date: "2026-08-03",
    result: "428",
  },

  {
    id: 2,
    date: "2026-07-16",
    result: "615",
  },

  {
    id: 3,
    date: "2026-07-01",
    result: "392",
  },
];

/* ============================================================
   2D RESULT CARD
   ============================================================ */

function TwoDResultCard({
  title,
  session,
  result,
  setValue,
  value,
}: {
  title: string;
  session: Session2D;
  result: string;
  setValue: string;
  value: string;
}) {
  const isMorning = session === "AM";

  return (
    <div
      className={`rounded-xl border p-5 ${
        isMorning
          ? "border-yellow-200 bg-yellow-50/40"
          : "border-indigo-200 bg-indigo-50/40"
      }`}
    >
      {/* Header */}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
              isMorning
                ? "bg-yellow-100 text-yellow-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {session}
          </span>

          <div>
            <p className="font-semibold text-gray-800">
              {title}
            </p>

            <p className="text-xs text-gray-500">
              2D {session} Draw
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          Published
        </span>
      </div>

      {/* Result */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">
            Winning Number
          </p>

          <p
            className={`text-5xl font-bold mt-1 tracking-wider ${
              isMorning
                ? "text-yellow-700"
                : "text-indigo-700"
            }`}
          >
            {result}
          </p>
        </div>

        {/* Set / Value */}

        <div className="text-right">
          <p className="text-xs text-gray-500">
            Set
          </p>

          <p className="text-sm font-semibold text-gray-700">
            {setValue}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Value
          </p>

          <p className="text-sm font-semibold text-gray-700">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2D OFF DAY CARD
   ============================================================ */

function TwoDOffDayCard({
  holidayName,
}: {
  holidayName?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
            2D
          </span>

          <div>
            <h4 className="font-bold text-red-800">
              2D Draw Off Day
            </h4>

            <p className="text-sm text-red-600 mt-1">
              {holidayName ||
                "No 2D draw on this date."}
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
          OFF DAY
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   3D RESULT CARD

   IMPORTANT:
   - No AM / PM
   - No Set
   - No Value
   ============================================================ */

function ThreeDResultCard({
  date,
  day,
  result,
}: {
  date: string;
  day: string;
  result: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}

      <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {day}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {date}
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            3D DRAW
          </span>
        </div>
      </div>

      {/* Result */}

      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">
          3D Winning Number
        </p>

        <p className="text-6xl md:text-7xl font-bold text-emerald-600 mt-3 tracking-widest">
          {result}
        </p>

        <p className="text-xs text-gray-400 mt-4">
          One result per scheduled 3D draw
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   NO 3D DRAW CARD
   ============================================================ */

function NoThreeDDraw() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">
          3D
        </span>

        <div>
          <h4 className="font-semibold text-gray-700">
            No 3D Draw
          </h4>

          <p className="text-xs text-gray-500 mt-1">
            There is no scheduled 3D draw on this
            date.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */

export default function Home() {
  /*
   * Latest 3D result.
   *
   * The first item in latest3DResults is treated
   * as the latest published 3D result.
   */
  const latest3DResult = latest3DResults[0];

  return (
    <div>
      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <p className="text-blue-100 mb-3">
              2D & 3D Lottery Management System
            </p>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Check the Latest Lottery Results
            </h1>

            <p className="mt-5 text-lg text-blue-100">
              View daily 2D results, scheduled 3D
              results, and public holidays.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/results-history"
                className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                View Results
              </Link>

              <Link
                to="/register"
                className="px-6 py-3 border border-white rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          LATEST RESULTS
          ------------------------------------------------------
          Contains:
          - Latest 2D AM
          - Latest 2D PM
          - Latest 3D
          ====================================================== */}

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Latest Results
            </h2>

            <p className="text-gray-500 mt-1">
              Latest published 2D and 3D lottery
              results
            </p>
          </div>

          <Link
            to="/results-history"
            className="text-blue-600 hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ==================================================
              LATEST 2D RESULTS
              ================================================== */}

          {latest2DResults.map((item) => (
            <div
              key={`2d-${item.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.session === "AM"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    2D {item.session}
                  </span>

                  <p className="text-sm text-gray-500 mt-2">
                    {item.date}
                  </p>

                  <h3 className="font-semibold mt-1">
                    {item.session === "AM"
                      ? "Morning Draw"
                      : "Evening Draw"}
                  </h3>
                </div>

                <span className="h-fit px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  Published
                </span>
              </div>

              {/* Winning Number */}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Winning Number
                </p>

                <p
                  className={`text-6xl font-bold mt-2 tracking-wider ${
                    item.session === "AM"
                      ? "text-yellow-600"
                      : "text-indigo-600"
                  }`}
                >
                  {item.result}
                </p>
              </div>

              {/* Set / Value */}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">
                    Set
                  </p>

                  <p className="font-semibold mt-1">
                    {item.setValue}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">
                    Value
                  </p>

                  <p className="font-semibold mt-1">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* ==================================================
              LATEST 3D RESULT

              IMPORTANT:
              No AM / PM
              No Set / Value
              ================================================== */}

          {latest3DResult && (
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
              {/* Header */}

              <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-100">
                <div className="flex justify-between gap-3">
                  <div>
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      3D
                    </span>

                    <p className="text-sm text-gray-500 mt-2">
                      {latest3DResult.date}
                    </p>

                    <h3 className="font-semibold text-gray-800 mt-1">
                      3D Draw
                    </h3>
                  </div>

                  <span className="h-fit px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Published
                  </span>
                </div>
              </div>

              {/* 3D Winning Number */}

              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">
                  Latest 3D Winning Number
                </p>

                <p className="text-6xl md:text-7xl font-bold text-emerald-600 mt-3 tracking-widest">
                  {latest3DResult.result}
                </p>

                <p className="text-xs text-gray-400 mt-5">
                  One winning number per 3D draw
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          2D WEEKLY RESULTS
          ====================================================== */}

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                2D Weekly Results
              </h2>

              <p className="text-gray-500 mt-1">
                Monday to Friday — AM and PM
              </p>
            </div>

            <Link
              to="/results-history"
              className="text-blue-600 hover:underline font-medium"
            >
              View Full History
            </Link>
          </div>

          <div className="space-y-5">
            {weekly2DResults.map((day) => {
              const holidayName =
                twoDOffDays[day.date];

              const isOffDay =
                Object.prototype.hasOwnProperty.call(
                  twoDOffDays,
                  day.date,
                );

              return (
                <div
                  key={day.date}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Date Header */}

                  <div className="px-5 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {day.day}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {day.date}
                        </p>
                      </div>

                      {isOffDay ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          OFF DAY
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          2D
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}

                  <div className="p-5">
                    {isOffDay ? (
                      <TwoDOffDayCard
                        holidayName={holidayName}
                      />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* AM */}

                        {day.morning ? (
                          <TwoDResultCard
                            title="Morning"
                            session="AM"
                            result={
                              day.morning.result
                            }
                            setValue={
                              day.morning.setValue
                            }
                            value={
                              day.morning.value
                            }
                          />
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <p className="text-sm text-gray-500">
                              No AM result
                            </p>
                          </div>
                        )}

                        {/* PM */}

                        {day.evening ? (
                          <TwoDResultCard
                            title="Evening"
                            session="PM"
                            result={
                              day.evening.result
                            }
                            setValue={
                              day.evening.setValue
                            }
                            value={
                              day.evening.value
                            }
                          />
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                            <p className="text-sm text-gray-500">
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

      {/* ======================================================
          3D RESULTS
          ------------------------------------------------------
          Completely independent from 2D.
          No AM / PM.
          No Set / Value.
          ====================================================== */}

      <section className="bg-gray py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                3D Results
              </h2>

              <p className="text-gray-500 mt-1">
                Scheduled 3D lottery draws with one
                winning number per draw
              </p>
            </div>

            <Link
              to="/results-history"
              className="text-blue-600 hover:underline font-medium"
            >
              View Full History
            </Link>
          </div>

          {/* 3D Result Grid */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weekly3DResults.map((draw) =>
              draw.result ? (
                <ThreeDResultCard
                  key={draw.date}
                  date={draw.date}
                  day={draw.day}
                  result={draw.result}
                />
              ) : (
                <NoThreeDDraw key={draw.date} />
              ),
            )}
          </div>
        </div>
      </section>

     
      {/* ======================================================
          PUBLIC HOLIDAY
          ------------------------------------------------------
          2D holidays only.
          This section is AFTER 3D results.
          ====================================================== */}

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">

          {/* Section Header */}

          <div className="mb-6">
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl">
                📅
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Public Holiday
                </h2>

                <p className="text-gray-500 mt-1">
                  2D draw off-days and public holidays
                </p>
              </div>

            </div>
          </div>

          {/* No Holidays */}

          {publicHolidays.length === 0 ? (

            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">

              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">
                ✓
              </div>

              <p className="font-semibold text-gray-700 mt-4">
                No public holidays
              </p>

              <p className="text-sm text-gray-500 mt-1">
                There are no configured 2D public holidays
                at this time.
              </p>

            </div>

          ) : (

            <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[650px]">

                  {/* ==================================================
                      TABLE HEADER
                      ================================================== */}

                  <thead>

                    <tr className="bg-red-50 border-b border-red-200">

                      <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                        Day
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-red-800">
                        Holiday
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-semibold text-red-800">
                        2D Status
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
                        className={`
                          border-b border-red-100
                          transition-colors
                          hover:bg-red-50
                          ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-red-50/30"
                          }
                        `}
                      >

                        {/* DATE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                              📅
                            </div>

                            <span className="text-sm font-semibold text-gray-800">
                              {holiday.date}
                            </span>

                          </div>

                        </td>

                        {/* DAY */}

                        <td className="px-5 py-4">

                          <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                            {holiday.day}
                          </span>

                        </td>

                        {/* HOLIDAY NAME */}

                        <td className="px-5 py-4">

                          <div>

                            <p className="text-sm font-semibold text-gray-800">
                              {holiday.name}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              2D draw is not available
                            </p>

                          </div>

                        </td>

                        {/* 2D STATUS */}

                        <td className="px-5 py-4 text-center">

                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">

                            <span className="w-2 h-2 rounded-full bg-red-500" />

                            2D OFF

                          </span>

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
            
      {/* ======================================================
          LOTTERY INFORMATION
          ====================================================== */}

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Lottery Information
            </h2>

            <p className="text-gray-500 mt-1">
              Important information about 2D and 3D draw schedules
              and public holidays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ==================================================
                2D DRAW SCHEDULE
                ================================================== */}

            <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  2D
                </div>

                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  MON – FRI
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-800 mt-5">
                2D Draw Schedule
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                2D lottery results are published twice on
                scheduled weekdays.
              </p>

              <div className="mt-5 space-y-3">

                {/* AM */}

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div>
                    <p className="text-xs text-gray-500">
                      Morning
                    </p>

                    <p className="font-semibold text-yellow-700">
                      2D AM
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    Scheduled
                  </span>
                </div>

                {/* PM */}

                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div>
                    <p className="text-xs text-gray-500">
                      Evening
                    </p>

                    <p className="font-semibold text-indigo-700">
                      2D PM
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    Scheduled
                  </span>
                </div>

              </div>

              <p className="text-xs text-gray-400 mt-4">
                Public holidays may affect 2D draws.
              </p>
            </div>

            {/* ==================================================
                3D DRAW SCHEDULE
                ================================================== */}

            <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  3D
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  SCHEDULED
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-800 mt-5">
                3D Draw Schedule
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                3D draws are scheduled independently from the
                daily 2D draws.
              </p>

              <div className="mt-5 space-y-3">

                {/* Draw Information */}

                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-gray-500">
                    Draw Type
                  </p>

                  <p className="font-semibold text-emerald-700 mt-1">
                    Scheduled 3D Draw
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    Result
                  </p>

                  <p className="font-semibold text-gray-700 mt-1">
                    One 3-digit winning number
                  </p>
                </div>

              </div>

              <p className="text-xs text-gray-400 mt-4">
                3D draws are not automatically cancelled by
                2D public holidays.
              </p>
            </div>

            {/* ==================================================
                PUBLIC HOLIDAYS
                ================================================== */}

            <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  📅
                </div>

                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                  2D OFF DAY
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-800 mt-5">
                Public Holidays
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Public holidays and special holidays that affect
                the 2D draw schedule.
              </p>

              <div className="mt-5 space-y-3">

                {/* Holiday Rule */}

                <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs text-gray-500">
                    2D
                  </p>

                  <p className="font-semibold text-red-700 mt-1">
                    No 2D Draw
                  </p>
                </div>

                {/* 3D Rule */}

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    3D
                  </p>

                  <p className="font-semibold text-gray-700 mt-1">
                    Schedule Independently
                  </p>
                </div>

              </div>

              <p className="text-xs text-gray-400 mt-4">
                Check the Public Holiday table above for
                configured holiday dates.
              </p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}

