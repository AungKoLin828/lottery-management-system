import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  requireAuth,
  type AuthUser,
} from "./auth";

import {
  callOpenRouter,
  type OpenRouterMessage,
  type OpenRouterToolCall,
} from "./openRouter";

import {
  searchKnowledge,
  knowledgeToText,
} from "./rag";

import {
  checkRateLimitDetailed,
} from "./rateLimit";

import {
  SYSTEM_PROMPT,
} from "./systemPrompt";

import {
  TOOL_DEFINITIONS,
} from "./toolDefinitions";

import {
  getMyWallet,
  getMyLatestDeposit,
  getMyLatestWithdrawal,
  getMyRecentTransactions,
} from "./supportTools";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_MESSAGE_LENGTH =
  2000;

const MAX_HISTORY_MESSAGES =
  10;

const MAX_TOOL_ROUNDS =
  2;

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function jsonResponse(
  statusCode: number,
  body: Record<
    string,
    unknown
  >,
  extraHeaders: Record<
    string,
    string
  > = {},
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",

      ...extraHeaders,
    },

    body:
      JSON.stringify(body),
  };
}

/* ============================================================
   ERROR LOGGING
============================================================ */

function errorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return String(error);
}

/* ============================================================
   REQUEST TYPES
============================================================ */

interface ClientHistoryMessage {
  role:
    | "user"
    | "assistant";

  content: string;
}

interface SupportRequestBody {
  message?: unknown;

  messages?: unknown;
}

/* ============================================================
   TYPE GUARDS
============================================================ */

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null
  );
}

function isHistoryMessage(
  value: unknown,
): value is ClientHistoryMessage {
  if (
    !isRecord(value)
  ) {
    return false;
  }

  return (
    (
      value.role ===
        "user" ||
      value.role ===
        "assistant"
    ) &&
    typeof value.content ===
      "string"
  );
}

/* ============================================================
   PARSE BODY
============================================================ */

function parseRequestBody(
  event: HandlerEvent,
): SupportRequestBody {
  if (
    !event.body
  ) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(
        event.body,
      );

    return isRecord(
      parsed,
    )
      ? (parsed as SupportRequestBody)
      : {};
  } catch {
    throw new Error(
      "INVALID_JSON",
    );
  }
}

/* ============================================================
   SAFE HISTORY
============================================================ */

function buildHistory(
  value: unknown,
): OpenRouterMessage[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      isHistoryMessage,
    )
    .slice(
      -MAX_HISTORY_MESSAGES,
    )
    .map(
      (item) => ({
        role:
          item.role,

        content:
          item.content
            .trim()
            .slice(
              0,
              MAX_MESSAGE_LENGTH,
            ),
      }),
    )
    .filter(
      (item) =>
        item.content.length >
        0,
    );
}

/* ============================================================
   TOOL RESULT SERIALIZATION
============================================================ */

function toolResultText(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
    );
  } catch {
    return JSON.stringify({
      error:
        "Unable to serialize tool result",
    });
  }
}

/* ============================================================
   TOOL DISPATCH
============================================================ */

async function dispatchTool(
  toolCall: OpenRouterToolCall,
  user: AuthUser,
): Promise<unknown> {
  const toolName =
    toolCall.function?.name;

  let args:
    | Record<
        string,
        unknown
      >
    | null = null;

  try {
    const rawArguments =
      toolCall.function
        ?.arguments;

    if (
      rawArguments &&
      rawArguments.trim()
    ) {
      const parsed =
        JSON.parse(
          rawArguments,
        );

      if (
        isRecord(parsed)
      ) {
        args =
          parsed;
      }
    }
  } catch {
    return {
      success:
        false,

      error:
        "INVALID_TOOL_ARGUMENTS",
    };
  }

  /*
   * IMPORTANT:
   * user.id comes exclusively from JWT authentication.
   *
   * Never use args.userId.
   */

  switch (
    toolName
  ) {
    case "getMyWallet":
      return await getMyWallet(
        user.id,
      );

    case "getMyLatestDeposit":
      return await getMyLatestDeposit(
        user.id,
      );

    case "getMyLatestWithdrawal":
      return await getMyLatestWithdrawal(
        user.id,
      );

    case "getMyRecentTransactions": {
      const limit =
        Number(
          args?.limit ??
            10,
        );

      return await getMyRecentTransactions(
        user.id,
        Number.isFinite(
          limit,
        )
          ? limit
          : 10,
      );
    }

    default:
      return {
        success:
          false,

        error:
          "UNKNOWN_TOOL",
      };
  }
}

/* ============================================================
   EXTRACT ASSISTANT MESSAGE
============================================================ */

function getAssistantMessage(
  response: Awaited<
    ReturnType<
      typeof callOpenRouter
    >
  >,
): OpenRouterMessage {
  const message =
    response
      .choices?.[0]
      ?.message;

  if (!message) {
    throw new Error(
      "AI_EMPTY_MESSAGE",
    );
  }

  return {
    role:
      "assistant",

    content:
      typeof message.content ===
      "string"
        ? message.content
        : null,

    tool_calls:
      Array.isArray(
        message.tool_calls,
      )
        ? message.tool_calls
        : undefined,
  };
}

/* ============================================================
   FINAL CONTENT
============================================================ */

function getFinalContent(
  response: Awaited<
    ReturnType<
      typeof callOpenRouter
    >
  >,
): string {
  const content =
    response
      .choices?.[0]
      ?.message
      ?.content;

  if (
    typeof content !==
      "string" ||
    !content.trim()
  ) {
    throw new Error(
      "AI_EMPTY_RESPONSE",
    );
  }

  return content.trim();
}

/* ============================================================
   AI PROCESSING
============================================================ */

async function generateSupportResponse(
  user: AuthUser,
  message: string,
  history: OpenRouterMessage[],
): Promise<string> {
  /*
   * RAG is deliberately non-fatal.
   *
   * If a knowledge file is missing, account tools can still work.
   */
  let knowledgeText =
    "";

  try {
    const knowledge =
      await searchKnowledge(
        message,
        5,
      );

    knowledgeText =
      knowledgeToText(
        knowledge,
      );
  } catch (error) {
    console.error(
      "[AI:RAG] Search failed:",
      errorMessage(
        error,
      ),
    );
  }

  const systemContent =
    knowledgeText
      ? `${SYSTEM_PROMPT}

============================================================
RELEVANT KNOWLEDGE BASE
============================================================

${knowledgeText}

Use this knowledge when relevant. If it does not answer the question,
do not invent an answer.`
      : SYSTEM_PROMPT;

  const messages:
    OpenRouterMessage[] = [
      {
        role:
          "system",

        content:
          systemContent,
      },

      ...history,

      {
        role:
          "user",

        content:
          message,
      },
    ];

  let currentMessages =
    messages;

  for (
    let round = 0;
    round < MAX_TOOL_ROUNDS;
    round += 1
  ) {
    const response =
      await callOpenRouter(
        currentMessages,
        TOOL_DEFINITIONS,
      );

    const assistantMessage =
      getAssistantMessage(
        response,
      );

    const toolCalls =
      assistantMessage.tool_calls ??
      [];

    /*
     * Normal final AI response.
     */
    if (
      toolCalls.length ===
      0
    ) {
      return getFinalContent(
        response,
      );
    }

    /*
     * Add assistant's tool-call message.
     */
    currentMessages = [
      ...currentMessages,

      assistantMessage,
    ];

    /*
     * Execute each requested tool.
     */
    for (
      const toolCall of toolCalls
    ) {
      try {
        const result =
          await dispatchTool(
            toolCall,
            user,
          );

        currentMessages.push({
          role:
            "tool",

          tool_call_id:
            toolCall.id,

          name:
            toolCall.function
              .name,

          content:
            toolResultText(
              result,
            ),
        });
      } catch (error) {
        console.error(
          `[AI:TOOL] ${toolCall.function?.name ?? "unknown"} failed:`,
          errorMessage(
            error,
          ),
        );

        currentMessages.push({
          role:
            "tool",

          tool_call_id:
            toolCall.id,

          name:
            toolCall.function
              .name,

          content:
            JSON.stringify({
              success:
                false,

              error:
                "Tool execution failed",
            }),
        });
      }
    }
  }

  /*
   * If the model keeps requesting tools, don't loop forever.
   */
  throw new Error(
    "AI_TOOL_ROUND_LIMIT",
  );
}

/* ============================================================
   NETLIFY HANDLER
============================================================ */

export const handler:
  Handler = async (
    event,
    _context: HandlerContext,
  ) => {
    /* --------------------------------------------------------
       METHOD
    -------------------------------------------------------- */

    if (
      event.httpMethod !==
      "POST"
    ) {
      return jsonResponse(
        405,
        {
          success:
            false,

          message:
            "Method not allowed.",
        },
        {
          Allow:
            "POST",
        },
      );
    }

    /* --------------------------------------------------------
       FEATURE FLAG
    -------------------------------------------------------- */

    const enabled =
      process.env.AI_SUPPORT_ENABLED
        ?.trim()
        .toLowerCase();

    if (
      enabled !==
        "true" &&
      enabled !==
        "1"
    ) {
      return jsonResponse(
        503,
        {
          success:
            false,

          message:
            "AI support is currently unavailable.",
        },
      );
    }

    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    let user:
      AuthUser;

    try {
      /*
       * Reconstruct Request from the Netlify event.
       */
      const request =
        new Request(
          getRequestUrl(
            event,
          ),
          {
            method:
              event.httpMethod,

            headers:
              event.headers as HeadersInit,
          },
        );

      user =
        await requireAuth(
          request,
        );
    } catch (error) {
      const message =
        errorMessage(
          error,
        );

      if (
        message ===
        "UNAUTHORIZED"
      ) {
        return jsonResponse(
          401,
          {
            success:
              false,

            message:
              "Please log in to use AI support.",
          },
        );
      }

      console.error(
        "[AI:AUTH] Authentication error:",
        message,
      );

      return jsonResponse(
        500,
        {
          success:
            false,

          message:
            "AI support authentication failed.",
        },
      );
    }

    /* --------------------------------------------------------
       RATE LIMIT
    -------------------------------------------------------- */

    const rate =
      checkRateLimitDetailed(
        user.id,
      );

    if (!rate.allowed) {
      return jsonResponse(
        429,
        {
          success:
            false,

          message:
            "Too many AI requests. Please wait a moment and try again.",
        },
        {
          "Retry-After":
            String(
              Math.max(
                Math.ceil(
                  (
                    rate.resetAt -
                    Date.now()
                  ) / 1000,
                ),
                1,
              ),
            ),
        },
      );
    }

    /* --------------------------------------------------------
       BODY
    -------------------------------------------------------- */

    let body:
      SupportRequestBody;

    try {
      body =
        parseRequestBody(
          event,
        );
    } catch {
      return jsonResponse(
        400,
        {
          success:
            false,

          message:
            "Invalid request.",
        },
      );
    }

    /* --------------------------------------------------------
       MESSAGE
    -------------------------------------------------------- */

    const message =
      typeof body.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return jsonResponse(
        400,
        {
          success:
            false,

          message:
            "Please enter a message.",
        },
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return jsonResponse(
        400,
        {
          success:
            false,

          message:
            `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`,
        },
      );
    }

    /* --------------------------------------------------------
       HISTORY
    -------------------------------------------------------- */

    const history =
      buildHistory(
        body.messages,
      );

    /* --------------------------------------------------------
       AI
    -------------------------------------------------------- */

    try {
      const answer =
        await generateSupportResponse(
          user,
          message,
          history,
        );

      return jsonResponse(
        200,
        {
          success:
            true,

          message:
            answer,
        },
      );
    } catch (error) {
      const internalError =
        errorMessage(
          error,
        );

      /*
       * Log the real problem for Netlify logs.
       *
       * Do NOT send API keys, JWTs, SQL or stack traces to
       * the player.
       */
      console.error(
        "[AI:SUPPORT] Request failed:",
        internalError,
      );

      return jsonResponse(
        502,
        {
          success:
            false,

          message:
            "AI support is temporarily unavailable. Please try again shortly.",
        },
      );
    }
  };

/* ============================================================
   REQUEST URL
============================================================ */

function getRequestUrl(
  event: HandlerEvent,
): string {
  const proto =
    event.headers[
      "x-forwarded-proto"
    ] ||
    event.headers[
      "X-Forwarded-Proto"
    ] ||
    "https";

  const host =
    event.headers[
      "host"
    ] ||
    event.headers[
      "Host"
    ] ||
    "localhost";

  return `${proto}://${host}/api/ai/support`;
}