// src/pages/public/About.tsx

import {
  ShieldCheck,
  Target,
  Zap,
  Users,
  BarChart3,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

export default function About() {
  return (
    <div className="bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="border-b border-gray-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              About LotteryPlay
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Simple, transparent and reliable lottery management.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              LotteryPlay is a modern lottery platform designed to make checking
              results, playing 2D and 3D numbers, and managing your lottery
              account simple and convenient.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          INTRODUCTION
      ====================================================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Who We Are
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              Built around a better player experience
            </h2>

            <p className="mt-5 leading-7 text-gray-600">
              LotteryPlay provides a centralized platform for players to access
              lottery information and manage their lottery activities from one
              place.
            </p>

            <p className="mt-4 leading-7 text-gray-600">
              From checking the latest 2D and 3D results to selecting numbers,
              managing bets, viewing tickets and monitoring your wallet,
              everything is organized in a clean and easy-to-use interface.
            </p>

            <div className="mt-7 space-y-3">
              {[
                "Easy-to-use player interface",
                "Clear lottery results and history",
                "Convenient 2D and 3D number selection",
                "Secure account and wallet management",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />

                  <span className="text-sm font-medium text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-bold text-gray-900">Secure Platform</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Designed with account and transaction security in mind.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-bold text-gray-900">Simple & Fast</h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Quickly find results, select numbers and manage your bets.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Smartphone className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-bold text-gray-900">
                Responsive Design
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Access your lottery account comfortably on different devices.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <BarChart3 className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-bold text-gray-900">
                Clear Information
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Results and account information are presented clearly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT WE PROVIDE
      ====================================================== */}
      <section className="border-y border-gray-100 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Our Platform
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Everything in one place
            </h2>

            <p className="mt-4 text-gray-500">
              LotteryPlay brings the essential lottery features together in a
              simple player-focused platform.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Target className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                2D & 3D Play
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Select your preferred numbers, choose your bet amount and review
                your selections before placing your bets.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <BarChart3 className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Results & History
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Check the latest published results and browse previous lottery
                results through the results history.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Player Account
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Manage your profile, wallet, tickets and betting activity from
                your personal player dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION
      ====================================================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
            <Target className="h-7 w-7" />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-blue-600">
            Our Mission
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            Making lottery management easier for everyone
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-gray-500">
            Our goal is to provide a straightforward digital experience where
            players can access reliable lottery information, manage their
            accounts and interact with lottery services through one convenient
            platform.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-10 text-center shadow-lg shadow-blue-100 sm:px-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to explore LotteryPlay?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Check the latest results or create your player account to get
              started.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/results-history"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                View Results
              </a>

              <a
                href="/register"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
