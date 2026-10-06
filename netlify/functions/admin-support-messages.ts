import type { Handler } from "@netlify/functions";

import {
  authenticateAdmin,
  handleError,
  requireMethod,
  response,
} from "./support/helpers";

import {
  getConversation,
  listMessages,
} from "./support/db";

/*
 * ============================================================
 * ADMIN SUPPORT MESSAGES
 * ============================================================
 */

export const handler: Handler = async (
  event,
) => {
  try {
    requireMethod(event, "GET");

    await authenticateAdmin(event);

    const rawId =
      event.queryStringParameters
        ?.conversationId;

    const conversationId =
      Number(rawId);

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      return response(
        400,
        {
          success: false,
          error:
            "Valid conversationId is required",
        },
      );
    }

    const conversation =
      await getConversation(
        conversationId,
      );

    if (!conversation) {
      return response(
        404,
        {
          success: false,
          error:
            "Conversation not found",
        },
      );
    }

    const messages =
      await listMessages(
        conversationId,
        500,
      );

    return response(
      200,
      {
        success: true,

        conversation,

        messages,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "ADMIN SUPPORT MESSAGES ERROR:",
    );
  }
};