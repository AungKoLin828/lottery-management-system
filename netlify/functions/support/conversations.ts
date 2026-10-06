import type { Handler } from "@netlify/functions";

import {
  authenticate,
  handleError,
  requireMethod,
  response,
} from "./helpers";

import {
  findActiveConversation,
  listMessages,
} from "./db";

/*
 * ============================================================
 * PLAYER CONVERSATION
 * ============================================================
 */

export const handler: Handler = async (
  event,
) => {
  try {
    requireMethod(event, "GET");

    const {
      userId,
    } = await authenticate(event);

    const conversation =
      await findActiveConversation(
        userId,
      );

    if (!conversation) {
      return response(
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
        200,
      );

    return response(
      200,
      {
        success: true,

        conversation,

        messages,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "SUPPORT CONVERSATION ERROR:",
    );
  }
};