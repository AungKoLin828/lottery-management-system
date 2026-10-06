import {
  Headphones,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  Phone,
  MapPin,
  Send as TelegramIcon,
  Bot,
  Database,
  Users,
  Sparkles,
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
            Have a question or need help? Our support assistant can help with
            common questions, account information, and application support. When
            automated assistance cannot resolve your request, your conversation
            can be escalated to our human support team.
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

              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>

                    <span className="text-xs font-bold text-emerald-700">
                      Support Assistant Available
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-emerald-600">
                    Online
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-emerald-700/80">
                  Support can use AI assistance, local training and knowledge
                  data, and human support when automated assistance cannot
                  resolve your request.
                </p>
              </div>

              {/* =================================================
                  SUPPORT FLOW
              ================================================== */}

              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Support Flow
                </p>

                <div className="space-y-2">
                  {/* AI */}

                  <div className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-violet-800">
                        AI Assistant
                      </p>

                      <p className="text-[10px] leading-4 text-violet-600">
                        Handles common support questions and account help
                      </p>
                    </div>
                  </div>

                  {/* ARROW */}

                  <div className="flex justify-center">
                    <div className="h-2 border-l border-dashed border-slate-300" />
                  </div>

                  {/* LOCAL */}

                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Database className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-800">
                        Training & Knowledge Fallback
                      </p>

                      <p className="text-[10px] leading-4 text-emerald-600">
                        Uses local support data when external AI is unavailable
                      </p>
                    </div>
                  </div>

                  {/* ARROW */}

                  <div className="flex justify-center">
                    <div className="h-2 border-l border-dashed border-slate-300" />
                  </div>

                  {/* HUMAN */}

                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-800">
                        Human Support
                      </p>

                      <p className="text-[10px] leading-4 text-blue-600">
                        Conversation is escalated to admin support when needed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SUPPORT CONVERSATION INFORMATION
              ================================================== */}

              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                  <div>
                    <p className="text-xs font-bold text-blue-800">
                      Conversation Support
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-blue-600">
                      Your support conversation can be stored so that the
                      support team can continue helping you if your request
                      needs human assistance.
                    </p>

                    <p className="mt-2 text-[10px] leading-4 text-blue-500">
                      Human support replies are handled through the support
                      center and can continue from the same conversation.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  CONTACT METHODS
              ================================================== */}

              <div className="space-y-3">
                {/* PHONE */}

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

                {/* TELEGRAM */}

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

                {/* ADDRESS */}

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

                    <p className="mt-2 text-[10px] leading-4 text-violet-500">
                      When external AI is unavailable, the support system can
                      use the application's local training and knowledge data.
                      If the request still cannot be answered, it can be
                      escalated to human support.
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
            Support assistance may use external AI, local training data, or
            human support depending on AI availability and the type of request.
          </p>
        </div>
      </div>
    </div>
  );
}
