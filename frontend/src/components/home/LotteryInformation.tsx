import TwoDScheduleCard from "./TwoDScheduleCard";
import ThreeDScheduleCard from "./ThreeDScheduleCard";
import PublicHolidayInfoCard from "./PublicHoliday";

export default function LotteryInformation() {
  return (
    <section className="w-full bg-gradient-to-b from-purple-50/70 via-white to-white py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-5 lg:px-6">
        {/* ==================================================
            SECTION HEADER
        ================================================== */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Lottery Information
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Important information about 2D and 3D draw schedules and public
            holidays.
          </p>
        </div>

        {/* ==================================================
            INFORMATION CARDS
        ================================================== */}
        <div className="grid w-full grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* ==================================================
              2D SCHEDULE
          ================================================== */}
          <div className="w-full overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <TwoDScheduleCard />
          </div>

          {/* ==================================================
              3D SCHEDULE
          ================================================== */}
          <div className="w-full overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <ThreeDScheduleCard />
          </div>

          {/* ==================================================
              PUBLIC HOLIDAYS
          ================================================== */}
          <div className="w-full overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <PublicHolidayInfoCard />
          </div>
        </div>
      </div>
    </section>
  );
}