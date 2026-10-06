/*
 * ============================================================
 * ADMIN CLOSE SUPPORT CONVERSATION
 * ============================================================
 *
 * POST /api/admin/support/close
 *
 * Body:
 *
 * {
 *   "conversationId": 123
 * }
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
} from "@netlify/functions";

import {
  authenticateAdmin,
  json,
  parseJsonBody,
  requireMethod,
} from "./support/helpers";

import {
  getConversation,
  updateConversationStatus,
} from "./support/db";

interface CloseBody {
  conversationId?: unknown;
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
      await authenticateAdmin(
        event,
      );

      const body =
        parseJsonBody<CloseBody>(
          event,
        );

      const conversationId =
        Number(
          body.conversationId,
        );

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
          200,
          {
            success: true,
            conversation,
          },
        );
      }

      const updated =
        await updateConversationStatus(
          conversationId,
          "CLOSED",
        );

      return json(
        200,
        {
          success: true,
          conversation:
            updated,
        },
      );
    } catch (error) {
      console.error(
        "ADMIN SUPPORT CLOSE ERROR:",
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
              : "Failed to close support conversation.",
        },
      );
    }
  };