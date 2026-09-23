import {
  Headphones,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  Phone,
  MapPin,
  Send as TelegramIcon,
  Bot,
} from "lucide-react";

import AISupportChat from "@/components/ai/AISupportChat";

/* ============================================================
   COMPONENT
============================================================ */

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          PAGE CONTAINER
      ====================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {/* ===================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <Headphones className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Customer Support
              </p>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Contact Us
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Have a question or need help? Our AI support assistant can help with
            common questions and your account information. Contact our support
            team when human assistance is required.
          </p>
        </div>

        {/* ===================================================
            MAIN GRID
        ==================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          {/* =================================================
              SUPPORT CENTER
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

            <div className="p-6">
              {/* =================================================
                  HEADER
              ================================================== */}

              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Headphones className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Support Center
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      We're here to help you
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SUPPORT STATUS
              ================================================== */}

              <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-xs font-bold text-emerald-700">
                    AI Support Online
                  </span>
                </div>

                <span className="text-[10px] font-medium text-emerald-600">
                  Available
                </span>
              </div>

              {/* =================================================
                  PHONE
              ================================================== */}

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Phone className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        09 123456789
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    TELEGRAM
                ================================================== */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <TelegramIcon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Telegram
                      </p>

                      <p className="mt-1 text-sm font-bold text-sky-600">
                        @lottery
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    ADDRESS
                ================================================== */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <MapPin className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Address
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        Yangon, Myanmar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  AI INFORMATION
              ================================================== */}

              <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex items-start gap-3">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />

                  <div>
                    <p className="text-xs font-bold text-violet-800">
                      AI Support Assistant
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-violet-600">
                      Ask about your wallet, deposits, withdrawals,
                      transactions, 2D/3D results, account help, PWA
                      installation, and general application support.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SECURITY INFORMATION
              ================================================== */}

              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                  <div>
                    <p className="text-xs font-bold text-indigo-800">
                      Secure Support
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-indigo-600">
                      Never share your password, OTP, PIN, or payment
                      credentials with support or the AI assistant.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SUPPORT HOURS
              ================================================== */}

              <div className="mt-4 flex items-center gap-2 px-1">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />

                <p className="text-[10px] font-medium text-slate-400">
                  Human support is available during business hours.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              AI SUPPORT CHAT
          ================================================== */}

          <AISupportChat />
        </div>

        {/* ===================================================
            BOTTOM SUPPORT NOTE
        ==================================================== */}

        <div className="mt-6 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

          <p className="text-center text-[10px] font-medium text-slate-400">
            AI support provides general assistance. Contact the human support
            team when account or transaction action is required.
          </p>
        </div>
      </div>
    </div>
  );
}
