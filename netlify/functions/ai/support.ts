/**
 * ============================================================
 * CUSTOMER SUPPORT AI
 * ============================================================
 *
 * Flow:
 *
 *                 USER
 *                  │
 *                  ▼
 *             Authentication
 *                  │
 *                  ▼
 *             Rate Limiting
 *                  │
 *                  ▼
 *          OpenRouter Dynamic AI
 *                  │
 *          ┌───────┴────────┐
 *          │                │
 *       SUCCESS           FAILURE
 *          │                │
 *          ▼                ▼
 *      AI answer      Custom Training AI
 *                           │
 *                     ┌─────┴─────┐
 *                     │           │
 *                   MATCH       NO MATCH
 *                     │           │
 *                     ▼           ▼
 *                  Answer    Create ticket
 *
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  requireAuth,
} from "./auth";

import {
  callOpenRouter,
  type OpenRouterMessage,
  type OpenRouterToolCall,
} from "./openRouter";

import {
  generateCustomTrainingResponse,
} from "./customTrainingAI";

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

interface SupportRequestBody {
  message?: string;

  messages?: Array<{
    role?: string;
    content?: string;
  }>;
}

interface AuthenticatedUser {
  id: string;
  userId?: string;
  username?: string;
  phone?: string;
  role?: string;
}

const MAX_MESSAGE_LENGTH =
  2000;

const MAX_HISTORY =
  10;

const MAX_TOOL_ROUNDS =
  2;

function jsonResponse(
  statusCode: number,
  body: unknown
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json",

      "Cache-Control":
        "no-store",
    },

    body: JSON.stringify(body),
  };
}

function getBooleanEnv(
  value:
    | string
    | undefined
): boolean {
  return (
    value === "true" ||
    value === "1" ||
    value === "yes" ||
    value === "on"
  );
}

function sanitizeMessage(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/\0/g, "")
    .trim();
}

function buildHistory(
  body: SupportRequestBody
): OpenRouterMessage[] {
  if (
    !Array.isArray(
      body.messages
    )
  ) {
    return [];
  }

  return body.messages
    .slice(-MAX_HISTORY)
    .map((message) => {
      const role =
        message.role ===
        "assistant"
          ? "assistant"
          : "user";

      const content =
        sanitizeMessage(
          message.content
        );

      return {
        role,
        content,
      };
    })
    .filter(
      (message) =>
        Boolean(
          message.content
        )
    );
}

function extractAssistantText(
  response: Awaited<
    ReturnType<
      typeof callOpenRouter
    >
  >
): string {
  const content =
    response
      .choices?.[0]
      ?.message
      ?.content;

  if (
    typeof content !==
    "string"
  ) {
    return "";
  }

  return content.trim();
}

function getToolCalls(
  response: Awaited<
    ReturnType<
      typeof callOpenRouter
    >
  >
): OpenRouterToolCall[] {
  return (
    response
      .choices?.[0]
      ?.message
      ?.tool_calls ??
    []
  );
}

function safeJsonParse(
  value: string
): Record<string, unknown> {
  try {
    const parsed =
      JSON.parse(value);

    if (
      parsed &&
      typeof parsed ===
        "object"
    ) {
      return parsed as Record<
        string,
        unknown
      >;
    }
  } catch {
    // Ignore.
  }

  return {};
}

async function executeTool(
  toolCall: OpenRouterToolCall,
  userId: string
): Promise<unknown> {
  const name =
    toolCall.function.name;

  const args =
    safeJsonParse(
      toolCall.function
        .arguments
    );

  /*
   * IMPORTANT:
   *
   * userId always comes from JWT.
   * It is never accepted from the AI model.
   */
  switch (name) {
    case "getMyWallet":
      return getMyWallet(
        userId
      );

    case "getMyLatestDeposit":
      return getMyLatestDeposit(
        userId
      );

    case "getMyLatestWithdrawal":
      return getMyLatestWithdrawal(
        userId
      );

    case "getMyRecentTransactions":
      return getMyRecentTransactions(
        userId
      );

    default:
      return {
        error:
          `Unknown tool: ${name}`,
        arguments:
          args,
      };
  }
}

async function generateOpenRouterResponse(
  user: AuthenticatedUser,
  message: string,
  history: OpenRouterMessage[]
): Promise<string> {
  /*
   * Search local knowledge first so OpenRouter has accurate
   * application-specific context.
   */
  const knowledge =
    searchKnowledge(
      message,
      5
    );

  const knowledgeContext =
    knowledgeToText(
      knowledge
    );

  const messages: OpenRouterMessage[] =
    [
      {
        role: "system",
        content:
          SYSTEM_PROMPT,
      },

      ...(knowledgeContext
        ? [
            {
              role: "system" as const,
              content: [
                "Relevant local support knowledge:",
                "",
                knowledgeContext,
                "",
                "Use this information as the primary source for application-specific questions.",
                "Do not invent policies, fees, limits, results, balances, or account information.",
              ].join("\n"),
            },
          ]
        : []),

      ...history,

      {
        role: "user",
        content: message,
      },
    ];

  let toolRounds = 0;

  while (
    toolRounds <
    MAX_TOOL_ROUNDS
  ) {
    const response =
      await callOpenRouter(
        messages,
        {
          tools:
            TOOL_DEFINITIONS,

          toolChoice:
            "auto",

          maxTokens:
            700,

          temperature:
            0.2,
        }
      );

    const toolCalls =
      getToolCalls(
        response
      );

    /*
     * Normal answer.
     */
    if (
      toolCalls.length ===
      0
    ) {
      const answer =
        extractAssistantText(
          response
        );

      if (answer) {
        return answer;
      }

      throw new Error(
        "OpenRouter returned no assistant answer."
      );
    }

    /*
     * Add assistant tool-call message.
     */
    messages.push({
      role: "assistant",

      content:
        response
          .choices?.[0]
          ?.message
          ?.content ??
        null,

      tool_calls:
        toolCalls,
    });

    for (const toolCall of toolCalls) {
      const toolResult =
        await executeTool(
          toolCall,
          user.id
        );

      messages.push({
        role: "tool",

        tool_call_id:
          toolCall.id,

        name:
          toolCall.function
            .name,

        content:
          JSON.stringify(
            toolResult
          ),
      });
    }

    toolRounds++;
  }

  throw new Error(
    "OpenRouter tool execution limit reached."
  );
}

function buildHumanSupportMessage(): string {
  return [
    "I'm unable to provide a reliable answer right now.",
    "",
    "Please create a support ticket and our admin support team will assist you.",
  ].join("\n");
}

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (
    event.httpMethod !==
    "POST"
  ) {
    return jsonResponse(
      405,
      {
        success: false,
        error:
          "Method not allowed.",
      }
    );
  }

  /*
   * AI mode.
   */
  const aiEnabled =
    getBooleanEnv(
      process.env
        .AI_SUPPORT_ENABLED
    );

  if (!aiEnabled) {
    return jsonResponse(
      503,
      {
        success: false,
        error:
          "AI support is currently disabled.",
      }
    );
  }

  /*
   * Parse request.
   */
  let body:
    | SupportRequestBody
    | null = null;

  try {
    body = event.body
      ? JSON.parse(
          event.body
        )
      : null;
  } catch {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          "Invalid request body.",
      }
    );
  }

  if (!body) {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          "Request body is required.",
      }
    );
  }

  const message =
    sanitizeMessage(
      body.message
    );

  if (!message) {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          "Message is required.",
      }
    );
  }

  if (
    message.length >
    MAX_MESSAGE_LENGTH
  ) {
    return jsonResponse(
      400,
      {
        success: false,
        error:
          `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
      }
    );
  }

  /*
   * Authenticate using existing JWT authentication.
   */
  let authUser:
    | AuthenticatedUser
    | null = null;

  try {
    /*
     * Convert Netlify event headers into a Request.
     */
    const protocol =
      event.headers[
        "x-forwarded-proto"
      ] || "https";

    const host =
      event.headers.host ||
      "localhost";

    const request =
      new Request(
        `${protocol}://${host}${event.path}`,
        {
          method:
            "POST",

          headers:
            event.headers as HeadersInit,

          body:
            JSON.stringify(
              body
            ),
        }
      );

    authUser =
      (await requireAuth(
        request
      )) as AuthenticatedUser;
  } catch {
    return jsonResponse(
      401,
      {
        success: false,
        error:
          "Authentication required.",
      }
    );
  }

  if (
    !authUser ||
    !authUser.id
  ) {
    return jsonResponse(
      401,
      {
        success: false,
        error:
          "Authentication required.",
      }
    );
  }

  /*
   * Rate limit.
   */
  try {
    const rateLimit =
      await checkRateLimitDetailed(
        authUser.id
      );

    if (
      rateLimit &&
      rateLimit.allowed ===
        false
    ) {
      return jsonResponse(
        429,
        {
          success: false,

          error:
            "Too many support requests. Please try again later.",

          retryAfter:
            rateLimit.retryAfter,
        }
      );
    }
  } catch {
    /*
     * Do not make the support system unavailable solely because
     * the optional rate limiter failed.
     */
  }

  const history =
    buildHistory(body);

  /*
   * ==========================================================
   * PRIMARY AI
   * ==========================================================
   */
  try {
    const answer =
      await generateOpenRouterResponse(
        authUser,
        message,
        history
      );

    return jsonResponse(
      200,
      {
        success: true,

        message:
          answer,

        source:
          "openrouter",

        fallback:
          false,
      }
    );
  } catch (openRouterError) {
    /*
     * OpenRouter can fail because of:
     *
     * - 429
     * - unavailable model
     * - provider outage
     * - timeout
     * - invalid model
     * - network failure
     *
     * None of these should break customer support.
     */

    console.error(
      "OpenRouter support failed:",
      openRouterError
    );
  }

  /*
   * ==========================================================
   * LOCAL CUSTOM TRAINING AI
   * ==========================================================
   */
  try {
    const fallback =
      await generateCustomTrainingResponse(
        message
      );

    /*
     * If local training found a sufficiently useful answer,
     * return it directly.
     */
    if (
      fallback.confidence >=
        0.55 &&
      !fallback.message.includes(
        "couldn't find a reliable answer"
      )
    ) {
      return jsonResponse(
        200,
        {
          success: true,

          message:
            fallback.message,

          source:
            "custom-training",

          fallback:
            true,

          confidence:
            fallback.confidence,

          matchedDocuments:
            fallback.matchedDocuments,
        }
      );
    }

    /*
     * Local training has no reliable answer.
     * Return a support-ticket-ready response.
     */
    return jsonResponse(
      200,
      {
        success: true,

        message:
          buildHumanSupportMessage(),

        source:
          "human-support",

        fallback:
          true,

        createTicket:
          true,

        trainingMatch:
          fallback.matchedDocuments,
      }
    );
  } catch (trainingError) {
    console.error(
      "Custom training fallback failed:",
      trainingError
    );

    /*
     * Last-resort response.
     *
     * Still HTTP 200 because the support chat itself is
     * functioning even though both AI layers failed.
     */
    return jsonResponse(
      200,
      {
        success: true,

        message:
          buildHumanSupportMessage(),

        source:
          "human-support",

        fallback:
          true,

        createTicket:
          true,
      }
    );
  }
};