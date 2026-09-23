import { useEffect, useMemo, useRef, useState } from "react";

import { AlertCircle, Bot, MessageSquare, ShieldCheck } from "lucide-react";

import {
  askAISupport,
  type AISupportHistoryMessage,
} from "../../services/aiSupportService";

import AIInput from "./AIInput";
import AIMessage, { type AIChatMessage } from "./AIMessage";
import AIQuickActions from "./AIQuickActions";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_INPUT_LENGTH = 1000;
const MAX_HISTORY_FOR_AI = 8;

/* ============================================================
   HELPERS
============================================================ */

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AISupportChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  /* ==========================================================
     AI HISTORY

     IMPORTANT:
     Explicitly typing the object returned by map() prevents
     TypeScript from widening `role` to a generic string.
  ========================================================== */

  const aiHistory = useMemo<AISupportHistoryMessage[]>(() => {
    const history: AISupportHistoryMessage[] = messages
      .filter((item) => item.sender === "USER" || item.sender === "AI")
      .map(
        (item): AISupportHistoryMessage => ({
          role: item.sender === "USER" ? "user" : "assistant",
          content: item.message,
        }),
      );

    return history.slice(-MAX_HISTORY_FOR_AI);
  }, [messages]);

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, loading]);

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const sendMessage = async (rawMessage: string) => {
    const trimmedMessage = rawMessage.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    if (trimmedMessage.length > MAX_INPUT_LENGTH) {
      setErrorMessage(
        `Message must be ${MAX_INPUT_LENGTH} characters or less.`,
      );

      return;
    }

    setErrorMessage(null);
    setLoading(true);

    /*
     * Capture history BEFORE adding the new
     * user message.
     *
     * This prevents the current message from
     * being duplicated in the request history.
     */
    const historyForRequest: AISupportHistoryMessage[] = aiHistory;

    /* ========================================================
       USER MESSAGE
    ======================================================== */

    const userMessage: AIChatMessage = {
      id: createMessageId("user"),
      sender: "USER",
      message: trimmedMessage,
      createdAt: formatTime(),
    };

    /*
     * Add user message immediately so the UI
     * responds without waiting for the API.
     */
    setMessages((previous) => [...previous, userMessage]);

    setMessage("");

    /* ========================================================
       AI REQUEST
    ======================================================== */

    try {
      const response = await askAISupport(trimmedMessage, historyForRequest);

      const aiMessage: AIChatMessage = {
        id: createMessageId("ai"),
        sender: "AI",
        message:
          response.message || "I’m sorry, but I could not generate a response.",
        createdAt: formatTime(),
      };

      setMessages((previous) => [...previous, aiMessage]);
    } catch (error) {
      console.error("AI support error:", error);

      const friendlyMessage =
        error instanceof Error
          ? error.message
          : "Unable to contact AI support.";

      setErrorMessage(friendlyMessage);

      const errorMessageItem: AIChatMessage = {
        id: createMessageId("error"),
        sender: "AI",
        message:
          "I'm sorry, I couldn't process your request right now. Please try again or contact our support team directly.",
        createdAt: formatTime(),
      };

      setMessages((previous) => [...previous, errorMessageItem]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const dismissError = () => {
    setErrorMessage(null);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* =====================================================
          TOP ACCENT
      ====================================================== */}

      <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <MessageSquare className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              AI Support
            </h2>

            <p className="text-[11px] text-slate-500">
              Ask questions about your account
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

          <span className="text-[10px] font-bold text-emerald-600">Online</span>
        </div>
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
        <AIQuickActions disabled={loading} onSelect={sendMessage} />
      </div>

      {/* =====================================================
          MESSAGE LIST
      ====================================================== */}

      <div
        ref={messagesContainerRef}
        className="h-[470px] overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Bot className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              How can we help?
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Ask about your wallet, deposits, withdrawals, transactions,
              results, or application usage.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((item) => (
              <AIMessage key={item.id} item={item} />
            ))}

            {/* =================================================
                TYPING INDICATOR
            ================================================== */}

            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[78%] gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">
                        AI Support
                      </span>

                      <span className="text-[9px] text-slate-400">
                        checking...
                      </span>
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-violet-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />

                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

            <div className="flex-1">
              <p className="text-[11px] font-bold text-red-700">
                Unable to process request
              </p>

              <p className="mt-0.5 text-[10px] leading-5 text-red-600">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={dismissError}
              className="text-[10px] font-bold text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          INPUT
      ====================================================== */}

      <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
        <AIInput
          value={message}
          loading={loading}
          maxLength={MAX_INPUT_LENGTH}
          onChange={setMessage}
          onSubmit={() => sendMessage(message)}
        />
      </div>

      {/* =====================================================
          SECURITY FOOTER
      ====================================================== */}

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

          <span className="text-[10px] font-medium text-slate-500">
            Your conversation is private and secure.
          </span>
        </div>
      </div>
    </div>
  );
}
