/*
 * ============================================================
 * PLAYER CURRENT SUPPORT CONVERSATION
 * ============================================================
 *
 * GET /api/support/conversations
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
} from "@netlify/functions";

import {
  authenticate,
  getNumericUserId,
  json,
  requireMethod,
} from "./helpers";

import {
  findActiveConversation,
  listMessages,
} from "./db";

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
      const user =
        await authenticate(
          event,
        );

      const userId =
        getNumericUserId(user);

      const conversation =
        await findActiveConversation(
          userId,
        );

      if (!conversation) {
        return json(
          200,
          {
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
          conversation,
          messages,
        },
      );
    } catch (error) {
      console.error(
        "GET SUPPORT CONVERSATION ERROR:",
        error,
      );

      return json(
        500,
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to load support conversation.",
        },
      );
    }
  };