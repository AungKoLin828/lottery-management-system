import { Link } from "react-router-dom";

import { threeDDrawDates, threeDDraws } from "@/data/home/lotteryData";

import ThreeDResultCard from "./ThreeDResultCard";
import NoThreeDDraw from "./NoThreeDDraw";

/* ============================================================
   HELPERS
============================================================ */

function getDayName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ThreeDResults() {
  const weekly3DResults = threeDDrawDates.map((date) => ({
    date,
    day: getDayName(date),
    result: threeDDraws[date]?.result ?? null,
  }));

  return (
    <section className="w-full bg-purple-50/40 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              3D Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Scheduled 3D lottery draws with one winning number per draw
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
            3D RESULTS
        ================================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weekly3DResults.map((draw) =>
            draw.result ? (
              <ThreeDResultCard
                key={draw.date}
                date={draw.date}
                day={draw.day}
                result={draw.result}
              />
            ) : (
              <NoThreeDDraw
                key={draw.date}
                date={draw.date}
                day={draw.day}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}