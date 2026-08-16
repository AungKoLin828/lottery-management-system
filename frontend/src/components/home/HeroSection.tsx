import { Link } from "react-router-dom";
import { Trophy, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="w-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="
            relative overflow-hidden rounded-2xl
            bg-gradient-to-br from-indigo-800 via-violet-700 to-purple-600
            px-5 py-7 text-white
            shadow-lg shadow-indigo-200/60
            sm:px-8 sm:py-9
          "
        >
          {/* ==================================================
              DECORATIVE BACKGROUND
          ================================================== */}

          {/* Top Right */}
          <div
            className="
              absolute -right-16 -top-20
              h-48 w-48 rounded-full
              bg-white/10
            "
          />

          {/* Bottom Right */}
          <div
            className="
              absolute -bottom-24 right-24
              h-56 w-56 rounded-full
              bg-violet-300/10
            "
          />

          {/* Bottom Left */}
          <div
            className="
              absolute -left-16 bottom-0
              h-36 w-36 rounded-full
              bg-indigo-300/10
            "
          />

          {/* Small Accent */}
          <div
            className="
              absolute right-20 top-10
              h-20 w-20 rounded-full
              bg-amber-300/5
            "
          />

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="relative max-w-2xl">
            {/* ==================================================
                BADGE
            ================================================== */}

            <div
              className="
                mb-3 inline-flex items-center gap-2
                rounded-full
                bg-white/10
                px-3 py-1
                text-xs font-semibold text-white
                ring-1 ring-white/20
                backdrop-blur-sm
              "
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" />

              <span>2D & 3D Lottery Results</span>
            </div>

            {/* ==================================================
                HEADING
            ================================================== */}

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Check the Latest

              <span
                className="
                  block
                  bg-gradient-to-r
                  from-amber-200
                  via-white
                  to-violet-100
                  bg-clip-text
                  text-transparent
                "
              >
                Lottery Results
              </span>
            </h1>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <p
              className="
                mt-2 max-w-xl
                text-sm leading-relaxed
                text-indigo-100
                sm:text-base
              "
            >
              Quickly check the latest 2D and 3D lottery results,
              weekly schedules, lucky numbers, and public holiday
              information.
            </p>

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <div className="mt-5 flex flex-wrap gap-3">
              {/* View Results */}

              <Link
                to="/results-history"
                className="
                  inline-flex items-center gap-2
                  rounded-lg
                  bg-white
                  px-5 py-2.5
                  text-sm font-bold
                  text-indigo-800
                  shadow-sm
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-indigo-50
                  hover:shadow-md
                "
              >
                <Trophy className="h-4 w-4 text-indigo-600" />

                View Results
              </Link>

              {/* Create Account */}

              <Link
                to="/register"
                className="
                  inline-flex items-center gap-2
                  rounded-lg
                  border border-white/40
                  bg-white/10
                  px-5 py-2.5
                  text-sm font-semibold text-white
                  backdrop-blur-sm
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-white
                  hover:text-indigo-800
                "
              >
                <Sparkles className="h-4 w-4" />

                Create Account
              </Link>
            </div>

            {/* ==================================================
                QUICK INFORMATION
            ================================================== */}

            <div
              className="
                mt-5
                flex flex-wrap
                gap-x-5 gap-y-2
                border-t border-white/20
                pt-4
                text-xs text-indigo-100
              "
            >
              <span className="flex items-center gap-1">
                <span className="font-bold text-amber-300">✓</span>
                Daily 2D Results
              </span>

              <span className="flex items-center gap-1">
                <span className="font-bold text-amber-300">✓</span>
                Scheduled 3D Draws
              </span>

              <span className="flex items-center gap-1">
                <span className="font-bold text-amber-300">✓</span>
                Weekly Information
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}