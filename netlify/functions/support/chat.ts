import type {
  Handler,
  HandlerEvent,
} from "@netlify/functions";

import {
  requireMethod,
} from "./helpers";

import {
  authenticate,
  parseJsonBody,
  response,
  handleError,
} from "./helpers";

import {
  getOrCreateConversation,
  listMessages,
  addMessage,
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
  language?: unknown;
}

interface AIHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

type SupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalizeSource(
  source: unknown,
  escalated: unknown,
): SupportSource {
  const value =
    String(source ?? "")
      .trim()
      .toUpperCase();

  if (value === "OPENROUTER") {
    return "OPENROUTER";
  }

  if (value === "TRAINING") {
    return "TRAINING";
  }

  if (
    value === "HUMAN" ||
    escalated === true
  ) {
    return "HUMAN";
  }

  /*
   * Existing AI handler should normally return a source.
   * If not, assume OPENROUTER because it produced an AI answer.
   */
  return "OPENROUTER";
}

function normalizeHistory(
  messages: Awaited<
    ReturnType<typeof listMessages>
  >,
): AIHistoryMessage[] {
  return messages
    .filter(
      (item) =>
        item.senderType === "PLAYER" ||
        item.senderType === "AI",
    )
    .slice(-10)
    .map((item) => ({
      role:
        item.senderType === "PLAYER"
          ? "user"
          : "assistant",
      content: item.message,
    }));
}

function parseAIResponseBody(
  body: string | null | undefined,
): Record<string, unknown> {
  if (!body) {
    return {};
  }

  try {
    const parsed = JSON.parse(body);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed as Record<
        string,
        unknown
      >;
    }
  } catch (error) {
    console.error(
      "Unable to parse AI support response:",
      error,
    );
  }

  return {};
}

function getAIMessage(
  data: Record<string, unknown>,
): string {
  const candidates = [
    data.message,
    data.answer,
    data.response,
    data.content,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  return "";
}

/*
 * ============================================================
 * HANDLER
 * ============================================================
 */

export const handler: Handler = async (
  event: HandlerEvent,
) => {
  try {
    requireMethod(event, "POST");

    const {
      userId,
    } = await authenticate(event);

    const body =
      parseJsonBody<ChatBody>(event);

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const language =
      typeof body.language === "string" &&
      body.language.trim()
        ? body.language.trim()
        : "en";

    if (!message) {
      return response(
        400,
        {
          success: false,
          error:
            "Message is required",
        },
      );
    }

    if (message.length > 2000) {
      return response(
        400,
        {
          success: false,
          error:
            "Message must not exceed 2000 characters",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * GET OR CREATE CONVERSATION
     * --------------------------------------------------------
     */

    const conversation =
      await getOrCreateConversation(
        userId,
        language,
      );

    /*
     * --------------------------------------------------------
     * SAVE PLAYER MESSAGE
     * --------------------------------------------------------
     */

    await addMessage({
      conversationId:
        conversation.id,

      senderType: "PLAYER",

      senderId: userId,

      message,
    });

    /*
     * --------------------------------------------------------
     * LOAD CONVERSATION HISTORY
     *
     * This avoids trusting the browser to provide AI history.
     * --------------------------------------------------------
     */

    const storedMessages =
      await listMessages(
        conversation.id,
        50,
      );

    const history =
      normalizeHistory(
        storedMessages,
      );

    /*
     * --------------------------------------------------------
     * CALL EXISTING AI SUPPORT
     *
     * We intentionally reuse:
     *
     * netlify/functions/ai/support.ts
     *
     * Therefore:
     *
     * OpenRouter
     *     ↓
     * Training fallback
     *     ↓
     * Human escalation
     *
     * remains in your existing implementation.
     * --------------------------------------------------------
     */

    let aiResult;

    try {
      aiResult =
        await aiSupportHandler({
          ...event,

          body: JSON.stringify({
            message,
            history,
          }),
        });
    } catch (error) {
      console.error(
        "AI support handler failed:",
        error,
      );

      /*
       * The existing AI service should normally
       * convert OpenRouter failures into its
       * training fallback.
       *
       * If the handler itself crashes, we still
       * escalate instead of returning 500.
       */

      await updateConversationStatus(
        conversation.id,
        "HUMAN",
      );

      const systemMessage =
        await addMessage({
          conversationId:
            conversation.id,

          senderType: "SYSTEM",

          senderId: null,

          message:
            "Your request has been forwarded to our support team. An administrator will assist you shortly.",
        });

      return response(
        200,
        {
          success: true,

          conversation:
            await updateConversationStatus(
              conversation.id,
              "HUMAN",
            ),

          message: systemMessage,

          escalated: true,

          source: "HUMAN",

          intent: null,

          confidence: 0,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * READ AI FUNCTION RESPONSE
     * --------------------------------------------------------
     */

    const aiData =
      parseAIResponseBody(
        aiResult.body,
      );

    /*
     * --------------------------------------------------------
     * NON-2XX SAFETY
     * --------------------------------------------------------
     */

    if (
      aiResult.statusCode < 200 ||
      aiResult.statusCode >= 300
    ) {
      console.error(
        "AI support returned non-success status:",
        aiResult.statusCode,
        aiData,
      );

      await updateConversationStatus(
        conversation.id,
        "HUMAN",
      );

      const systemMessage =
        await addMessage({
          conversationId:
            conversation.id,

          senderType: "SYSTEM",

          senderId: null,

          message:
            "Your request has been forwarded to our support team. An administrator will assist you shortly.",
        });

      const updatedConversation =
        await updateConversationStatus(
          conversation.id,
          "HUMAN",
        );

      return response(
        200,
        {
          success: true,

          conversation:
            updatedConversation,

          message: systemMessage,

          escalated: true,

          source: "HUMAN",

          intent: null,

          confidence: 0,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * NORMAL AI RESPONSE
     * --------------------------------------------------------
     */

    const answer =
      getAIMessage(aiData);

    const source =
      normalizeSource(
        aiData.source,
        aiData.escalated,
      );

    const escalated =
      source === "HUMAN" ||
      aiData.escalated === true;

    const intent =
      typeof aiData.intent === "string"
        ? aiData.intent
        : null;

    const confidence =
      typeof aiData.confidence === "number" ||
      typeof aiData.confidence === "string"
        ? aiData.confidence
        : 0;

    /*
     * --------------------------------------------------------
     * HUMAN ESCALATION
     * --------------------------------------------------------
     */

    if (
      escalated ||
      !answer
    ) {
      const updatedConversation =
        await updateConversationStatus(
          conversation.id,
          "HUMAN",
        );

      const systemMessage =
        await addMessage({
          conversationId:
            conversation.id,

          senderType: "SYSTEM",

          senderId: null,

          message:
            answer ||
            "Your request has been forwarded to our support team. An administrator will assist you shortly.",

          intent,

          confidence,
        });

      return response(
        200,
        {
          success: true,

          conversation:
            updatedConversation,

          message: systemMessage,

          escalated: true,

          source: "HUMAN",

          intent,

          confidence,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * SAVE AI MESSAGE
     * --------------------------------------------------------
     */

    const aiMessage =
      await addMessage({
        conversationId:
          conversation.id,

        senderType: "AI",

        senderId: null,

        message: answer,

        intent,

        confidence,
      });

    /*
     * --------------------------------------------------------
     * RETURN
     * --------------------------------------------------------
     */

    const updatedConversation =
      await updateConversationStatus(
        conversation.id,
        "AI",
      );

    return response(
      200,
      {
        success: true,

        conversation:
          updatedConversation,

        message: aiMessage,

        escalated: false,

        source,

        intent,

        confidence,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "SUPPORT CHAT ERROR:",
    );
  }
};