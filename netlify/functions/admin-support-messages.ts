/*
 * ============================================================
 * ADMIN SUPPORT CONVERSATION MESSAGES
 * ============================================================
 *
 * GET
 * /api/admin/support/messages?conversationId=123
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
} from "@netlify/functions";

import {
  authenticateAdmin,
  json,
  requireMethod,
} from "./support/helpers";

import {
  getConversation,
  listMessages,
} from "./support/db";

export const handler: Handler =
  async (
    event: HandlerEvent,
  ) => {
    const methodError =
      requireMethod(
        event,
        "GET",
      );

    if (methodError) {
      return methodError;
    }

    try {
      await authenticateAdmin(
        event,
      );

      const rawId =
        event.queryStringParameters
          ?.conversationId;

      const conversationId =
        Number(rawId);

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

      const messages =
        await listMessages(
          conversationId,
        );

      return json(
        200,
        {
          conversation,
          messages,
        },
      );
    } catch (error) {
      console.error(
        "ADMIN SUPPORT MESSAGES ERROR:",
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
              : "Failed to load support messages.",
        },
      );
    }
  };