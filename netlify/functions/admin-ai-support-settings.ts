import type {
  Handler,
} from "@netlify/functions";

import {
  verifyAdminAuth,
  AuthError,
  jsonResponse,
} from "./ai/auth";

import {
  getAISupportSettings,
} from "./ai/settings";

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (event) => {
    /*
     * GET only
     */

    if (
      event.httpMethod !==
      "GET"
    ) {
      return jsonResponse(
        405,
        {
          success: false,
          message:
            "Method not allowed.",
        },
        {
          Allow: "GET",
        },
      );
    }

    try {
      /* ======================================================
         ADMIN AUTH
      ====================================================== */

      const admin =
        await verifyAdminAuth(
          event,
        );

      /* ======================================================
         LOAD SETTINGS
      ====================================================== */

      const settings =
        await getAISupportSettings();

      /* ======================================================
         RESPONSE
      ====================================================== */

      return jsonResponse(
        200,
        {
          success: true,

          settings: {
            enabled:
              settings.enabled,

            updatedAt:
              settings.updatedAt,

            updatedBy:
              settings.updatedBy,
          },

          admin: {
            id:
              admin.userId,

            username:
              admin.username ??
              null,
          },
        },
      );
    } catch (error) {
      console.error(
        "ADMIN AI SUPPORT SETTINGS ERROR:",
        error,
      );

      if (
        error instanceof AuthError
      ) {
        return jsonResponse(
          error.statusCode,
          {
            success: false,
            message:
              error.message,
          },
        );
      }

      return jsonResponse(
        500,
        {
          success: false,
          message:
            "Failed to load AI support settings.",
        },
      );
    }
  };