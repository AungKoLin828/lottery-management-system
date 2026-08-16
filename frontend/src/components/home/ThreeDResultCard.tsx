interface ThreeDResultCardProps {
  date: string;
  day: string;
  result: string;
}

export default function ThreeDResultCard({
  date,
  day,
  result,
}: ThreeDResultCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            {/* 3D Badge */}
            <span className="inline-flex rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              3D
            </span>

            {/* Day */}
            <h3 className="mt-1.5 text-sm font-bold text-slate-800">
              {day}
            </h3>

            {/* Date */}
            <p className="mt-0.5 text-xs text-slate-400">
              {date}
            </p>
          </div>

          {/* Draw Badge */}
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            3D DRAW
          </span>
        </div>
      </div>

      {/* Result */}
      <div className="p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          3D Winning Number
        </p>

        {/* Number */}
        <div className="mx-auto mt-2 flex h-16 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md ring-4 ring-amber-100">
          <p className="text-3xl font-extrabold tracking-widest text-white">
            {result}
          </p>
        </div>

        {/* Description */}
        <p className="mt-3 text-[10px] text-slate-400">
          One result per scheduled 3D draw
        </p>
      </div>
    </div>
  );
}