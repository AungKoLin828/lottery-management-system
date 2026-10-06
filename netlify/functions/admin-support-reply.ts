/*
 * ============================================================
 * ADMIN SUPPORT REPLY
 * ============================================================
 *
 * POST /api/admin/support/reply
 *
 * Body:
 *
 * {
 *   "conversationId": 123,
 *   "message": "How can I help you?"
 * }
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
} from "@netlify/functions";

import {
  authenticateAdmin,
  getNumericUserId,
  json,
  parseJsonBody,
  requireMethod,
} from "./support/helpers";

import {
  getConversation,
  addMessage,
  updateConversationStatus,
} from "./support/db";

interface ReplyBody {
  conversationId?: unknown;
  message?: unknown;
}

export const handler: Handler =
  async (
    event: HandlerEvent,
  ) => {
    const methodError =
      requireMethod(
        event,
        "POST",
      );

    if (methodError) {
      return methodError;
    }

    try {
      const admin =
        await authenticateAdmin(
          event,
        );

      const adminId =
        getNumericUserId(
          admin,
        );

      const body =
        parseJsonBody<ReplyBody>(
          event,
        );

      const conversationId =
        Number(
          body.conversationId,
        );

      const message =
        typeof body.message ===
        "string"
          ? body.message.trim()
          : "";

      if (
        !Number.isSafeInteger(
          conversationId,
        ) ||
        conversationId <= 0
      ) {
        return json(
          400,
          {
            error:
              "Valid conversationId is required.",
          },
        );
      }

      if (!message) {
        return json(
          400,
          {
            error:
              "Reply message is required.",
          },
        );
      }

      if (
        message.length > 2000
      ) {
        return json(
          400,
          {
            error:
              "Reply message must not exceed 2000 characters.",
          },
        );
      }

      const conversation =
        await getConversation(
          conversationId,
        );

      if (!conversation) {
        return json(
          404,
          {
            error:
              "Support conversation not found.",
          },
        );
      }

      if (
        conversation.status ===
        "CLOSED"
      ) {
        return json(
          409,
          {
            error:
              "This support conversation is already closed.",
          },
        );
      }

      /* ======================================================
         ADMIN MESSAGE
      ====================================================== */

      const supportMessage =
        await addMessage(
          conversationId,
          "ADMIN",
          adminId,
          message,
        );

      /* ======================================================
         HUMAN STATUS
      ====================================================== */

      await updateConversationStatus(
        conversationId,
        "HUMAN",
      );

      return json(
        200,
        {
          message:
            supportMessage,
        },
      );
    } catch (error) {
      console.error(
        "ADMIN SUPPORT REPLY ERROR:",
        error,
      );

      const statusCode =
        error &&
        typeof error ===
          "object" &&
        "statusCode" in error
          ? Number(
              (
                error as {
                  statusCode?: unknown;
                }
              ).statusCode,
            )
          : 500;

      return json(
        Number.isInteger(
          statusCode,
        ) &&
          statusCode >= 400 &&
          statusCode <= 599
          ? statusCode
          : 500,
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to send support reply.",
        },
      );
    }
  };