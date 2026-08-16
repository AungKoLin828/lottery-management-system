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
    <div className="overflow-hidden rounded-lg border border-fuchsia-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Header */}
      <div className="border-b border-fuchsia-100 bg-fuchsia-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="inline-flex rounded-md bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700">
              3D
            </span>

            <h3 className="mt-1.5 text-sm font-bold text-gray-800">
              {day}
            </h3>

            <p className="mt-0.5 text-xs text-gray-400">
              {date}
            </p>
          </div>

          <span className="rounded-md bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-700">
            3D DRAW
          </span>
        </div>
      </div>

      {/* Result */}
      <div className="p-4 text-center">
        <p className="text-[11px] font-medium text-gray-400">
          3D Winning Number
        </p>

        <p className="mt-1 text-4xl font-bold tracking-widest text-fuchsia-600">
          {result}
        </p>

        <p className="mt-2 text-[10px] text-gray-400">
          One result per scheduled 3D draw
        </p>
      </div>
    </div>
  );
}