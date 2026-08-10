interface TwoDOffDayCardProps {
  holidayName?: string;
}

export default function TwoDOffDayCard({ holidayName }: TwoDOffDayCardProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 font-bold text-red-700">
            2D
          </div>

          <div>
            <h4 className="font-bold text-red-800">2D Draw Off Day</h4>

            <p className="mt-1 text-sm text-red-600">
              {holidayName || "No 2D draw on this date."}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
          OFF DAY
        </span>
      </div>
    </div>
  );
}
