/*
 * ============================================================
 * SUPPORT CHAT
 * ============================================================
 *
 * POST /api/support/chat
 *
 * Body:
 *
 * {
 *   "message": "How can I withdraw?"
 * }
 *
 * Flow:
 *
 * PLAYER
 *   |
 *   v
 * support conversation
 *   |
 *   v
 * existing AI support engine
 *   |
 *   +---- OPENROUTER
 *   |
 *   +---- TRAINING
 *   |
 *   +---- HUMAN
 *
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  authenticate,
  getUserId,
  json,
  parseJsonBody,
} from "./helpers";

import {
  addMessage,
  getOrCreateConversation,
  getUserConversationHistory,
  updateConversationStatus,
} from "./db";

import {
  handler as aiSupportHandler,
} from "../ai/support";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

interface ChatBody {
  message?: unknown;
}

interface AIResponseBody {
  success?: boolean;
  message?: unknown;
  source?: unknown;
  intent?: unknown;
  confidence?: unknown;
  escalated?: unknown;
}

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_MESSAGE_LENGTH =
  2000;

const MAX_HISTORY_MESSAGES =
  10;

/*
 * ============================================================
 * NORMALIZE SOURCE
 * ============================================================
 */

function normalizeSource(
  value: unknown,
): "OPENROUTER" | "TRAINING" | "HUMAN" {
  if (
    value ===
    "OPENROUTER"
  ) {
    return "OPENROUTER";
  }

  if (
    value ===
    "TRAINING"
  ) {
    return "TRAINING";
  }

  if (
    value ===
    "HUMAN"
  ) {
    return "HUMAN";
  }

  return "HUMAN";
}

/*
 * ============================================================
 * NORMALIZE CONFIDENCE
 * ============================================================
 */

function normalizeConfidence(
  value: unknown,
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue,
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      numberValue,
    ),
  );
}

/*
 * ============================================================
 * READ AI RESPONSE
 * ============================================================
 */

async function readAIResponse(
  event: HandlerEvent,
): Promise<AIResponseBody> {
  /*
   * The existing ai/support.ts is a Netlify handler.
   *
   * We call it internally so the existing AI pipeline remains
   * the source of truth.
   */

  const response =
    await aiSupportHandler(
      event,
      {} as HandlerContext,
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "AI support returned an invalid response.",
    );
  }

  const body =
    typeof response.body ===
    "string"
      ? response.body
      : "{}";

  try {
    return JSON.parse(
      body,
    ) as AIResponseBody;
  } catch {
    throw new Error(
      "AI support returned invalid JSON.",
    );
  }
}

/*
 * ============================================================
 * HANDLER
 * ============================================================
 */

export const handler: Handler = async (
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
      event.httpMethod.toUpperCase() !==
      "POST"
    ) {
      return json(
        405,
        {
          success: false,
          error: "Method not allowed.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * AUTH
     * --------------------------------------------------------
     */

    let user;

    try {
      user =
        await authenticate(
          event,
        );
    } catch (error) {
      const statusCode =
        error &&
        typeof error === "object" &&
        "statusCode" in error
          ? Number(
              (
                error as {
                  statusCode?: unknown;
                }
              ).statusCode,
            )
          : 401;

      return json(
        Number.isInteger(
          statusCode,
        ) &&
          statusCode >= 400 &&
          statusCode <= 599
          ? statusCode
          : 401,
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Authentication required.",
        },
      );
    }

    const userId =
      getUserId(user);

    /*
     * --------------------------------------------------------
     * BODY
     * --------------------------------------------------------
     */

    let body: ChatBody;

    try {
      body =
        parseJsonBody<ChatBody>(
          event,
        );
    } catch {
      return json(
        400,
        {
          success: false,
          error:
            "Invalid JSON request body.",
        },
      );
    }

    if (
      typeof body.message !==
      "string"
    ) {
      return json(
        400,
        {
          success: false,
          error:
            "Message is required.",
        },
      );
    }

    const message =
      body.message
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim();

    if (!message) {
      return json(
        400,
        {
          success: false,
          error:
            "Please enter a support message.",
        },
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return json(
        400,
        {
          success: false,
          error:
            `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * CONVERSATION
     * --------------------------------------------------------
     */

    const conversation =
      await getOrCreateConversation(
        userId,
        "en",
      );

    /*
     * --------------------------------------------------------
     * SAVE PLAYER MESSAGE
     * --------------------------------------------------------
     */

    const playerMessage =
      await addMessage(
        conversation.id,
        "PLAYER",
        userId,
        message,
        null,
        null,
      );

    /*
     * --------------------------------------------------------
     * BUILD SERVER-SIDE HISTORY
     * --------------------------------------------------------
     *
     * We intentionally build history from the database
     * instead of trusting arbitrary client-provided history.
     */

    const history =
      await getUserConversationHistory(
        userId,
        MAX_HISTORY_MESSAGES,
      );

    /*
     * --------------------------------------------------------
     * CONVERT TO AI SUPPORT FORMAT
     * --------------------------------------------------------
     */

    const historyMessages =
      history
        .filter(
          (item) =>
            item.senderType ===
              "PLAYER" ||
            item.senderType ===
              "AI",
        )
        .slice(
          -MAX_HISTORY_MESSAGES,
        )
        .map(
          (item) => ({
            role:
              item.senderType ===
              "PLAYER"
                ? "user"
                : "assistant",
            content:
              item.message,
          }),
        );

    /*
     * --------------------------------------------------------
     * CALL EXISTING AI SUPPORT
     * --------------------------------------------------------
     *
     * We create a child event that contains:
     *
     * message
     * messages/history
     *
     * Authentication cookie is preserved.
     */

    const aiEvent: HandlerEvent =
      {
        ...event,

        body: JSON.stringify({
          message,
          messages:
            historyMessages,
        }),
      };

    let aiResponse: AIResponseBody;

    try {
      aiResponse =
        await readAIResponse(
          aiEvent,
        );
    } catch (error) {
      console.error(
        "SUPPORT CHAT AI ENGINE ERROR:",
        error,
      );

      /*
       * The existing AI engine should normally already
       * perform:
       *
       * OpenRouter -> Training -> Human
       *
       * If it completely fails, escalate to HUMAN.
       */

      const fallbackMessage =
        "Our AI support service is currently unavailable. Your message has been sent to human support.";

      await updateConversationStatus(
        conversation.id,
        "HUMAN",
      );

      const savedSystemMessage =
        await addMessage(
          conversation.id,
          "SYSTEM",
          null,
          fallbackMessage,
          "human_support",
          0,
        );

      return json(
        200,
        {
          success: true,
          conversation:
            {
              ...conversation,
              status: "HUMAN",
            },
          message:
            savedSystemMessage,
          escalated: true,
          source: "HUMAN",
          intent:
            "human_support",
          confidence: 0,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * AI MESSAGE
     * --------------------------------------------------------
     */

    const aiMessage =
      typeof aiResponse.message ===
      "string"
        ? aiResponse.message.trim()
        : "";

    const source =
      normalizeSource(
        aiResponse.source,
      );

    const intent =
      typeof aiResponse.intent ===
      "string"
        ? aiResponse.intent
        : null;

    const confidence =
      normalizeConfidence(
        aiResponse.confidence,
      );

    const escalated =
      source ===
      "HUMAN" ||
      aiResponse.escalated ===
        true;

    /*
     * --------------------------------------------------------
     * HUMAN ESCALATION
     * --------------------------------------------------------
     */

    if (escalated) {
      await updateConversationStatus(
        conversation.id,
        "HUMAN",
      );

      const humanMessage =
        aiMessage ||
        "Your request has been forwarded to human support.";

      const savedMessage =
        await addMessage(
          conversation.id,
          "SYSTEM",
          null,
          humanMessage,
          intent,
          confidence,
        );

      return json(
        200,
        {
          success: true,
          conversation:
            {
              ...conversation,
              status: "HUMAN",
            },
          message:
            savedMessage,
          escalated: true,
          source: "HUMAN",
          intent,
          confidence,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * AI / TRAINING ANSWER
     * --------------------------------------------------------
     */

    if (!aiMessage) {
      await updateConversationStatus(
        conversation.id,
        "HUMAN",
      );

      const fallbackMessage =
        "I could not find a reliable answer for your request. Your message has been forwarded to human support.";

      const savedMessage =
        await addMessage(
          conversation.id,
          "SYSTEM",
          null,
          fallbackMessage,
          intent,
          confidence,
        );

      return json(
        200,
        {
          success: true,
          conversation:
            {
              ...conversation,
              status: "HUMAN",
            },
          message:
            savedMessage,
          escalated: true,
          source: "HUMAN",
          intent,
          confidence,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * KEEP AI CONVERSATION ACTIVE
     * --------------------------------------------------------
     */

    await updateConversationStatus(
      conversation.id,
      "AI",
    );

    const savedAIMessage =
      await addMessage(
        conversation.id,
        "AI",
        null,
        aiMessage,
        intent,
        confidence,
      );

    return json(
      200,
      {
        success: true,
        conversation:
          {
            ...conversation,
            status: "AI",
          },
        message:
          savedAIMessage,
        escalated: false,
        source,
        intent,
        confidence,
        playerMessage,
      },
    );
  } catch (error) {
    console.error(
      "SUPPORT CHAT ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to process support request.",
      },
    );
  }
};