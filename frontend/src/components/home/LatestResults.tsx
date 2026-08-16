import { Link } from "react-router-dom";

import { latest2DResults, latest3DResults } from "@/data/home/lotteryData";

export default function LatestResults() {
  const sortedLatest2DResults = [...latest2DResults].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const sessionOrder = {
      AM: 1,
      PM: 2,
    };

    return sessionOrder[a.session] - sessionOrder[b.session];
  });

  const latest3DResult = latest3DResults[0];

  return (
    <section className="w-full bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Latest Results
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest published 2D and 3D lottery results
            </p>
          </div>

          <Link
            to="/results-history"
            className="text-sm font-medium text-purple-600 transition hover:text-purple-700 hover:underline"
          >
            View All
          </Link>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 2D Results */}
          {sortedLatest2DResults.map((item) => {
            const isMorning = item.session === "AM";

            return (
              <div
                key={`2d-${item.id}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {/* Session Badge */}
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isMorning
                          ? "bg-amber-50 text-amber-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      2D {item.session}
                    </span>

                    {/* Date */}
                    <p className="mt-1.5 text-xs text-gray-400">
                      {item.date}
                    </p>

                    {/* Draw Name */}
                    <h3 className="mt-0.5 text-sm font-semibold text-gray-800">
                      {isMorning ? "Morning Draw" : "Evening Draw"}
                    </h3>
                  </div>

                  {/* Published Badge */}
                  <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-600">
                    Published
                  </span>
                </div>

                {/* Winning Number */}
                <div
                  className={`mt-4 rounded-md py-3 text-center ${
                    isMorning ? "bg-amber-50" : "bg-purple-50"
                  }`}
                >
                  <p className="text-[11px] font-medium text-gray-400">
                    Winning Number
                  </p>

                  <p
                    className={`mt-1 text-4xl font-bold tracking-wider ${
                      isMorning ? "text-amber-500" : "text-purple-600"
                    }`}
                  >
                    {item.result}
                  </p>
                </div>
              </div>
            );
          })}

          {/* 3D Result */}
          {latest3DResult && (
            <div className="rounded-lg border border-fuchsia-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  {/* 3D Badge */}
                  <span className="inline-flex rounded-md bg-fuchsia-50 px-2 py-0.5 text-[11px] font-bold text-fuchsia-600">
                    3D
                  </span>

                  {/* Date */}
                  <p className="mt-1.5 text-xs text-gray-400">
                    {latest3DResult.date}
                  </p>

                  {/* Draw Name */}
                  <h3 className="mt-0.5 text-sm font-semibold text-gray-800">
                    3D Draw
                  </h3>
                </div>

                {/* Published Badge */}
                <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-600">
                  Published
                </span>
              </div>

              {/* Winning Number */}
              <div className="mt-4 rounded-md bg-fuchsia-50 py-3 text-center">
                <p className="text-[11px] font-medium text-gray-400">
                  Winning Number
                </p>

                <p className="mt-1 text-4xl font-bold tracking-widest text-fuchsia-600">
                  {latest3DResult.result}
                </p>

                <p className="mt-2 text-[10px] text-gray-400">
                  One winning number per 3D draw
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}