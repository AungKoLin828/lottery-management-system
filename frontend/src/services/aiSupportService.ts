/* ============================================================
   AI SUPPORT SERVICE
============================================================ */

export interface AISupportHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type AISupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

export interface AISupportResponse {
  success: boolean;

  message: string;

  source: AISupportSource;

  mode:
    | "AI"
    | "HUMAN";

  confidence?: number;

  intent?: string | null;

  category?: string | null;

  fallbackUsed?: boolean;

  fallbackReason?: string;
}

/* ============================================================
   API URL
============================================================ */

const API_URL =
  "/api/ai/support";

/* ============================================================
   REQUEST TIMEOUT
============================================================ */

const REQUEST_TIMEOUT = 30_000;

/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller =
    new AbortController();

  const timer = window.setTimeout(
    () => controller.abort(),
    timeout,
  );

  try {
    return await fetch(
      url,
      {
        ...options,

        credentials: "include",

        signal:
          controller.signal,
      },
    );
  } finally {
    window.clearTimeout(timer);
  }
}

/* ============================================================
   ASK SUPPORT
============================================================ */

export async function askAISupport(
  message: string,
  history: AISupportHistoryMessage[] = [],
): Promise<AISupportResponse> {
  const trimmed =
    String(message || "").trim();

  if (!trimmed) {
    throw new Error(
      "Message is required.",
    );
  }

  if (trimmed.length > 1000) {
    throw new Error(
      "Message must be 1000 characters or less.",
    );
  }

  const response =
    await fetchWithTimeout(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          message: trimmed,

          history:
            Array.isArray(history)
              ? history.slice(-8)
              : [],
        }),
      },
    );

  let data: AISupportResponse | null =
    null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  /*
   * Normally the backend itself should handle
   * OpenRouter failure and return a training response.
   *
   * This error is therefore only a genuine
   * backend/network failure.
   */
  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Support request failed (${response.status}).`,
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Support service is unavailable.",
    );
  }

  return data;
}

export default askAISupport;