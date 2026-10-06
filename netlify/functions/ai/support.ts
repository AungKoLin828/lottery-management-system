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
  knowledgeToText,
  searchKnowledge,
} from "./rag";

import {
  generateCustomTrainingResponse,
} from "./customTrainingAI";

import {
  generateOpenRouterResponse,
  type OpenRouterMessage,
  type OpenRouterToolCall,
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

type SupportRequestBody = {
  message?: unknown;
  messages?: unknown;
};

type ClientChatMessage = {
  role?: unknown;
  content?: unknown;
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

  confidence?: number;

  matchedDocuments?: Array<{
    fileName: string;
    category: string;
    score: number;
  }>;

  error?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_MESSAGE_LENGTH = 2000;

const MAX_HISTORY_MESSAGES = 10;

/*
 * One OpenRouter request may return tool calls.
 *
 * Round 1:
 *
 *   AI -> tool call
 *
 * Round 2:
 *
 *   tool result -> AI -> final answer
 *
 * Do not reduce this to 1.
 */
const MAX_TOOL_ROUNDS = 2;

/*
 * Only this many account tools can be executed during one
 * support request.
 *
 * This prevents accidental excessive database access.
 */
const MAX_TOOL_CALLS_PER_REQUEST = 4;

/* ============================================================
   RESPONSE HELPER
============================================================ */

/*
 * IMPORTANT
 *
 * The current auth.ts uses:
 *
 *   jsonResponse(data, status)
 *
 * NOT:
 *
 *   jsonResponse(status, data)
 *
 * Keeping this order prevents:
 *
 *   RangeError:
 *   init["status"] must be in the range of 200 to 599
 */
function response(
  statusCode: number,
  body:
    | AIResponse
    | Record<string, unknown>,
) {
  return jsonResponse(
    body,
    statusCode,
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
   GET USER MESSAGE
============================================================ */

function getUserMessage(
  body: SupportRequestBody,
): string {
  /*
   * Preferred request format:
   *
   * {
   *   message: "..."
   * }
   */
  if (
    typeof body.message ===
    "string"
  ) {
    return normalizeText(
      body.message,
    );
  }

  /*
   * Backward compatibility with:
   *
   * {
   *   messages: [...]
   * }
   */
  if (
    Array.isArray(
      body.messages,
    )
  ) {
    const messages =
      body.messages as ClientChatMessage[];

    for (
      let index =
        messages.length - 1;
      index >= 0;
      index -= 1
    ) {
      const item =
        messages[index];

      if (
        item &&
        item.role === "user" &&
        typeof item.content ===
          "string"
      ) {
        const content =
          normalizeText(
            item.content,
          );

        if (content) {
          return content;
        }
      }
    }
  }

  return "";
}

/* ============================================================
   GET HISTORY
============================================================ */

function getHistory(
  body: SupportRequestBody,
): OpenRouterMessage[] {
  if (
    !Array.isArray(
      body.messages,
    )
  ) {
    return [];
  }

  const messages =
    body.messages as ClientChatMessage[];

  return messages
    .filter(
      (
        message,
      ): message is ClientChatMessage & {
        role:
          | "user"
          | "assistant";
        content: string;
      } => {
        if (!message) {
          return false;
        }

        if (
          typeof message.content !==
          "string"
        ) {
          return false;
        }

        if (
          message.role !== "user" &&
          message.role !==
            "assistant"
        ) {
          return false;
        }

        return (
          message.content.trim()
            .length > 0
        );
      },
    )
    .slice(
      -MAX_HISTORY_MESSAGES,
    )
    .map(
      (message) => ({
        role:
          message.role,
        content:
          normalizeText(
            message.content,
          ),
      }),
    );
}

/* ============================================================
   READ-ONLY TOOL EXECUTION
============================================================ */

/*
 * IMPORTANT SECURITY RULE
 *
 * The model NEVER supplies the player ID.
 *
 * The authenticated user ID is always supplied by the backend.
 *
 * Example:
 *
 * User JWT
 *    ↓
 * requireAuth()
 *    ↓
 * user.id
 *    ↓
 * executeTool()
 *    ↓
 * getMyWallet(user.id)
 *
 * Therefore a prompt such as:
 *
 *   "show me user abc's balance"
 *
 * cannot make the AI access another player.
 */

async function executeTool(
  name: string,
  authenticatedUserId: string,
): Promise<string> {
  switch (name) {
    case "getMyWallet": {
      const result =
        await getMyWallet(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestDeposit": {
      const result =
        await getMyLatestDeposit(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestWithdrawal": {
      const result =
        await getMyLatestWithdrawal(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyRecentTransactions": {
      const result =
        await getMyRecentTransactions(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    default:
      throw new Error(
        `Unsupported read-only support tool: ${name}`,
      );
  }
}

/* ============================================================
   OPENROUTER TOOL LOOP
============================================================ */

async function runOpenRouter(
  authenticatedUserId: string,
  message: string,
  history: OpenRouterMessage[],
  knowledgeText: string,
): Promise<string | null> {
  /*
   * Start with system instructions.
   */
  const messages: OpenRouterMessage[] =
    [
      {
        role: "system",
        content:
          SYSTEM_PROMPT,
      },
    ];

  /*
   * Add relevant knowledge.
   */
  if (
    knowledgeText &&
    knowledgeText.trim()
  ) {
    messages.push({
      role: "system",
      content:
        [
          "Relevant support knowledge:",
          "",
          knowledgeText,
        ].join("\n"),
    });
  }

  /*
   * Add previous conversation.
   */
  messages.push(
    ...history,
  );

  /*
   * Add current user message.
   */
  messages.push({
    role: "user",
    content: message,
  });

  let toolCallCount = 0;

  /*
   * ----------------------------------------------------------
   * MODEL / TOOL LOOP
   * ----------------------------------------------------------
   *
   * Round 1:
   *
   * AI may answer directly:
   *
   *   AI -> answer
   *
   * OR:
   *
   *   AI -> getMyWallet()
   *
   * Round 2:
   *
   *   tool result -> AI -> final answer
   */
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

    const content =
      typeof result.content ===
      "string"
        ? result.content.trim()
        : "";

    const toolCalls =
      Array.isArray(
        result.toolCalls,
      )
        ? result.toolCalls
        : [];

    /*
     * --------------------------------------------------------
     * NORMAL FINAL ANSWER
     * --------------------------------------------------------
     */
    if (
      toolCalls.length === 0
    ) {
      if (content) {
        return content;
      }

      return null;
    }

    /*
     * --------------------------------------------------------
     * TOOL LIMIT
     * --------------------------------------------------------
     */
    if (
      toolCallCount >=
      MAX_TOOL_CALLS_PER_REQUEST
    ) {
      console.warn(
        "AI support tool-call limit reached.",
      );

      return null;
    }

    /*
     * --------------------------------------------------------
     * IMPORTANT
     *
     * Preserve the ORIGINAL assistant tool_calls.
     *
     * OpenRouter expects:
     *
     * assistant:
     *   tool_calls: [...]
     *
     * followed by:
     *
     * tool:
     *   tool_call_id: ...
     *
     * The previous support.ts only pushed:
     *
     *   role: assistant
     *   content: ""
     *
     * which loses the tool-call information.
     * --------------------------------------------------------
     */

    messages.push({
      role: "assistant",
      content:
        content || null,
      tool_calls:
        toolCalls,
    });

    /*
     * --------------------------------------------------------
     * EXECUTE EACH TOOL
     * --------------------------------------------------------
     */
    for (
      const toolCall of toolCalls
    ) {
      if (
        toolCallCount >=
        MAX_TOOL_CALLS_PER_REQUEST
      ) {
        break;
      }

      const toolName =
        toolCall.function
          ?.name;

      if (
        !toolName ||
        typeof toolName !==
          "string"
      ) {
        continue;
      }

      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT trust:
       *
       * toolCall.function.arguments
       *
       * for user identity.
       *
       * The authenticated user ID is supplied directly.
       */
      try {
        toolCallCount += 1;

        const toolResult =
          await executeTool(
            toolName,
            authenticatedUserId,
          );

        messages.push({
          role: "tool",
          content:
            toolResult,
          tool_call_id:
            toolCall.id,
          name: toolName,
        });
      } catch (error) {
        console.error(
          `AI support tool failed: ${toolName}`,
          error,
        );

        /*
         * Do not expose database/internal
         * errors to the player.
         */
        messages.push({
          role: "tool",
          content:
            JSON.stringify({
              success: false,
              found: false,
              error:
                "Unable to retrieve the requested account information.",
            }),
          tool_call_id:
            toolCall.id,
          name: toolName,
        });
      }
    }

    /*
     * Continue the loop.
     *
     * The next OpenRouter request receives:
     *
     * assistant tool_calls
     * +
     * tool results
     *
     * and can produce the final answer.
     */
  }

  /*
   * If we reach here, the model did not produce
   * a final natural-language answer.
   */
  return null;
}

/* ============================================================
   KNOWLEDGE SEARCH
============================================================ */

async function loadKnowledge(
  message: string,
): Promise<{
  results: unknown[];
  text: string;
}> {
  try {
    const results =
      await searchKnowledge(
        message,
        5,
      );

    if (
      !Array.isArray(results)
    ) {
      return {
        results: [],
        text: "",
      };
    }

    const text =
      knowledgeToText(
        results,
      );

    return {
      results,
      text:
        typeof text ===
        "string"
          ? text.trim()
          : "",
    };
  } catch (error) {
    console.error(
      "Knowledge search failed:",
      error,
    );

    return {
      results: [],
      text: "",
    };
  }
}

/* ============================================================
   CUSTOM TRAINING FALLBACK
============================================================ */

async function runCustomTrainingFallback(
  message: string,
): Promise<AIResponse | null> {
  try {
    /*
     * This is the actual local deterministic
     * training AI.
     *
     * It searches:
     *
     *   training/*.json
     *   knowledge/*.json
     *
     * through the existing RAG layer.
     */
    const result =
      await generateCustomTrainingResponse(
        message,
      );

    if (!result) {
      return null;
    }

    const answer =
      typeof result.message ===
      "string"
        ? result.message.trim()
        : "";

    if (!answer) {
      return null;
    }

    /*
     * generateCustomTrainingResponse()
     * returns confidence 0 for no result,
     * and approximately 0.35 for weak matches.
     *
     * Do NOT present weak/no-match content
     * as a reliable answer.
     */
    if (
      result.confidence <
      0.55
    ) {
      return null;
    }

    return {
      success: true,
      message: answer,
      source: "TRAINING",
      confidence:
        result.confidence,
      matchedDocuments:
        result.matchedDocuments,
    };
  } catch (error) {
    console.error(
      "Custom training AI fallback failed:",
      error,
    );

    return null;
  }
}

/* ============================================================
   HUMAN FALLBACK
============================================================ */

function humanFallback(): AIResponse {
  return {
    success: true,
    source: "HUMAN",
    message:
      "I could not find a reliable answer for your question. Please create a support ticket so our admin support team can help you.",
  };
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
      /* ======================================================
         METHOD
      ====================================================== */

      if (
        event.httpMethod !==
        "POST"
      ) {
        return response(
          405,
          {
            success: false,
            message:
              "Method not allowed.",
          },
        );
      }

      /* ======================================================
         AUTHENTICATION
      ====================================================== */

      let user;

      try {
        /*
         * requireAuth() returns the authenticated user
         * directly and throws AuthError when authentication
         * fails.
         */
        user =
          await requireAuth(
            event,
          );
      } catch (error) {
        console.error(
          "AI support authentication error:",
          error,
        );

        const statusCode =
          error &&
          typeof error ===
            "object" &&
          "statusCode" in
            error
            ? Number(
                (
                  error as {
                    statusCode?: unknown;
                  }
                )
                  .statusCode,
              )
            : 401;

        const safeStatusCode =
          Number.isInteger(
            statusCode,
          ) &&
          statusCode >= 200 &&
          statusCode <= 599
            ? statusCode
            : 401;

        const message =
          error instanceof
            Error
            ? error.message
            : "Authentication required. Please log in again.";

        return response(
          safeStatusCode,
          {
            success: false,
            message,
          },
        );
      }

      /*
       * The existing auth.ts normalizes:
       *
       * user.id
       * user.userId
       *
       * to the authenticated player's UUID.
       */
      const authenticatedUserId =
        typeof user?.id ===
        "string"
          ? user.id.trim()
          : typeof user?.userId ===
              "string"
            ? user.userId.trim()
            : "";

      if (
        !authenticatedUserId
      ) {
        return response(
          401,
          {
            success: false,
            message:
              "Authenticated user not found.",
          },
        );
      }

      /* ======================================================
         REQUEST BODY
      ====================================================== */

      let body:
        | SupportRequestBody
        | null = null;

      try {
        body = event.body
          ? (JSON.parse(
              event.body,
            ) as SupportRequestBody)
          : {};
      } catch {
        return response(
          400,
          {
            success: false,
            message:
              "Invalid JSON request body.",
          },
        );
      }

      const message =
        getUserMessage(
          body,
        );

      if (!message) {
        return response(
          400,
          {
            success: false,
            message:
              "Please enter a support message.",
          },
        );
      }

      if (
        message.length >
        MAX_MESSAGE_LENGTH
      ) {
        return response(
          400,
          {
            success: false,
            message:
              `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
          },
        );
      }

      /* ======================================================
         AI SUPPORT SETTING
      ====================================================== */

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
         * Local training remains available.
         */
        aiEnabled = false;
      }

      /* ======================================================
         RATE LIMIT
      ====================================================== */

      try {
        const rateLimit =
          await checkRateLimitDetailed(
            authenticatedUserId,
          );

        if (
          rateLimit &&
          rateLimit.allowed ===
            false
        ) {
          return response(
            429,
            {
              success: false,
              message:
                "You have sent too many support messages. Please try again later.",
            },
          );
        }
      } catch (error) {
        /*
         * Preserve the existing behavior:
         *
         * rate-limit infrastructure failure should
         * not unnecessarily destroy support.
         */
        console.error(
          "Rate limit check failed:",
          error,
        );
      }

      /* ======================================================
         KNOWLEDGE SEARCH
      ====================================================== */

      const knowledge =
        await loadKnowledge(
          message,
        );

      /* ======================================================
         OPENROUTER
      ====================================================== */

      if (aiEnabled) {
        try {
          const answer =
            await runOpenRouter(
              authenticatedUserId,
              message,
              getHistory(body),
              knowledge.text,
            );

          if (
            answer &&
            answer.trim()
          ) {
            return response(
              200,
              {
                success: true,
                message:
                  answer.trim(),
                source:
                  "OPENROUTER",
              },
            );
          }
        } catch (error) {
          /*
           * IMPORTANT:
           *
           * OpenRouter is optional.
           *
           * 429
           * timeout
           * provider failure
           * unavailable model
           * tool failure
           *
           * must continue to local training.
           */
          console.error(
            "OpenRouter support error:",
            error,
          );
        }
      }

      /* ======================================================
         LOCAL CUSTOM TRAINING AI
      ====================================================== */

      /*
       * IMPORTANT:
       *
       * This is intentionally unconditional.
       *
       * We do NOT require knowledge.results.length > 0
       * before calling generateCustomTrainingResponse().
       *
       * The custom training AI performs its own RAG search.
       */
      const trainingResponse =
        await runCustomTrainingFallback(
          message,
        );

      if (
        trainingResponse
      ) {
        return response(
          200,
          trainingResponse,
        );
      }

      /* ======================================================
         HUMAN SUPPORT
      ====================================================== */

      /*
       * At this point:
       *
       * - OpenRouter did not provide a reliable answer
       * - local deterministic training did not provide
       *   a sufficiently strong answer
       *
       * Do not invent an answer.
       *
       * Return HUMAN so the existing support/ticket layer
       * can handle the conversation.
       */
      return response(
        200,
        humanFallback(),
      );
    } catch (error) {
      console.error(
        "AI SUPPORT UNHANDLED ERROR:",
        error,
      );

      return response(
        500,
        {
          success: false,
          message:
            "AI support is temporarily unavailable. Please try again or contact support.",
        },
      );
    }
  };
