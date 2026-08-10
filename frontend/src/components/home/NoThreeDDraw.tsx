interface NoThreeDDrawProps {
  date: string;
  day: string;
}

export default function NoThreeDDraw({ date, day }: NoThreeDDrawProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-500">
              3D
            </div>

            <div>
              <h4 className="font-semibold text-gray-700">No 3D Draw</h4>

              <p className="mt-1 text-xs text-gray-500">
                {day} · {date}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            NOT SCHEDULED
          </span>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          There is no scheduled 3D draw on this date.
        </p>
      </div>
    </div>
  );
}
