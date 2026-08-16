import TwoDScheduleCard from "./TwoDScheduleCard";
import ThreeDScheduleCard from "./ThreeDScheduleCard";
import PublicHolidayInfoCard from "./PublicHoliday";

export default function LotteryInformation() {
  return (
    <section className="w-full bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-5 lg:px-6">
        {/* Section Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Lottery Information
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Important information about 2D and 3D draw schedules and public
            holidays.
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid w-full grid-cols-1 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* 2D Schedule */}
          <div className="w-full rounded-lg border border-amber-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <TwoDScheduleCard />
          </div>

          {/* 3D Schedule */}
          <div className="w-full rounded-lg border border-fuchsia-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <ThreeDScheduleCard />
          </div>

          {/* Public Holidays */}
          <div className="w-full rounded-lg border border-cyan-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <PublicHolidayInfoCard />
          </div>
        </div>
      </div>
    </section>
  );
}