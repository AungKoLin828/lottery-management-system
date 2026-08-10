import HeroSection from "@/components/home/HeroSection";
import LatestResults from "@/components/home/LatestResults";
import Weekly2DResults from "@/components/home/Weekly2DResults";
import ThreeDResults from "@/components/home/ThreeDResults";
import LuckyNumbers from "@/components/home/LuckyNumbers";
import PublicHoliday from "@/components/home/PublicHoliday";
import LotteryInformation from "@/components/home/LotteryInformation";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />

      <LatestResults />

      <Weekly2DResults />

      <ThreeDResults />

      <LuckyNumbers />

      {/* <PublicHoliday /> */}

      <LotteryInformation />
    </div>
  );
}
