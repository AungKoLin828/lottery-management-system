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
    <section className="w-full bg-purple-50/40 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-lg shadow-sm">
              🍀
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Today's Lucky Numbers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Random lucky-number suggestions for today
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            DISCLAIMER
        ================================================== */}

        <div className="mb-4 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="text-base">💡</span>

            <div>
              <p className="text-xs font-semibold text-purple-800">
                Lucky Number Suggestions
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-purple-700">
                These numbers are randomly generated for entertainment
                purposes only. They are not official lottery results and do
                not guarantee any outcome.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            LUCKY NUMBER CARDS
        ================================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* ==================================================
              2D AM
          ================================================== */}

          <div className="overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
            {/* Header */}

            <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                    AM
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400">
                      2D
                    </p>

                    <h3 className="text-sm font-bold text-slate-800">
                      Morning Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                  2D AM
                </span>
              </div>
            </div>

            {/* Number */}

            <div className="p-4 text-center">
              <p className="text-[11px] text-slate-400">
                Today's Lucky Number
              </p>

              <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 ring-4 ring-purple-100">
                <p className="text-3xl font-extrabold tracking-widest text-purple-700">
                  {todayLuckyNumbers.twoDAM}
                </p>
              </div>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================
              2D PM
          ================================================== */}

          <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
            {/* Header */}

            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                    PM
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400">
                      2D
                    </p>

                    <h3 className="text-sm font-bold text-slate-800">
                      Evening Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  2D PM
                </span>
              </div>
            </div>

            {/* Number */}

            <div className="p-4 text-center">
              <p className="text-[11px] text-slate-400">
                Today's Lucky Number
              </p>

              <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 ring-4 ring-violet-100">
                <p className="text-3xl font-extrabold tracking-widest text-violet-700">
                  {todayLuckyNumbers.twoDPM}
                </p>
              </div>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================
              3D
          ================================================== */}

          <div className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
            {/* Header */}

            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                    3D
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400">
                      3D
                    </p>

                    <h3 className="text-sm font-bold text-slate-800">
                      3D Lucky Number
                    </h3>
                  </div>
                </div>

                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  3D
                </span>
              </div>
            </div>

            {/* Number */}

            <div className="p-4 text-center">
              <p className="text-[11px] text-slate-400">
                Today's Lucky Number
              </p>

              <div className="mx-auto mt-2 flex h-20 min-w-[92px] w-fit items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 shadow-md ring-4 ring-indigo-100">
                <p className="text-3xl font-extrabold tracking-widest text-white">
                  {todayLuckyNumbers.threeD}
                </p>
              </div>

              <div className="mt-3">
                <span className="inline-flex rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                  Random Suggestion
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            BOTTOM DISCLAIMER
        ================================================== */}

        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400">
            🍀 Lucky numbers are randomly generated and are not official
            lottery results.
          </p>
        </div>
      </div>
    </section>
  );
}