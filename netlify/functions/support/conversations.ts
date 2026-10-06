/*
 * ============================================================
 * PLAYER SUPPORT CONVERSATION
 * ============================================================
 *
 * GET /api/support/conversations
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
} from "./helpers";

import {
  findActiveConversation,
  listMessages,
} from "./db";

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
    if (
      event.httpMethod.toUpperCase() !==
      "GET"
    ) {
      return json(
        405,
        {
          success: false,
          error: "Method not allowed.",
        },
      );
    }

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

    const conversation =
      await findActiveConversation(
        userId,
      );

    if (!conversation) {
      return json(
        200,
        {
          success: true,
          conversation: null,
          messages: [],
        },
      );
    }

    const messages =
      await listMessages(
        conversation.id,
      );

    return json(
      200,
      {
        success: true,
        conversation,
        messages,
      },
    );
  } catch (error) {
    console.error(
      "SUPPORT CONVERSATION ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to load support conversation.",
      },
    );
  }
};