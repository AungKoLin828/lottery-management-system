import { useEffect, useState } from "react";
import {
  Headphones,
  Send,
  ShieldCheck,
  User,
  MessageSquare,
  Clock3,
  CheckCircle2,
  Phone,
  MapPin,
  Send as TelegramIcon,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type MessageSender = "USER" | "ADMIN";

interface SupportMessage {
  id: string;
  sender: MessageSender;
  message: string;
  createdAt: string;
}

/* ============================================================
   TEMPORARY MOCK DATA
   Replace with API data later
============================================================ */

const initialMessages: SupportMessage[] = [
  {
    id: "1",
    sender: "USER",
    message:
      "Hello, I made a deposit but my wallet balance has not been updated yet.",
    createdAt: "10:32 AM",
  },
  {
    id: "2",
    sender: "ADMIN",
    message:
      "Hello! We have received your request. Please allow us some time to verify the deposit.",
    createdAt: "10:38 AM",
  },
  {
    id: "3",
    sender: "USER",
    message: "Okay, thank you. I will wait for the verification.",
    createdAt: "10:40 AM",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function Contact() {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  /* ==========================================================
     LOAD CONVERSATION
  ========================================================== */

  useEffect(() => {
    /*
     * Replace this section with your real API.
     *
     * Example:
     *
     * const loadMessages = async () => {
     *   try {
     *     setLoadingMessages(true);
     *
     *     const response = await fetch(
     *       "/.netlify/functions/contact-messages",
     *       {
     *         method: "GET",
     *         credentials: "include",
     *       }
     *     );
     *
     *     const data = await response.json();
     *
     *     if (!response.ok) {
     *       throw new Error(
     *         data.message ||
     *         "Unable to load messages."
     *       );
     *     }
     *
     *     setMessages(data.messages);
     *
     *   } catch (error) {
     *     console.error(error);
     *   } finally {
     *     setLoadingMessages(false);
     *   }
     * };
     *
     * loadMessages();
     */

    setLoadingMessages(false);
  }, []);

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setLoading(true);

    try {
      /*
       * ========================================================
       * REAL API
       * ========================================================
       *
       * const response = await fetch(
       *   "/.netlify/functions/contact-messages",
       *   {
       *     method: "POST",
       *     credentials: "include",
       *     headers: {
       *       "Content-Type": "application/json",
       *     },
       *     body: JSON.stringify({
       *       message: trimmedMessage,
       *     }),
       *   }
       * );
       *
       * const data = await response.json();
       *
       * if (!response.ok) {
       *   throw new Error(
       *     data.message ||
       *     "Unable to send message."
       *   );
       * }
       *
       * setMessages((previous) => [
       *   ...previous,
       *   data.message,
       * ]);
       */

      /* ========================================================
         TEMPORARY LOCAL MESSAGE
      ======================================================== */

      const newMessage: SupportMessage = {
        id: Date.now().toString(),
        sender: "USER",
        message: trimmedMessage,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((previous) => [...previous, newMessage]);

      setMessage("");
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

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
            Have a question or need help? Contact our support team and continue
            the conversation directly from your account.
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
            {/* Gradient top */}

            <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

            <div className="p-6">
              {/* =================================================
                  SUPPORT CENTER HEADER
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
                    Support Online
                  </span>
                </div>

                <span className="text-[10px] font-medium text-emerald-600">
                  Available
                </span>
              </div>

              {/* =================================================
                  SUPPORT INFORMATION
              ================================================== */}

              <div className="space-y-3">
                {/* Phone */}

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

                {/* Telegram */}

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

                {/* Address */}

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
                  SECURITY INFORMATION
              ================================================== */}

              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                  <div>
                    <p className="text-xs font-bold text-indigo-800">
                      Secure Support
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-indigo-600">
                      Your messages are connected to your logged-in account. You
                      don't need to provide your name, email, or phone number
                      again.
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
                  Support team is available during business hours.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              CONVERSATION
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Gradient top */}

            <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

            {/* =================================================
                CONVERSATION HEADER
            ================================================== */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <MessageSquare className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Support Conversation
                  </h2>

                  <p className="text-[11px] text-slate-500">
                    Message our support team
                  </p>
                </div>
              </div>

              {/* Online status */}

              <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-bold text-emerald-600">
                  Online
                </span>
              </div>
            </div>

            {/* =================================================
                MESSAGE LIST
            ================================================== */}

            <div className="h-[470px] overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    Loading conversation...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                    <MessageSquare className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800">
                    Start a conversation
                  </h3>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                    Send your first message below and our support team will help
                    you.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((item) => {
                    const userMessage = item.sender === "USER";

                    return (
                      <div
                        key={item.id}
                        className={`flex ${
                          userMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex max-w-[88%] gap-2.5 sm:max-w-[75%] ${
                            userMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* Avatar */}

                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              userMessage
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-violet-100 text-violet-600"
                            }`}
                          >
                            {userMessage ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Headphones className="h-4 w-4" />
                            )}
                          </div>

                          {/* Message content */}

                          <div
                            className={`flex flex-col ${
                              userMessage ? "items-end" : "items-start"
                            }`}
                          >
                            {/* Sender */}

                            <div
                              className={`mb-1 flex items-center gap-2 ${
                                userMessage ? "flex-row-reverse" : ""
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-500">
                                {userMessage ? "You" : "Support Team"}
                              </span>

                              <span className="text-[9px] text-slate-400">
                                {item.createdAt}
                              </span>
                            </div>

                            {/* Bubble */}

                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                userMessage
                                  ? "rounded-tr-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                                  : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {item.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =================================================
                MESSAGE COMPOSER
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message to our support team..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();

                        if (message.trim()) {
                          e.currentTarget.form?.requestSubmit();
                        }
                      }
                    }}
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-3
                      text-sm
                      text-slate-800
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-indigo-400
                      focus:bg-white
                      focus:ring-4
                      focus:ring-indigo-500/10
                    "
                  />

                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">
                      Enter to send · Shift + Enter for new line
                    </p>

                    <p className="text-[10px] font-medium text-slate-400">
                      {message.length}/1000
                    </p>
                  </div>
                </div>

                {/* Send button */}

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-r
                    from-indigo-600
                    to-violet-600
                    text-white
                    shadow-lg
                    shadow-indigo-500/20
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:from-indigo-500
                    hover:to-violet-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    disabled:hover:translate-y-0
                  "
                  aria-label="Send message"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>

            {/* =================================================
                SECURITY FOOTER
            ================================================== */}

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

                <span className="text-[10px] font-medium text-slate-500">
                  Your conversation is private and secure.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            BOTTOM SUPPORT NOTE
        ==================================================== */}

        <div className="mt-6 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

          <p className="text-[10px] font-medium text-slate-400">
            Our support team will respond to your message as soon as possible.
          </p>
        </div>
      </div>
    </div>
  );
}
