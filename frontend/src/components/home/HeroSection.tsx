import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-blue-100">
            2D & 3D Lottery Management System
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Check the Latest Lottery Results
          </h1>

          <p className="mt-5 text-lg text-blue-100">
            View daily 2D results, scheduled 3D results, and public holidays.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/results-history"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-gray-100"
            >
              View Results
            </Link>

            <Link
              to="/register"
              className="rounded-lg border border-white px-6 py-3 font-semibold transition hover:bg-white hover:text-blue-700"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
