import type { Handler } from "@netlify/functions";

import {
  authenticateAdmin,
  handleError,
  parseJsonBody,
  requireMethod,
  response,
} from "./support/helpers";

import {
  getConversation,
  updateConversationStatus,
} from "./support/db";

interface CloseBody {
  conversationId?: unknown;
}

/*
 * ============================================================
 * ADMIN CLOSE SUPPORT CONVERSATION
 * ============================================================
 */

export const handler: Handler = async (
  event,
) => {
  try {
    requireMethod(event, "POST");

    await authenticateAdmin(event);

    const body =
      parseJsonBody<CloseBody>(
        event,
      );

    const conversationId =
      Number(body.conversationId);

    if (
      !Number.isInteger(
        conversationId,
      ) ||
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

    const updatedConversation =
      await updateConversationStatus(
        conversationId,
        "CLOSED",
      );

    return response(
      200,
      {
        success: true,

        conversation:
          updatedConversation,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "ADMIN SUPPORT CLOSE ERROR:",
    );
  }
};