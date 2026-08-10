import { Link } from "react-router-dom";

import { threeDDrawDates, threeDDraws } from "@/data/home/lotteryData";

import ThreeDResultCard from "./ThreeDResultCard";
import NoThreeDDraw from "./NoThreeDDraw";

function getDayName(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

export default function ThreeDResults() {
  const weekly3DResults = threeDDrawDates.map((date) => ({
    date,
    day: getDayName(date),
    result: threeDDraws[date]?.result ?? null,
  }));

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">3D Results</h2>

            <p className="mt-1 text-gray-500">
              Scheduled 3D lottery draws with one winning number per draw
            </p>
          </div>

          <Link
            to="/results-history"
            className="font-medium text-blue-600 hover:underline"
          >
            View Full History
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {weekly3DResults.map((draw) =>
            draw.result ? (
              <ThreeDResultCard
                key={draw.date}
                date={draw.date}
                day={draw.day}
                result={draw.result}
              />
            ) : (
              <NoThreeDDraw key={draw.date} date={draw.date} day={draw.day} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
