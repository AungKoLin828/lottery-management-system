import type { Handler } from "@netlify/functions";

import {
  authenticateAdmin,
  handleError,
  parseJsonBody,
  requireMethod,
  response,
} from "./support/helpers";

import {
  addMessage,
  getConversation,
  updateConversationStatus,
} from "./support/db";

interface ReplyBody {
  conversationId?: unknown;
  message?: unknown;
}

/*
 * ============================================================
 * ADMIN SUPPORT REPLY
 * ============================================================
 */

export const handler: Handler = async (
  event,
) => {
  try {
    requireMethod(event, "POST");

    const {
      userId: adminId,
    } = await authenticateAdmin(event);

    const body =
      parseJsonBody<ReplyBody>(
        event,
      );

    const conversationId =
      Number(body.conversationId);

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

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

    if (message.length > 5000) {
      return response(
        400,
        {
          success: false,
          error:
            "Message must not exceed 5000 characters",
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

    if (
      conversation.status ===
      "CLOSED"
    ) {
      return response(
        409,
        {
          success: false,
          error:
            "This conversation is already closed",
        },
      );
    }

    const supportMessage =
      await addMessage({
        conversationId,

        senderType: "ADMIN",

        senderId: adminId,

        message,
      });

    const updatedConversation =
      await updateConversationStatus(
        conversationId,
        "HUMAN",
      );

    return response(
      200,
      {
        success: true,

        conversation:
          updatedConversation,

        message:
          supportMessage,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "ADMIN SUPPORT REPLY ERROR:",
    );
  }
};