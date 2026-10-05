import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  requireAuth,
  jsonResponse,
} from "./auth";

import {
  getAISupportEnabled,
} from "./settings";

import {
  checkRateLimitDetailed,
} from "./rateLimit";

import {
  searchKnowledge,
  knowledgeToText,
} from "./rag";

import {
  generateOpenRouterResponse,
} from "./openRouter";

import {
  TOOL_DEFINITIONS,
} from "./toolDefinitions";

import {
  getMyWallet,
  getMyLatestDeposit,
  getMyLatestWithdrawal,
  getMyRecentTransactions,
} from "./supportTools";

import {
  SYSTEM_PROMPT,
} from "./systemPrompt";

/* ============================================================
   TYPES
============================================================ */

type ChatMessage = {
  role:
    | "system"
    | "user"
    | "assistant"
    | "tool";

  content: string;

  tool_call_id?: string;

  name?: string;
};

type SupportRequestBody = {
  message?: unknown;

  messages?: unknown;
};

type ToolCall = {
  id?: string;

  type?: string;

  function?: {
    name?: string;

    arguments?: string;
  };
};

type AIResponse = {
  success: boolean;

  message?: string;

  source?:
    | "OPENROUTER"
    | "TRAINING"
    | "HUMAN";

  ticketId?: string;

  messageId?: string;

  error?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_MESSAGE_LENGTH = 2000;

const MAX_HISTORY_MESSAGES = 10;

const MAX_TOOL_ROUNDS = 2;

/* ============================================================
   JSON RESPONSE
============================================================ */

function response(
  statusCode: number,
  body: AIResponse | Record<string, unknown>,
) {
  return jsonResponse(
    statusCode,
    body,
  );
}

/* ============================================================
   TEXT NORMALIZATION
============================================================ */

function normalizeText(
  value: string,
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   EXTRACT MESSAGE
============================================================ */

function getUserMessage(
  body: SupportRequestBody,
): string {
  if (
    typeof body.message ===
    "string"
  ) {
    return normalizeText(
      body.message,
    );
  }

  if (
    Array.isArray(body.messages)
  ) {
    const messages =
      body.messages as ChatMessage[];

    const userMessages =
      messages.filter(
        (item) =>
          item &&
          item.role === "user" &&
          typeof item.content ===
            "string",
      );

    const last =
      userMessages[
        userMessages.length - 1
      ];

    if (last?.content) {
      return normalizeText(
        last.content,
      );
    }
  }

  return "";
}

/* ============================================================
   HISTORY
============================================================ */

function getHistory(
  body: SupportRequestBody,
): ChatMessage[] {
  if (
    !Array.isArray(body.messages)
  ) {
    return [];
  }

  return (
    body.messages as ChatMessage[]
  )
    .filter(
      (message) =>
        message &&
        typeof message.content ===
          "string" &&
        (
          message.role ===
            "user" ||
          message.role ===
            "assistant"
        ),
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: normalizeText(
        message.content,
      ),
    }));
}

/* ============================================================
   TRAINING FALLBACK
============================================================ */

/*
 * IMPORTANT
 *
 * This is intentionally deterministic.
 *
 * It must NEVER invent account/wallet/deposit/withdrawal
 * information.
 *
 * The RAG layer decides whether the training data contains
 * enough information to answer.
 */

async function getTrainingAnswer(
  message: string,
): Promise<string | null> {
  try {
    const results =
      await searchKnowledge(
        message,
        5,
      );

    if (
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return null;
    }

    const knowledgeText =
      knowledgeToText(
        results,
      );

    if (
      !knowledgeText ||
      !knowledgeText.trim()
    ) {
      return null;
    }

    /*
     * The local fallback should not pretend to be a
     * generative LLM.
     *
     * Return the highest-confidence knowledge result
     * only when the RAG layer supplied useful content.
     */

    const first =
      results[0] as unknown as {
        answer?: unknown;
        content?: unknown;
        text?: unknown;
      };

    if (
      typeof first.answer ===
      "string" &&
      first.answer.trim()
    ) {
      return first.answer.trim();
    }

    if (
      typeof first.content ===
      "string" &&
      first.content.trim()
    ) {
      return first.content.trim();
    }

    if (
      typeof first.text ===
      "string" &&
      first.text.trim()
    ) {
      return first.text.trim();
    }

    /*
     * If your existing RAG result only exposes the
     * combined knowledge text, use it as the deterministic
     * fallback answer.
     */

    return knowledgeText.trim();
  } catch (error) {
    console.error(
      "Training fallback error:",
      error,
    );

    return null;
  }
}

/* ============================================================
   TOOL EXECUTION
============================================================ */

async function executeTool(
  name: string,
  userId: string,
): Promise<string> {
  switch (name) {
    case "getMyWallet": {
      const result =
        await getMyWallet(
          userId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestDeposit": {
      const result =
        await getMyLatestDeposit(
          userId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestWithdrawal": {
      const result =
        await getMyLatestWithdrawal(
          userId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyRecentTransactions": {
      const result =
        await getMyRecentTransactions(
          userId,
        );

      return JSON.stringify(
        result,
      );
    }

    default:
      throw new Error(
        `Unsupported tool: ${name}`,
      );
  }
}

/* ============================================================
   OPENROUTER TOOL LOOP
============================================================ */

async function runOpenRouter(
  userId: string,
  message: string,
  history: ChatMessage[],
  knowledgeText: string,
): Promise<string | null> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        SYSTEM_PROMPT,
    },

    ...(knowledgeText
      ? [
          {
            role: "system" as const,
            content:
              `Relevant support knowledge:\n\n${knowledgeText}`,
          },
        ]
      : []),

    ...history,

    {
      role: "user",
      content: message,
    },
  ];

  for (
    let round = 0;
    round < MAX_TOOL_ROUNDS;
    round += 1
  ) {
    const result =
      await generateOpenRouterResponse(
        messages,
        TOOL_DEFINITIONS,
      );

    if (!result) {
      return null;
    }

    /*
     * The exact OpenRouter helper may expose either
     *:
     *
     * result.content
     *
     * or:
     *
     * result.message.content
     *
     * and optional tool calls.
     */

    const resultObject =
      result as unknown as {
        content?: unknown;

        message?: {
          content?: unknown;

          tool_calls?: ToolCall[];
        };

        tool_calls?: ToolCall[];
      };

    const content =
      typeof resultObject.content ===
      "string"
        ? resultObject.content
        : typeof resultObject
              .message?.content ===
            "string"
          ? resultObject.message
              .content
          : null;

    const toolCalls =
      resultObject.tool_calls ??
      resultObject.message
        ?.tool_calls ??
      [];

    if (
      toolCalls.length === 0
    ) {
      if (
        content &&
        content.trim()
      ) {
        return content.trim();
      }

      return null;
    }

    /*
     * Add assistant tool-call message.
     */

    messages.push({
      role: "assistant",
      content:
        content ?? "",
    });

    for (
      const toolCall of toolCalls
    ) {
      const name =
        toolCall.function
          ?.name;

      if (!name) {
        continue;
      }

      try {
        const toolResult =
          await executeTool(
            name,
            userId,
          );

        messages.push({
          role: "tool",
          content: toolResult,
          tool_call_id:
            toolCall.id,
          name,
        });
      } catch (error) {
        console.error(
          `Tool ${name} failed:`,
          error,
        );

        messages.push({
          role: "tool",
          content: JSON.stringify({
            success: false,
            error:
              "Unable to retrieve this information.",
          }),
          tool_call_id:
            toolCall.id,
          name,
        });
      }
    }
  }

  return null;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (
    event: HandlerEvent,
    _context: HandlerContext,
  ) => {
    try {
    /*
     * --------------------------------------------------------
     * METHOD
     * --------------------------------------------------------
     */

    if (
      event.httpMethod !==
      "POST"
    ) {
      return response(405, {
        success: false,
        message:
          "Method not allowed.",
      });
    }

    /*
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    let user;

    try {
      user = await requireAuth(event);
    } catch (error) {
      console.error("AI support authentication error:", error);

      if (error instanceof Error && "statusCode" in error) {
        const statusCode = Number(
          (error as Error & { statusCode?: unknown }).statusCode,
        );

        return response(
          Number.isInteger(statusCode) ? statusCode : 401,
          {
            success: false,
            message: error.message || "Authentication required.",
          },
        );
      }

      return response(401, {
        success: false,
        message: "Authentication required. Please log in again.",
      });
    }

    if (!user?.id) {
      return response(401, {
        success: false,
        message:
          "Authenticated user not found.",
      });
    }

    /*
     * --------------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------------
     */

    let body: SupportRequestBody;

    try {
      body =
        event.body
          ? (JSON.parse(
              event.body,
            ) as SupportRequestBody)
          : {};
    } catch {
      return response(400, {
        success: false,
        message:
          "Invalid JSON request body.",
      });
    }

    const message =
      getUserMessage(body);

    if (!message) {
      return response(400, {
        success: false,
        message:
          "Please enter a support message.",
      });
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return response(400, {
        success: false,
        message:
          `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    /*
     * --------------------------------------------------------
     * AI SUPPORT SETTING
     * --------------------------------------------------------
     *
     * This setting is controlled by Admin.
     *
     * IMPORTANT:
     *
     * OFF does NOT mean the support endpoint completely
     * stops responding.
     *
     * It disables the external generative AI layer.
     *
     * The deterministic training/knowledge fallback still
     * remains available.
     */

    let aiEnabled = true;

    try {
      aiEnabled =
        await getAISupportEnabled();
    } catch (error) {
      console.error(
        "Unable to read AI support setting:",
        error,
      );

      /*
       * Fail closed for external AI.
       *
       * Training fallback remains available.
       */
      aiEnabled = false;
    }

    /*
     * --------------------------------------------------------
     * RATE LIMIT
     * --------------------------------------------------------
     */

    let rateLimitResult:
      | {
          allowed?: boolean;
          retryAfterSeconds?: number;
        }
      | null = null;

    try {
      rateLimitResult =
        await checkRateLimitDetailed(
          user.id,
        );
    } catch (error) {
      console.error(
        "Rate limit check failed:",
        error,
      );
    }

    if (
      rateLimitResult &&
      rateLimitResult.allowed ===
        false
    ) {
      return response(429, {
        success: false,
        message:
          "You have sent too many support messages. Please try again later.",
      });
    }

    /*
     * --------------------------------------------------------
     * KNOWLEDGE SEARCH
     * --------------------------------------------------------
     */

    let knowledgeResults:
      | unknown[]
      | null = null;

    let knowledgeText = "";

    try {
      const results =
        await searchKnowledge(
          message,
          5,
        );

      if (
        Array.isArray(results)
      ) {
        knowledgeResults =
          results;

        knowledgeText =
          knowledgeToText(
            results,
          );
      }
    } catch (error) {
      console.error(
        "Knowledge search failed:",
        error,
      );
    }

    /*
     * --------------------------------------------------------
     * OPENROUTER
     * --------------------------------------------------------
     *
     * Only execute when Admin has enabled AI Support.
     *
     * If:
     * - 429
     * - timeout
     * - provider failure
     * - model unavailable
     * - malformed AI response
     *
     * runOpenRouter returns null and we continue to
     * deterministic training fallback.
     */

    if (aiEnabled) {
      try {
        const answer =
          await runOpenRouter(
            user.id,
            message,
            getHistory(body),
            knowledgeText,
          );

        if (
          answer &&
          answer.trim()
        ) {
          return response(200, {
            success: true,
            message:
              answer.trim(),
            source:
              "OPENROUTER",
          });
        }
      } catch (error) {
        console.error(
          "OpenRouter support error:",
          error,
        );

        /*
         * DO NOT return 500 here.
         *
         * OpenRouter is only one layer.
         *
         * Continue to local training fallback.
         */
      }
    }

    /*
     * --------------------------------------------------------
     * TRAINING / KNOWLEDGE FALLBACK
     * --------------------------------------------------------
     */

    try {
      /*
       * If knowledge search already returned useful data,
       * use the deterministic local fallback.
       */

      if (
        knowledgeResults &&
        knowledgeResults.length >
          0
      ) {
        const trainingAnswer =
          await getTrainingAnswer(
            message,
          );

        if (
          trainingAnswer &&
          trainingAnswer.trim()
        ) {
          return response(200, {
            success: true,
            message:
              trainingAnswer.trim(),
            source:
              "TRAINING",
          });
        }
      }
    } catch (error) {
      console.error(
        "Training support fallback failed:",
        error,
      );
    }

    /*
     * --------------------------------------------------------
     * HUMAN FALLBACK
     * --------------------------------------------------------
     *
     * At this point:
     *
     * - OpenRouter did not answer
     * - local knowledge did not answer
     *
     * The existing support-ticket API should handle
     * unresolved conversations.
     *
     * We intentionally return a clear response here rather
     * than pretending the AI knows the answer.
     *
     * Your existing frontend can then create the support
     * ticket using its existing ticket endpoint.
     */

    return response(200, {
      success: true,
      message:
        "I could not find a reliable answer for your question. Your request should be handled by our support team.",
      source:
        "HUMAN",
    });
    } catch (error) {
      console.error("AI SUPPORT UNHANDLED ERROR:", error);

      return response(500, {
        success: false,
        message: "AI support is temporarily unavailable. Please try again or contact support.",
      });
    }
  };
