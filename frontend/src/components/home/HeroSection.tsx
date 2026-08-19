import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Sparkles, ArrowRight, CalendarDays } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type HeroSlide = {
  id: number;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  primaryText: string;
  primaryLink: string;
  secondaryText: string;
  secondaryLink: string;
  type: "2D" | "3D" | "RESULT";
};

/* ============================================================
   SLIDES
============================================================ */

const slides: HeroSlide[] = [
  {
    id: 1,
    badge: "DAILY 2D RESULTS",
    title: "Check Today's",
    highlight: "2D Results",
    description:
      "Stay updated with the latest AM and PM 2D lottery results. Play 2D with a 7× winning payout.",
    primaryText: "View Results",
    primaryLink: "/results-history",
    secondaryText: "Create Account",
    secondaryLink: "/register",
    type: "2D",
  },

  {
    id: 2,
    badge: "SCHEDULED 3D DRAW",
    title: "Your Next Lucky",
    highlight: "3D Number",
    description:
      "Check upcoming 3D draw dates and discover the latest winning numbers. 3D offers a 500× winning payout.",
    primaryText: "View 3D Results",
    primaryLink: "/results-history",
    secondaryText: "Create Account",
    secondaryLink: "/register",
    type: "3D",
  },

  {
    id: 3,
    badge: "LOTTERY RESULTS",
    title: "Everything You Need",
    highlight: "In One Place",
    description:
      "View 2D and 3D results, schedules, lucky numbers, and important lottery information.",
    primaryText: "View Results",
    primaryLink: "/results-history",
    secondaryText: "Get Started",
    secondaryLink: "/register",
    type: "RESULT",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  /* ============================================================
     AUTO PLAY
  ============================================================ */

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((current) => {
        if (current === slides.length - 1) {
          return 0;
        }

        return current + 1;
      });
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, [paused]);

  const slide = slides[currentSlide];

  /* ============================================================
     RENDER NUMBER VISUAL
  ============================================================ */

  const renderVisual = () => {
    /* ==========================================================
       2D VISUAL
    ========================================================== */

    if (slide.type === "2D") {
      return (
        <div className="relative flex h-full min-h-[220px] items-center justify-center">
          {/* Glow */}

          <div className="absolute h-52 w-52 rounded-full bg-white/10 blur-2xl" />

          {/* Main Content */}

          <div className="relative text-center">
            <p className="text-xs font-semibold tracking-[0.35em] text-indigo-100">
              TODAY'S
            </p>

            <p
              className="
                mt-1
                text-[100px]
                font-black
                leading-none
                tracking-tighter
                text-white
                drop-shadow-2xl
                sm:text-[125px]
              "
            >
              2D
            </p>

            {/* AM / PM */}

            <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              <span className="text-xs font-semibold text-white">AM & PM</span>
            </div>

            {/* 7X */}

            <div
              className="
                mx-auto
                mt-4
                flex
                w-fit
                items-baseline
                gap-1
                rounded-2xl
                border
                border-amber-200/30
                bg-amber-300/10
                px-5
                py-2
                shadow-lg
                backdrop-blur-md
              "
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-100">
                Win
              </span>

              <span className="text-3xl font-black leading-none text-amber-200">
                7×
              </span>
            </div>
          </div>

          {/* Floating Card */}

          <div
            className="
              absolute
              bottom-5
              right-2
              rounded-xl
              border
              border-white/20
              bg-white/10
              px-4
              py-3
              shadow-xl
              backdrop-blur-md
              sm:right-8
            "
          >
            <p className="text-[10px] uppercase tracking-wide text-indigo-100">
              Results
            </p>

            <p className="mt-0.5 text-sm font-bold text-white">Updated Daily</p>
          </div>
        </div>
      );
    }

    /* ==========================================================
       3D VISUAL
    ========================================================== */

    if (slide.type === "3D") {
      return (
        <div className="relative flex h-full min-h-[220px] items-center justify-center">
          {/* Glow */}

          <div className="absolute h-56 w-56 rounded-full bg-violet-300/10 blur-3xl" />

          {/* Main Content */}

          <div className="relative text-center">
            <p className="text-xs font-semibold tracking-[0.35em] text-violet-100">
              LUCKY
            </p>

            {/* 3D */}

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-[78px] font-black leading-none text-white drop-shadow-2xl sm:text-[100px]">
                3
              </span>

              <span className="text-[78px] font-black leading-none text-amber-200 drop-shadow-2xl sm:text-[100px]">
                D
              </span>
            </div>

            {/* Scheduled Draw */}

            <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <CalendarDays className="h-3.5 w-3.5 text-amber-200" />

              <span className="text-xs font-semibold text-white">
                Scheduled Draw
              </span>
            </div>

            {/* 500X */}

            <div
              className="
                mx-auto
                mt-4
                flex
                w-fit
                items-baseline
                gap-1
                rounded-2xl
                border
                border-amber-200/30
                bg-amber-300/10
                px-5
                py-2
                shadow-lg
                backdrop-blur-md
              "
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-100">
                Win
              </span>

              <span className="text-3xl font-black leading-none text-amber-200">
                500×
              </span>
            </div>
          </div>

          {/* Decorative circles */}

          <div className="absolute right-3 top-6 h-8 w-8 rounded-full border border-white/20" />

          <div className="absolute bottom-8 left-5 h-5 w-5 rounded-full bg-amber-200/20" />
        </div>
      );
    }

    /* ==========================================================
       RESULTS VISUAL
    ========================================================== */

    return (
      <div className="relative flex h-full min-h-[220px] items-center justify-center">
        {/* Glow */}

        <div className="absolute h-60 w-60 rounded-full bg-amber-300/10 blur-3xl" />

        {/* Trophy */}

        <div className="relative text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
            <Trophy className="h-10 w-10 text-amber-200" />
          </div>

          <p className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            2D <span className="text-amber-200">&</span> 3D
          </p>

          <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-indigo-100">
            Lottery Results
          </p>

          {/* Multipliers */}

          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <span className="text-xs font-semibold text-indigo-100">2D</span>

              <span className="ml-1 text-lg font-black text-amber-200">7×</span>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <span className="text-xs font-semibold text-indigo-100">3D</span>

              <span className="ml-1 text-lg font-black text-amber-200">
                500×
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section className="w-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            from-indigo-950
            via-indigo-800
            to-violet-700
            shadow-xl
            shadow-indigo-200/50
          "
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* ==================================================
              BACKGROUND DECORATION
          ================================================== */}

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-400/10" />

            <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-400/10" />

            <div className="absolute left-1/4 top-1/2 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="absolute right-1/3 top-10 h-2 w-2 rounded-full bg-amber-200/70" />

            <div className="absolute right-1/4 bottom-14 h-1.5 w-1.5 rounded-full bg-white/50" />

            <div className="absolute left-1/2 top-20 h-1.5 w-1.5 rounded-full bg-violet-200/50" />
          </div>

          {/* ==================================================
              SLIDER
          ================================================== */}

          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {slides.map((item) => (
                <div key={item.id} className="w-full shrink-0">
                  <div
                    className="
                      grid
                      min-h-[370px]
                      grid-cols-1
                      lg:grid-cols-[1.2fr_0.8fr]
                    "
                  >
                    {/* ==================================================
                        LEFT CONTENT
                    ================================================== */}

                    <div
                      className="
                        relative
                        z-10
                        flex
                        flex-col
                        justify-center
                        px-6
                        py-9
                        sm:px-10
                        lg:px-12
                      "
                    >
                      {/* Badge */}

                      <div
                        className="
                          mb-4
                          inline-flex
                          w-fit
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-white/15
                          bg-white/10
                          px-3
                          py-1.5
                          text-[11px]
                          font-bold
                          tracking-wide
                          text-white
                          backdrop-blur-md
                        "
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />

                        {item.badge}
                      </div>

                      {/* Heading */}

                      <h1
                        className="
                          max-w-xl
                          text-3xl
                          font-black
                          leading-[1.08]
                          tracking-tight
                          text-white
                          sm:text-4xl
                          lg:text-5xl
                        "
                      >
                        {item.title}

                        <span
                          className="
                            mt-1
                            block
                            bg-gradient-to-r
                            from-amber-200
                            via-white
                            to-violet-200
                            bg-clip-text
                            text-transparent
                          "
                        >
                          {item.highlight}
                        </span>
                      </h1>

                      {/* Description */}

                      <p
                        className="
                          mt-4
                          max-w-lg
                          text-sm
                          leading-6
                          text-indigo-100
                          sm:text-base
                        "
                      >
                        {item.description}
                      </p>

                      {/* ==================================================
                          MULTIPLIER INFORMATION
                      ================================================== */}

                      {item.type !== "RESULT" && (
                        <div className="mt-4 flex items-center gap-3">
                          {item.type === "2D" ? (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-white/10 px-3 py-2 backdrop-blur-md">
                              <span className="text-xs font-medium text-indigo-100">
                                2D Winning Payout
                              </span>

                              <span className="text-lg font-black text-amber-200">
                                7×
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-white/10 px-3 py-2 backdrop-blur-md">
                              <span className="text-xs font-medium text-indigo-100">
                                3D Winning Payout
                              </span>

                              <span className="text-lg font-black text-amber-200">
                                500×
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Buttons */}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to={item.primaryLink}
                          className="
                            group
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-white
                            px-5
                            py-3
                            text-sm
                            font-bold
                            text-indigo-800
                            shadow-lg
                            shadow-indigo-950/20
                            transition
                            hover:-translate-y-0.5
                            hover:bg-indigo-50
                          "
                        >
                          {item.primaryText}

                          <ArrowRight
                            className="
                              h-4
                              w-4
                              transition
                              group-hover:translate-x-0.5
                            "
                          />
                        </Link>

                        <Link
                          to={item.secondaryLink}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/25
                            bg-white/10
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            backdrop-blur-md
                            transition
                            hover:bg-white
                            hover:text-indigo-800
                          "
                        >
                          <Sparkles className="h-4 w-4" />

                          {item.secondaryText}
                        </Link>
                      </div>

                      {/* Bottom information */}

                      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-indigo-100">
                        <span className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300">✓</span>
                          Daily 2D
                        </span>

                        <span className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300">✓</span>
                          Scheduled 3D
                        </span>

                        <span className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-300">✓</span>
                          Updated Results
                        </span>
                      </div>
                    </div>

                    {/* ==================================================
                        RIGHT VISUAL
                    ================================================== */}

                    <div
                      className="
                        relative
                        hidden
                        overflow-hidden
                        border-l
                        border-white/10
                        bg-black/5
                        lg:block
                      "
                    >
                      {renderVisual()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================
              PROGRESS INDICATOR
          ================================================== */}

          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 sm:right-8">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`
                  h-1.5
                  rounded-full
                  transition-all
                  duration-500
                  ${
                    currentSlide === index
                      ? "w-8 bg-white"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  }
                `}
              />
            ))}
          </div>

          {/* ==================================================
              MOBILE VISUAL ACCENT
          ================================================== */}

          <div className="pointer-events-none absolute right-3 top-3 opacity-10 lg:hidden">
            <Trophy className="h-28 w-28 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
