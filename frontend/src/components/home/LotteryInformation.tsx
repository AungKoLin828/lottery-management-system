import TwoDScheduleCard from "./TwoDScheduleCard";
import ThreeDScheduleCard from "./ThreeDScheduleCard";
import PublicHolidayInfoCard from "./PublicHoliday";

export default function LotteryInformation() {
  return (
    <section className="w-full bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800">
            Lottery Information
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Important information about 2D and 3D draw schedules and public
            holidays.
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex justify-center lg:justify-start">
            <TwoDScheduleCard />
          </div>

          <div className="flex justify-center lg:justify-start">
            <ThreeDScheduleCard />
          </div>

          <div className="w-full">
            <PublicHolidayInfoCard />
          </div>
        </div>
      </div>
    </section>
  );
}
