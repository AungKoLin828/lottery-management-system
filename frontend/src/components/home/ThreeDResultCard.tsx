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
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
              3D
            </span>

            <h3 className="mt-2 font-bold text-gray-800">{day}</h3>

            <p className="mt-1 text-sm text-gray-500">{date}</p>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            3D DRAW
          </span>
        </div>
      </div>

      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">3D Winning Number</p>

        <p className="mt-3 text-6xl font-bold tracking-widest text-emerald-600 md:text-7xl">
          {result}
        </p>

        <p className="mt-4 text-xs text-gray-400">
          One result per scheduled 3D draw
        </p>
      </div>
    </div>
  );
}
