export default function TwoDScheduleCard() {
  return (
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg">
          2D
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          MON – FRI
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-gray-800">
        2D Draw Schedule
      </h3>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        2D lottery results are published twice on scheduled weekdays.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
          <p className="text-[11px] text-gray-500">Morning</p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-yellow-700">2D AM</p>

            <span className="text-[11px] font-semibold text-gray-600">
              Scheduled
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <p className="text-[11px] text-gray-500">Evening</p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-indigo-700">2D PM</p>

            <span className="text-[11px] font-semibold text-gray-600">
              Scheduled
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-4 text-gray-400">
        Public holidays may affect 2D draws.
      </p>
    </div>
  );
}
