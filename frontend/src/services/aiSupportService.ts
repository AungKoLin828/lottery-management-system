/* ============================================================
   AI SUPPORT SERVICE
   Frontend -> Netlify AI Support Function

   IMPORTANT:
   - No OpenRouter API key here.
   - No database access here.
   - Authentication is handled by the backend JWT cookie.
============================================================ */

/* ============================================================
   TYPES
============================================================ */

export interface AISupportHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AISupportResponse {
  success: boolean;
  message: string;
}

interface AISupportApiResponse {
  success?: boolean;
  message?: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const API_URL = "/api/ai/support";

const MAX_MESSAGE_LENGTH = 2000;

const MAX_HISTORY_MESSAGES = 10;

/* ============================================================
   ASK AI SUPPORT
============================================================ */

export async function askAISupport(
  message: string,
  history: AISupportHistoryMessage[] = [],
): Promise<AISupportResponse> {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error(
      "Please enter a message.",
    );
  }

  if (
    trimmedMessage.length >
    MAX_MESSAGE_LENGTH
  ) {
    throw new Error(
      `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`,
    );
  }

  const safeHistory =
    history
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(
        (item) =>
          (
            item.role === "user" ||
            item.role === "assistant"
          ) &&
          typeof item.content === "string" &&
          item.content.trim().length > 0,
      )
      .map((item) => ({
        role: item.role,
        content: item.content
          .trim()
          .slice(0, MAX_MESSAGE_LENGTH),
      }));

  let response: Response;

  try {
    response = await fetch(
      API_URL,
      {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          message: trimmedMessage,
          messages: safeHistory,
        }),
      },
    );
  } catch (error) {
    console.error(
      "AI support network error:",
      error,
    );

    throw new Error(
      "Unable to connect to AI support. Please check your internet connection and try again.",
    );
  }

  let data: AISupportApiResponse = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Please log in to use AI support.",
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Too many AI requests. Please wait a moment and try again.",
      );
    }

    throw new Error(
      data.message ||
        "AI support is temporarily unavailable.",
    );
  }

  if (!data.success) {
    throw new Error(
      data.message ||
        "AI support could not process your request.",
    );
  }

  if (
    typeof data.message !== "string" ||
    !data.message.trim()
  ) {
    throw new Error(
      "AI support returned an empty response.",
    );
  }

  return {
    success: true,
    message: data.message.trim(),
  };
}