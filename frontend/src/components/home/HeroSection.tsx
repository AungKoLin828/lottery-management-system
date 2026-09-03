import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Sparkles,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
   CONSTANTS
============================================================ */

const AUTO_SLIDE_INTERVAL = 4500;
const SWIPE_THRESHOLD = 50;

/* ============================================================
   COMPONENT
============================================================ */

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* ============================================================
     DRAG / SWIPE REFS
  ============================================================ */

  const pointerStartX = useRef<number | null>(null);
  const pointerCurrentX = useRef<number | null>(null);
  const hasDragged = useRef(false);

  /* ============================================================
     AUTO PLAY
  ============================================================ */

  useEffect(() => {
    if (paused || isDragging) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1,
      );
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [paused, isDragging, currentSlide]);

  /* ============================================================
     GO TO SLIDE
  ============================================================ */

  const goToSlide = (index: number) => {
    if (index < 0) {
      setCurrentSlide(slides.length - 1);
      return;
    }

    if (index >= slides.length) {
      setCurrentSlide(0);
      return;
    }

    setCurrentSlide(index);
  };

  /* ============================================================
     NEXT SLIDE
  ============================================================ */

  const nextSlide = () => {
    setCurrentSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  };

  /* ============================================================
     PREVIOUS SLIDE
  ============================================================ */

  const previousSlide = () => {
    setCurrentSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  /* ============================================================
     POINTER DOWN
  ============================================================ */

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    /*
     * Do not start dragging when clicking a button or link.
     */
    const target = event.target as HTMLElement;

    if (target.closest("a, button")) {
      return;
    }

    pointerStartX.current = event.clientX;
    pointerCurrentX.current = event.clientX;
    hasDragged.current = false;

    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /* ============================================================
     POINTER MOVE
  ============================================================ */

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) {
      return;
    }

    pointerCurrentX.current = event.clientX;

    const distance = event.clientX - pointerStartX.current;

    if (Math.abs(distance) > 10) {
      hasDragged.current = true;
    }
  };

  /* ============================================================
     POINTER UP
  ============================================================ */

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) {
      setIsDragging(false);
      return;
    }

    const startX = pointerStartX.current;
    const endX = pointerCurrentX.current ?? event.clientX;

    const distance = endX - startX;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance < 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }

    pointerStartX.current = null;
    pointerCurrentX.current = null;

    setIsDragging(false);

    /*
     * Prevent accidental link/button click immediately
     * after a swipe.
     */
    if (hasDragged.current) {
      window.setTimeout(() => {
        hasDragged.current = false;
      }, 100);
    }
  };

  /* ============================================================
     POINTER CANCEL
  ============================================================ */

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerCurrentX.current = null;

    setIsDragging(false);

    hasDragged.current = false;
  };

  /* ============================================================
     PREVENT CLICK AFTER SWIPE
  ============================================================ */

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hasDragged.current) {
      event.preventDefault();
      event.stopPropagation();

      hasDragged.current = false;
    }
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

            <div className="absolute bottom-14 right-1/4 h-1.5 w-1.5 rounded-full bg-white/50" />

            <div className="absolute left-1/2 top-20 h-1.5 w-1.5 rounded-full bg-violet-200/50" />
          </div>

          {/* ==================================================
              SLIDER VIEWPORT
          ================================================== */}

          <div
            className={`
              relative
              overflow-hidden
              select-none
              ${isDragging ? "cursor-grabbing" : "cursor-grab"}
            `}
            style={{
              touchAction: "pan-y",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClickCapture={handleClickCapture}
          >
            {/* ==================================================
                SLIDE TRACK
            ================================================== */}

            <div
              className="
                flex
                transition-transform
                duration-700
                ease-out
                will-change-transform
              "
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
                          MULTIPLIER
                      ================================================== */}

                      {item.type !== "RESULT" && (
                        <div className="mt-4 flex items-center gap-3">
                          {item.type === "2D" ? (
                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-amber-200/20
                                bg-white/10
                                px-3
                                py-2
                                backdrop-blur-md
                              "
                            >
                              <span className="text-xs font-medium text-indigo-100">
                                2D Winning Payout
                              </span>

                              <span className="text-lg font-black text-amber-200">
                                7×
                              </span>
                            </div>
                          ) : (
                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-amber-200/20
                                bg-white/10
                                px-3
                                py-2
                                backdrop-blur-md
                              "
                            >
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

                      {/* ==================================================
                          BUTTONS
                      ================================================== */}

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

                      {/* ==================================================
                          BOTTOM INFORMATION
                      ================================================== */}

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
                      {/* ==================================================
                          2D VISUAL
                      ================================================== */}

                      {item.type === "2D" && (
                        <div className="relative flex h-full min-h-[220px] items-center justify-center">
                          <div className="absolute h-52 w-52 rounded-full bg-white/10 blur-2xl" />

                          <div className="relative text-center">
                            <p className="text-xs font-semibold tracking-[0.35em] text-indigo-100">
                              TODAY&apos;S
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

                            <div
                              className="
                                mx-auto
                                mt-2
                                flex
                                w-fit
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-white/20
                                bg-white/10
                                px-4
                                py-1.5
                                backdrop-blur-md
                              "
                            >
                              <span className="h-2 w-2 rounded-full bg-emerald-300" />

                              <span className="text-xs font-semibold text-white">
                                AM &amp; PM
                              </span>
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

                            <p className="mt-0.5 text-sm font-bold text-white">
                              Updated Daily
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ==================================================
                          3D VISUAL
                      ================================================== */}

                      {item.type === "3D" && (
                        <div className="relative flex h-full min-h-[220px] items-center justify-center">
                          <div className="absolute h-56 w-56 rounded-full bg-violet-300/10 blur-3xl" />

                          <div className="relative text-center">
                            <p className="text-xs font-semibold tracking-[0.35em] text-violet-100">
                              LUCKY
                            </p>

                            <div className="mt-2 flex items-center justify-center gap-2">
                              <span className="text-[78px] font-black leading-none text-white drop-shadow-2xl sm:text-[100px]">
                                3
                              </span>

                              <span className="text-[78px] font-black leading-none text-amber-200 drop-shadow-2xl sm:text-[100px]">
                                D
                              </span>
                            </div>

                            {/* Scheduled Draw */}

                            <div
                              className="
                                mx-auto
                                mt-3
                                flex
                                w-fit
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-white/20
                                bg-white/10
                                px-4
                                py-1.5
                                backdrop-blur-md
                              "
                            >
                              <CalendarDays
                                className="h-3.5 w-3.5 text-amber-200"
                                strokeWidth={2}
                              />

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
                      )}

                      {/* ==================================================
                          RESULTS VISUAL
                      ================================================== */}

                      {item.type === "RESULT" && (
                        <div className="relative flex h-full min-h-[220px] items-center justify-center">
                          <div className="absolute h-60 w-60 rounded-full bg-amber-300/10 blur-3xl" />

                          <div className="relative text-center">
                            {/* Trophy */}

                            <div
                              className="
                                mx-auto
                                flex
                                h-20
                                w-20
                                items-center
                                justify-center
                                rounded-3xl
                                border
                                border-white/20
                                bg-white/10
                                shadow-2xl
                                backdrop-blur-md
                              "
                            >
                              <Trophy
                                className="h-10 w-10 text-amber-200"
                                strokeWidth={2}
                              />
                            </div>

                            {/* Title */}

                            <p className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                              2D <span className="text-amber-200">&amp;</span>{" "}
                              3D
                            </p>

                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-indigo-100">
                              Lottery Results
                            </p>

                            {/* Multipliers */}

                            <div className="mt-4 flex items-center justify-center gap-2">
                              <div
                                className="
                                  rounded-xl
                                  border
                                  border-white/15
                                  bg-white/10
                                  px-3
                                  py-1.5
                                  backdrop-blur-md
                                "
                              >
                                <span className="text-xs font-semibold text-indigo-100">
                                  2D
                                </span>

                                <span className="ml-1 text-lg font-black text-amber-200">
                                  7×
                                </span>
                              </div>

                              <div
                                className="
                                  rounded-xl
                                  border
                                  border-white/15
                                  bg-white/10
                                  px-3
                                  py-1.5
                                  backdrop-blur-md
                                "
                              >
                                <span className="text-xs font-semibold text-indigo-100">
                                  3D
                                </span>

                                <span className="ml-1 text-lg font-black text-amber-200">
                                  500×
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================
              PREVIOUS BUTTON
          ================================================== */}

          <button
            type="button"
            aria-label="Previous slide"
            onClick={previousSlide}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="
              absolute
              left-3
              top-1/2
              z-30
              hidden
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/15
              p-2
              text-white
              shadow-lg
              backdrop-blur-md
              transition
              hover:bg-white/20
              sm:flex
            "
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
          </button>

          {/* ==================================================
              NEXT BUTTON
          ================================================== */}

          <button
            type="button"
            aria-label="Next slide"
            onClick={nextSlide}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="
              absolute
              right-3
              top-1/2
              z-30
              hidden
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/15
              p-2
              text-white
              shadow-lg
              backdrop-blur-md
              transition
              hover:bg-white/20
              sm:flex
            "
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </button>

          {/* ==================================================
              SLIDE INDICATORS
          ================================================== */}

          <div
            className="
              absolute
              bottom-4
              right-6
              z-30
              flex
              items-center
              gap-1.5
              sm:right-8
            "
          >
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                aria-current={currentSlide === index ? "true" : undefined}
                onClick={() => goToSlide(index)}
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

          {/* ==================================================
              MOBILE SWIPE HINT
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              bottom-4
              left-5
              z-20
              hidden
              items-center
              gap-1.5
              text-[9px]
              font-medium
              text-white/40
              sm:hidden
            "
          >
            <ChevronLeft className="h-3 w-3" />
            Swipe
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </section>
  );
}
