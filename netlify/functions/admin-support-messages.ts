/*
 * ============================================================
 * ADMIN SUPPORT CONVERSATION MESSAGES
 * ============================================================
 *
 * GET
 * /api/admin/support/messages?conversationId=123
 *
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  authenticateAdmin,
  json,
  parsePositiveInteger,
} from "./support/helpers";

import {
  getConversation,
  listMessages,
} from "./support/db";

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

    /*
     * --------------------------------------------------------
     * ADMIN AUTH
     * --------------------------------------------------------
     */

    try {
      await authenticateAdmin(
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
              : "Administrator authentication required.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * CONVERSATION ID
     * --------------------------------------------------------
     */

    const conversationId =
      parsePositiveInteger(
        event.queryStringParameters
          ?.conversationId,
      );

    if (!conversationId) {
      return json(
        400,
        {
          success: false,
          error:
            "A valid conversationId is required.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * GET CONVERSATION
     * --------------------------------------------------------
     */

    const conversation =
      await getConversation(
        conversationId,
      );

    if (!conversation) {
      return json(
        404,
        {
          success: false,
          error:
            "Support conversation not found.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * GET MESSAGES
     * --------------------------------------------------------
     */

    const messages =
      await listMessages(
        conversationId,
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
      "ADMIN SUPPORT MESSAGES ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to load support conversation messages.",
      },
    );
  }
};