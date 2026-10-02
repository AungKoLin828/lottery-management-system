import type {
  Handler,
} from "@netlify/functions";

import {
  verifyAdminAuth,
  jsonResponse,
  parseBody,
} from "./ai/auth";

import {
  setAISupportEnabled,
} from "./ai/settings";

/* ============================================================
   REQUEST BODY
============================================================ */

interface UpdateAISupportSettingsBody {
  enabled?: unknown;
}

/* ============================================================
   BOOLEAN PARSER
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
    typeof value !==
    "string"
  ) {
    return null;
  }

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

  return null;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (event) => {
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
      const admin =
        await verifyAdminAuth(
          event,
        );

      let body:
        UpdateAISupportSettingsBody;

      try {
        body =
          parseBody<UpdateAISupportSettingsBody>(
            event,
          );
      } catch {
        return jsonResponse(
          400,
          {
            success: false,
            message:
              "Invalid JSON request body.",
          },
        );
      }

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
              "'enabled' must be a boolean.",
          },
        );
      }

      const settings =
        await setAISupportEnabled(
          enabled,
          admin.id,
        );

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
        "Admin AI support settings update error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update AI support settings.";

      const statusCode =
        message ===
        "Admin access required."
          ? 403
          : message.includes(
                "Authentication",
              ) ||
              message.includes(
                "authentication",
              ) ||
              message.includes(
                "token",
              )
            ? 401
            : 500;

      return jsonResponse(
        statusCode,
        {
          success: false,
          message,
        },
      );
    }
  };