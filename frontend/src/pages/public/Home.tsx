import { lazy, Suspense } from "react";

import HeroSection from "@/components/home/HeroSection";

const LatestResults = lazy(() => import("@/components/home/LatestResults"));

const PublicHoliday = lazy(() => import("@/components/home/PublicHoliday"));

function SectionLoader() {
  return (
    <div className="flex min-h-[120px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Load immediately */}
      <HeroSection />

      {/* Load after initial page rendering */}
      <Suspense fallback={<SectionLoader />}>
        <LatestResults />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <PublicHoliday />
      </Suspense>
    </div>
  );
}
