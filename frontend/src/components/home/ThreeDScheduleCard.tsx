export default function ThreeDScheduleCard() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg font-bold text-emerald-700">
          3D
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          SCHEDULED
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-gray-800">
        3D Draw Schedule
      </h3>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        3D draws are scheduled independently from daily 2D draws.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[11px] text-gray-500">Draw Type</p>

          <p className="mt-1 text-sm font-semibold text-emerald-700">
            Scheduled 3D
          </p>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-[11px] text-gray-500">Result</p>

          <p className="mt-1 text-sm font-semibold text-gray-700">
            3-digit number
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-4 text-gray-400">
        3D draws are not automatically cancelled by 2D public holidays.
      </p>
    </div>
  );
}
