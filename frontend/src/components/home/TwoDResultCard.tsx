import type { Session2D } from "@/types/lottery";

interface TwoDResultCardProps {
  title: string;
  session: Session2D;
  result: string;
}

export default function TwoDResultCard({
  title,
  session,
  result,
}: TwoDResultCardProps) {
  const isMorning = session === "AM";

  return (
    <div
      className={`rounded-xl border p-5 ${
        isMorning
          ? "border-yellow-200 bg-yellow-50/40"
          : "border-indigo-200 bg-indigo-50/40"
      }`}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
              isMorning
                ? "bg-yellow-100 text-yellow-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {session}
          </span>

          <div>
            <p className="font-semibold text-gray-800">{title}</p>

            <p className="text-xs text-gray-500">2D {session} Draw</p>
          </div>
        </div>

        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
          Published
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">Winning Number</p>

          <p
            className={`mt-1 text-5xl font-bold tracking-wider ${
              isMorning ? "text-yellow-700" : "text-indigo-700"
            }`}
          >
            {result}
          </p>
        </div>
      </div>
    </div>
  );
}
