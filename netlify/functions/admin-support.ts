/*
 * ============================================================
 * ADMIN SUPPORT CONVERSATIONS
 * ============================================================
 *
 * GET /api/admin/support
 *
 * Returns all support conversations.
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
} from "./support/helpers";

import {
  listConversations,
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
     * LIST
     * --------------------------------------------------------
     */

    const conversations =
      await listConversations();

    return json(
      200,
      {
        success: true,
        conversations,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN SUPPORT LIST ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to load support conversations.",
      },
    );
  }
};