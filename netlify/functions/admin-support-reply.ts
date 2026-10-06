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
 *   "message": "..."
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
  addMessage,
  getConversation,
  updateConversationStatus,
} from "./support/db";

interface AdminReplyBody {
  conversationId?: unknown;
  message?: unknown;
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

    let admin;

    try {
      admin =
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

    let body: AdminReplyBody;

    try {
      body =
        parseJsonBody<AdminReplyBody>(
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

    /*
     * --------------------------------------------------------
     * CONVERSATION ID
     * --------------------------------------------------------
     */

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
     * MESSAGE
     * --------------------------------------------------------
     */

    if (
      typeof body.message !==
      "string"
    ) {
      return json(
        400,
        {
          success: false,
          error:
            "Message is required.",
        },
      );
    }

    const message =
      body.message.trim();

    if (!message) {
      return json(
        400,
        {
          success: false,
          error:
            "Message cannot be empty.",
        },
      );
    }

    if (
      message.length > 5000
    ) {
      return json(
        400,
        {
          success: false,
          error:
            "Message must not exceed 5000 characters.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * FIND CONVERSATION
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
     * CLOSED CHECK
     * --------------------------------------------------------
     */

    if (
      conversation.status ===
      "CLOSED"
    ) {
      return json(
        409,
        {
          success: false,
          error:
            "This support conversation is closed.",
        },
      );
    }

    /*
     * --------------------------------------------------------
     * ADMIN USER ID
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * Admin ID is also a UUID string.
     *
     * Never use Number(admin.id).
     */

    const adminId =
      admin.userId ??
      admin.id;

    /*
     * --------------------------------------------------------
     * SAVE ADMIN MESSAGE
     * --------------------------------------------------------
     */

    const savedMessage =
      await addMessage(
        conversationId,
        "ADMIN",
        adminId,
        message,
        null,
        null,
      );

    /*
     * --------------------------------------------------------
     * HUMAN STATUS
     * --------------------------------------------------------
     */

    const updatedConversation =
      await updateConversationStatus(
        conversationId,
        "HUMAN",
      );

    return json(
      200,
      {
        success: true,
        conversation:
          updatedConversation ??
          conversation,
        message:
          savedMessage,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN SUPPORT REPLY ERROR:",
      error,
    );

    return json(
      500,
      {
        success: false,
        error:
          "Failed to send support reply.",
      },
    );
  }
};