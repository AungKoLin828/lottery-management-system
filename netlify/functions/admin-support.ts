/*
 * ============================================================
 * ADMIN SUPPORT CONVERSATION LIST
 * ============================================================
 *
 * GET /api/admin/support
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
  listConversations,
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

      const conversations =
        await listConversations();

      return json(
        200,
        {
          conversations,
        },
      );
    } catch (error) {
      console.error(
        "ADMIN SUPPORT LIST ERROR:",
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
              : "Failed to load support conversations.",
        },
      );
    }
  };