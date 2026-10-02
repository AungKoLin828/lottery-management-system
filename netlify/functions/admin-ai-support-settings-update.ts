import type {
  Handler,
} from "@netlify/functions";

import {
  verifyAdminAuth,
  AuthError,
  jsonResponse,
  parseBody,
} from "./ai/auth";

import {
  setAISupportEnabled,
} from "./ai/settings";

/* ============================================================
   TYPES
============================================================ */

interface UpdateAISupportSettingsBody {
  enabled?: unknown;
}

/* ============================================================
   BOOLEAN NORMALIZER
============================================================ */

function parseBoolean(
  value: unknown,
): boolean | null {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "on"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "off"
    ) {
      return false;
    }
  }

  return null;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (event) => {
    /*
     * PATCH is used because we are modifying
     * an existing setting.
     */

    if (
      event.httpMethod !==
      "PATCH"
    ) {
      return jsonResponse(
        405,
        {
          success: false,
          message:
            "Method not allowed.",
        },
        {
          Allow: "PATCH",
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
         REQUEST BODY
      ====================================================== */

      let body:
        UpdateAISupportSettingsBody;

      try {
        body =
          parseBody<UpdateAISupportSettingsBody>(
            event,
          );
      } catch (error) {
        return jsonResponse(
          400,
          {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Invalid request body.",
          },
        );
      }

      /* ======================================================
         ENABLED
      ====================================================== */

      const enabled =
        parseBoolean(
          body.enabled,
        );

      if (
        enabled === null
      ) {
        return jsonResponse(
          400,
          {
            success: false,
            message:
              "The 'enabled' field must be a boolean.",
          },
        );
      }

      /* ======================================================
         SAVE
      ====================================================== */

      const settings =
        await setAISupportEnabled(
          enabled,
          admin.userId,
        );

      /* ======================================================
         RESPONSE
      ====================================================== */

      return jsonResponse(
        200,
        {
          success: true,

          message: enabled
            ? "AI support enabled successfully."
            : "AI support disabled successfully.",

          settings: {
            enabled:
              settings.enabled,

            updatedAt:
              settings.updatedAt,

            updatedBy:
              settings.updatedBy,
          },
        },
      );
    } catch (error) {
      console.error(
        "UPDATE AI SUPPORT SETTINGS ERROR:",
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
            "Failed to update AI support settings.",
        },
      );
    }
  };