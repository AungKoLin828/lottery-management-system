import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Bot,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  askAISupport,
  type AISupportHistoryMessage,
  type AISupportResponse,
} from "../../services/aiSupportService";

import AIInput from "./AIInput";
import AIMessage, {
  type AIChatMessage,
} from "./AIMessage";
import AIQuickActions from "./AIQuickActions";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_INPUT_LENGTH = 1000;

const MAX_HISTORY_FOR_AI = 8;

/* ============================================================
   TYPES
============================================================ */

type AISupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

/* ============================================================
   HELPERS
============================================================ */

/**
 * Create a unique client-side message ID.
 */
function createMessageId(
  prefix: string,
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

/**
 * Format message timestamp.
 */
function formatTime(
  date = new Date(),
): string {
  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

/**
 * Convert backend source into a user-friendly label.
 *
 * OPENROUTER:
 * The external AI provider successfully generated
 * the response.
 *
 * TRAINING:
 * OpenRouter/provider was unavailable or could not
 * answer, so the local deterministic training/
 * knowledge fallback handled the request.
 *
 * HUMAN:
 * Automated support could not confidently answer
 * and the request was routed to human support.
 */
function getSourceLabel(
  response: AISupportResponse,
): string {
  if (
    response.source === "OPENROUTER"
  ) {
    return "AI Support";
  }

  if (
    response.source === "TRAINING"
  ) {
    return "Training AI";
  }

  if (
    response.source === "HUMAN"
  ) {
    return "Human Support";
  }

  return "AI Support";
}

/**
 * Return a normalized source.
 *
 * This keeps the UI defensive if the backend
 * ever returns an unexpected value.
 */
function normalizeSource(
  response: AISupportResponse,
): AISupportSource {
  if (
    response.source ===
    "OPENROUTER"
  ) {
    return "OPENROUTER";
  }

  if (
    response.source ===
    "TRAINING"
  ) {
    return "TRAINING";
  }

  if (
    response.source ===
    "HUMAN"
  ) {
    return "HUMAN";
  }

  /*
   * The backend response type should normally
   * prevent this case. If it occurs at runtime,
   * treating it as OPENROUTER keeps the UI
   * operational instead of showing a false
   * human-support state.
   */
  return "OPENROUTER";
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AISupportChat() {
  const [
    messages,
    setMessages,
  ] = useState<AIChatMessage[]>(
    [],
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    lastSource,
    setLastSource,
  ] = useState<
    AISupportSource | null
  >(null);

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* ==========================================================
     HISTORY
  ========================================================== */

  const aiHistory =
    useMemo<AISupportHistoryMessage[]>(
      () => {
        const history =
          messages
            .filter(
              (item) =>
                item.sender ===
                  "USER" ||
                item.sender ===
                  "AI",
            )
            .map(
              (
                item,
              ): AISupportHistoryMessage => ({
                role:
                  item.sender ===
                  "USER"
                    ? "user"
                    : "assistant",

                content:
                  item.message,
              }),
            );

        return history.slice(
          -MAX_HISTORY_FOR_AI,
        );
      },
      [messages],
    );

  /* ==========================================================
     AUTO SCROLL
  ========================================================== */

  useEffect(() => {
    const container =
      messagesContainerRef.current;

    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top:
          container.scrollHeight,

        behavior: "smooth",
      });
    });
  }, [
    messages,
    loading,
  ]);

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  const sendMessage = async (
    rawMessage: string,
  ) => {
    const trimmedMessage =
      rawMessage.trim();

    /*
     * Prevent duplicate requests.
     */
    if (
      !trimmedMessage ||
      loading
    ) {
      return;
    }

    /*
     * Client-side maximum length.
     *
     * Backend should still validate the length.
     */
    if (
      trimmedMessage.length >
      MAX_INPUT_LENGTH
    ) {
      setErrorMessage(
        `Message must be ${MAX_INPUT_LENGTH} characters or less.`,
      );

      return;
    }

    /*
     * Clear previous error.
     */
    setErrorMessage(null);

    /*
     * Set loading before making request.
     */
    setLoading(true);

    /*
     * Capture history BEFORE adding the
     * current user message.
     *
     * This prevents the current message
     * from being duplicated in the request.
     */
    const historyForRequest =
      aiHistory;

    /* ========================================================
       USER MESSAGE
    ======================================================== */

    const userMessage:
      AIChatMessage = {
      id: createMessageId(
        "user",
      ),

      sender: "USER",

      message:
        trimmedMessage,

      createdAt:
        formatTime(),
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ],
    );

    /*
     * Clear input immediately so the UI
     * feels responsive while waiting.
     */
    setMessage("");

    /* ========================================================
       SUPPORT REQUEST
    ======================================================== */

    try {
      const response =
        await askAISupport(
          trimmedMessage,
          historyForRequest,
        );

      /*
       * Normalize source before storing it.
       */
      const source =
        normalizeSource(
          response,
        );

      setLastSource(
        source,
      );

      /* ======================================================
         AI / TRAINING / HUMAN RESPONSE
      ====================================================== */

      const responseMessage =
        response.message?.trim() ||
        "I’m sorry, but I could not generate a response.";

      const aiMessage:
        AIChatMessage = {
        id: createMessageId(
          "ai",
        ),

        /*
         * The frontend conversation still
         * treats automated and human-routed
         * responses as AI/system responses.
         *
         * The actual source is represented by
         * lastSource and the status banner.
         */
        sender: "AI",

        message:
          responseMessage,

        createdAt:
          formatTime(),
      };

      setMessages(
        (previous) => [
          ...previous,
          aiMessage,
        ],
      );
    } catch (error) {
      console.error(
        "AI support error:",
        error,
      );

      const friendlyMessage =
        error instanceof Error
          ? error.message
          : "Unable to contact support.";

      setErrorMessage(
        friendlyMessage,
      );

      /*
       * Do not pretend that the error itself
       * is an AI-generated answer.
       *
       * We display a generic support message
       * and allow the user to try again.
       */
      const errorMessageItem:
        AIChatMessage = {
        id: createMessageId(
          "error",
        ),

        sender: "AI",

        message:
          "I'm sorry, I couldn't process your request right now. Please try again or contact our support team directly.",

        createdAt:
          formatTime(),
      };

      setMessages(
        (previous) => [
          ...previous,
          errorMessageItem,
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     STATUS
  ========================================================== */

  /**
   * This is where getSourceLabel() is actually used.
   *
   * This fixes:
   *
   * TS6133:
   * 'getSourceLabel' is declared but its value is never read.
   */
  const statusText =
    lastSource === null
      ? "AI Support"
      : getSourceLabel({
          source:
            lastSource,
          message: "",
        } as AISupportResponse);

  /*
   * Status color:
   *
   * OPENROUTER -> normal AI status
   * TRAINING   -> violet fallback status
   * HUMAN      -> amber human-support status
   */
  const statusColor =
    lastSource === "HUMAN"
      ? "bg-amber-50 text-amber-600"
      : lastSource ===
          "TRAINING"
        ? "bg-violet-50 text-violet-600"
        : "bg-emerald-50 text-emerald-600";

  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const dismissError = () => {
    setErrorMessage(
      null,
    );
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
              Ask questions about your
              account
            </p>
          </div>
        </div>

        <div
          className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex ${statusColor}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />

          <span className="text-[10px] font-bold">
            {statusText}
          </span>
        </div>
      </div>

      {/* =====================================================
          TRAINING FALLBACK INFORMATION
      ====================================================== */}

      {lastSource ===
        "TRAINING" && (
        <div className="border-b border-violet-100 bg-violet-50 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 shrink-0 text-violet-600" />

            <p className="text-[10px] font-medium text-violet-700">
              The external AI service is
              temporarily unavailable. Our
              built-in support knowledge
              system is answering your
              question.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          HUMAN FALLBACK INFORMATION
      ====================================================== */}

      {lastSource ===
        "HUMAN" && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-amber-600" />

            <p className="text-[10px] font-medium text-amber-700">
              Automated support could not
              confidently answer this
              question. Human support is
              required.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
        <AIQuickActions
          disabled={loading}
          onSelect={sendMessage}
        />
      </div>

      {/* =====================================================
          MESSAGE LIST
      ====================================================== */}

      <div
        ref={
          messagesContainerRef
        }
        className="h-[470px] overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-6"
      >
        {messages.length ===
        0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Bot className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              How can we help?
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Ask about your wallet,
              deposits, withdrawals,
              transactions, results,
              or application usage.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map(
              (item) => (
                <AIMessage
                  key={item.id}
                  item={item}
                />
              ),
            )}

            {/* ==================================================
                LOADING MESSAGE
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
              onClick={
                dismissError
              }
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
          maxLength={
            MAX_INPUT_LENGTH
          }
          onChange={setMessage}
          onSubmit={() =>
            sendMessage(message)
          }
        />
      </div>

      {/* =====================================================
          SECURITY FOOTER
      ====================================================== */}

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

          <span className="text-[10px] font-medium text-slate-500">
            Your conversation is
            private and secure.
          </span>
        </div>
      </div>
    </div>
  );
}