import type { Handler } from "@netlify/functions";

import {
  authenticateAdmin,
  handleError,
  requireMethod,
  response,
} from "./support/helpers";

import {
  listConversations,
} from "./support/db";

/*
 * ============================================================
 * ADMIN SUPPORT CONVERSATION LIST
 * ============================================================
 */

export const handler: Handler = async (
  event,
) => {
  try {
    requireMethod(event, "GET");

    await authenticateAdmin(event);

    const conversations =
      await listConversations(200);

    return response(
      200,
      {
        success: true,

        conversations,
      },
    );
  } catch (error) {
    return handleError(
      error,
      "ADMIN SUPPORT LIST ERROR:",
    );
  }
};