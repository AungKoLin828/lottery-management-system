import { useMemo } from "react";

import { generateRandom2D, generateRandom3D } from "@/utils/lotteryNumber";

export default function LuckyNumbers() {
  const todayLuckyNumbers = useMemo(
    () => ({
      twoDAM: generateRandom2D(),
      twoDPM: generateRandom2D(),
      threeD: generateRandom3D(),
    }),
    [],
  );

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-700">
              🍀
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Today's Lucky Numbers
              </h2>

              <p className="mt-1 text-gray-500">
                Random lucky-number suggestions for today
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>

            <div>
              <p className="text-sm font-semibold text-purple-800">
                Lucky Number Suggestions
              </p>

              <p className="mt-1 text-xs text-purple-700">
                These numbers are randomly generated for entertainment purposes
                only. They are not official lottery results and do not guarantee
                any outcome.
              </p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 2D AM */}
          <div className="overflow-hidden rounded-2xl border border-yellow-200 bg-white shadow-sm">
            <div className="border-b border-yellow-100 bg-yellow-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                    AM
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">2D</p>

                    <h3 className="font-bold text-gray-800">
                      Morning Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                  2D AM
                </span>
              </div>
            </div>

            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Today's Lucky Number</p>

              <p className="mt-3 text-6xl font-bold tracking-widest text-yellow-600">
                {todayLuckyNumbers.twoDAM}
              </p>

              <div className="mt-5">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* 2D PM */}
          <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-indigo-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                    PM
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">2D</p>

                    <h3 className="font-bold text-gray-800">
                      Evening Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  2D PM
                </span>
              </div>
            </div>

            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Today's Lucky Number</p>

              <p className="mt-3 text-6xl font-bold tracking-widest text-indigo-600">
                {todayLuckyNumbers.twoDPM}
              </p>

              <div className="mt-5">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* 3D */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                    3D
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">3D</p>

                    <h3 className="font-bold text-gray-800">3D Lucky Number</h3>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  3D
                </span>
              </div>
            </div>

            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Today's Lucky Number</p>

              <p className="mt-3 text-6xl font-bold tracking-widest text-emerald-600">
                {todayLuckyNumbers.threeD}
              </p>

              <div className="mt-5">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🍀 Lucky numbers are randomly generated and are not official lottery
            results.
          </p>
        </div>
      </div>
    </section>
  );
}
