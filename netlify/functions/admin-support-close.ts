/*
 * ============================================================
 * ADMIN SUPPORT CLOSE
 * ============================================================
 *
 * POST /api/admin/support/close
 *
 * Body:
 *
 * {
 *   "conversationId": 123
 * }
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
  parseJsonBody,
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
     * BODY
     * --------------------------------------------------------
     */

    let body: CloseBody;

    try {
      body =
        parseJsonBody<CloseBody>(
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

    const conversationId =
      Number(
        body.conversationId,
      );

    if (
      !Number.isInteger(
        conversationId,
      ) ||
      conversationId <= 0
    ) {
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
     * CHECK CONVERSATION
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
     * CLOSE
     * --------------------------------------------------------
     */

    const updatedConversation =
      await updateConversationStatus(
        conversationId,
        "CLOSED",
      );

    return json(
      200,
      {
        success: true,
        conversation:
          updatedConversation ??
          conversation,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN SUPPORT CLOSE ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to close support conversation.",
      },
    );
  }
};