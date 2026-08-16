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
    <section className="bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-50 text-lg">
              🍀
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Today's Lucky Numbers
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Random lucky-number suggestions for today
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="text-base">💡</span>

            <div>
              <p className="text-xs font-semibold text-cyan-800">
                Lucky Number Suggestions
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-cyan-700">
                These numbers are randomly generated for entertainment
                purposes only. They are not official lottery results and do
                not guarantee any outcome.
              </p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 2D AM */}
          <div className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Header */}
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">
                    AM
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400">2D</p>

                    <h3 className="text-sm font-bold text-gray-800">
                      Morning Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  2D AM
                </span>
              </div>
            </div>

            {/* Number */}
            <div className="p-4 text-center">
              <p className="text-[11px] text-gray-400">
                Today's Lucky Number
              </p>

              <p className="mt-1 text-4xl font-bold tracking-widest text-amber-500">
                {todayLuckyNumbers.twoDAM}
              </p>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-gray-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* 2D PM */}
          <div className="overflow-hidden rounded-lg border border-purple-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Header */}
            <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                    PM
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400">2D</p>

                    <h3 className="text-sm font-bold text-gray-800">
                      Evening Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                  2D PM
                </span>
              </div>
            </div>

            {/* Number */}
            <div className="p-4 text-center">
              <p className="text-[11px] text-gray-400">
                Today's Lucky Number
              </p>

              <p className="mt-1 text-4xl font-bold tracking-widest text-purple-600">
                {todayLuckyNumbers.twoDPM}
              </p>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-gray-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* 3D */}
          <div className="overflow-hidden rounded-lg border border-fuchsia-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Header */}
            <div className="border-b border-fuchsia-100 bg-fuchsia-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-100 text-xs font-bold text-fuchsia-700">
                    3D
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400">3D</p>

                    <h3 className="text-sm font-bold text-gray-800">
                      3D Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-700">
                  3D
                </span>
              </div>
            </div>

            {/* Number */}
            <div className="p-4 text-center">
              <p className="text-[11px] text-gray-400">
                Today's Lucky Number
              </p>

              <p className="mt-1 text-4xl font-bold tracking-widest text-fuchsia-600">
                {todayLuckyNumbers.threeD}
              </p>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-gray-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400">
            🍀 Lucky numbers are randomly generated and are not official
            lottery results.
          </p>
        </div>
      </div>
    </section>
  );
}