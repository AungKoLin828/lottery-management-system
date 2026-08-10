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
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Latest Results</h2>

          <p className="mt-1 text-gray-500">
            Latest published 2D and 3D lottery results
          </p>
        </div>

        <Link
          to="/results-history"
          className="font-medium text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedLatest2DResults.map((item) => (
          <div
            key={`2d-${item.id}`}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.session === "AM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  2D {item.session}
                </span>

                <p className="mt-2 text-sm text-gray-500">{item.date}</p>

                <h3 className="mt-1 font-semibold">
                  {item.session === "AM" ? "Morning Draw" : "Evening Draw"}
                </h3>
              </div>

              <span className="h-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Published
              </span>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Winning Number</p>

              <p
                className={`mt-2 text-6xl font-bold tracking-wider ${
                  item.session === "AM" ? "text-yellow-600" : "text-indigo-600"
                }`}
              >
                {item.result}
              </p>
            </div>
          </div>
        ))}

        {latest3DResult && (
          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
              <div className="flex justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    3D
                  </span>

                  <p className="mt-2 text-sm text-gray-500">
                    {latest3DResult.date}
                  </p>

                  <h3 className="mt-1 font-semibold text-gray-800">3D Draw</h3>
                </div>

                <span className="h-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Published
                </span>
              </div>
            </div>

            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Latest 3D Winning Number</p>

              <p className="mt-3 text-6xl font-bold tracking-widest text-emerald-600 md:text-7xl">
                {latest3DResult.result}
              </p>

              <p className="mt-5 text-xs text-gray-400">
                One winning number per 3D draw
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
