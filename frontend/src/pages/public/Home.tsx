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
      {/* ============================================================
          HERO
          HeroSection already contains its own max-w-6xl container.
      ============================================================ */}
      <HeroSection />

      {/* ============================================================
          HOMEPAGE CONTENT
          Shared width container for all following sections.
      ============================================================ */}
      <main className="w-full bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* ========================================================
              LATEST RESULTS
          ======================================================== */}
          <section className="py-6">
            <Suspense fallback={<SectionLoader />}>
              <LatestResults />
            </Suspense>
          </section>

          {/* ========================================================
              PUBLIC HOLIDAYS
          ======================================================== */}
          <section className="py-6">
            <Suspense fallback={<SectionLoader />}>
              <PublicHoliday />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}
