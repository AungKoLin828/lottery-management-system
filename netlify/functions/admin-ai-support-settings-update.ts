/*
 * ============================================================
 * ADMIN AI SUPPORT SETTINGS UPDATE
 * ============================================================
 *
 * Endpoint:
 *
 * PATCH /api/admin/ai-support/settings/update
 *
 * Purpose:
 * - Allow ADMIN users to enable / disable AI support.
 *
 * Request:
 *
 * {
 *   "enabled": true
 * }
 *
 * or:
 *
 * {
 *   "enabled": false
 * }
 *
 * The database stores enabled as BOOLEAN.
 *
 * IMPORTANT:
 * - Does not change other AI support functionality.
 * - Does not change OpenRouter behavior.
 * - Does not change player authentication.
 * - Does not change the AI support endpoint.
 * - Only fixes the admin AI settings update request handling.
 * ============================================================
 */

import type { Handler, HandlerEvent } from "@netlify/functions";

import {
  AuthError,
  jsonResponse,
  parseBody,
  verifyAdminAuth,
} from "./ai/auth";

import {
  setAISupportEnabled,
} from "./ai/settings";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

interface UpdateAISettingsBody {
  enabled?: unknown;
}

/*
 * ============================================================
 * BOOLEAN PARSER
 * ============================================================
 *
 * Accept:
 *
 * true
 * false
 *
 * Also safely accept:
 *
 * "true"
 * "false"
 *
 * This is useful because some clients / proxies / forms can
 * serialize boolean values as strings.
 *
 * IMPORTANT:
 * We NEVER use Boolean(value) here because:
 *
 * Boolean("false") === true
 *
 * which would be dangerous for an ON/OFF setting.
 * ============================================================
 */

function parseEnabled(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

/*
 * ============================================================
 * METHOD CHECK
 * ============================================================
 */

function methodNotAllowed() {
  return jsonResponse(
    {
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only PATCH requests are allowed.",
    },
    405,
    {
      Allow: "PATCH",
    },
  );
}

/*
 * ============================================================
 * MAIN HANDLER
 * ============================================================
 */

export const handler: Handler = async (
  event: HandlerEvent,
) => {
  console.log(
    "ADMIN AI SETTINGS UPDATE:",
    event.httpMethod,
  );

  /*
   * ----------------------------------------------------------
   * METHOD
   * ----------------------------------------------------------
   */

  if (event.httpMethod !== "PATCH") {
    return methodNotAllowed();
  }

  try {
    /*
     * --------------------------------------------------------
     * ADMIN AUTHENTICATION
     * --------------------------------------------------------
     *
     * verifyAdminAuth() already validates:
     *
     * - lottery_auth cookie
     * - JWT
     * - ADMIN role
     *
     * It throws AuthError when authentication fails.
     * --------------------------------------------------------
     */

    const admin = await verifyAdminAuth(event);

    /*
     * --------------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------------
     */

    const body = (await parseBody(
      event,
    )) as UpdateAISettingsBody;

    console.log(
      "ADMIN AI SETTINGS REQUEST BODY:",
      JSON.stringify(body),
    );

    /*
     * --------------------------------------------------------
     * VALIDATE BODY
     * --------------------------------------------------------
     */

    if (
      !body ||
      typeof body !== "object" ||
      !Object.prototype.hasOwnProperty.call(
        body,
        "enabled",
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error: "INVALID_REQUEST",
          message:
            "'enabled' is required.",
        },
        400,
      );
    }

    /*
     * --------------------------------------------------------
     * PARSE ENABLED
     * --------------------------------------------------------
     */

    const enabled = parseEnabled(
      body.enabled,
    );

    if (enabled === null) {
      console.error(
        "Invalid AI support enabled value:",
        body.enabled,
        "type:",
        typeof body.enabled,
      );

      return jsonResponse(
        {
          success: false,
          error: "INVALID_ENABLED",
          message:
            "'enabled' must be a boolean.",
        },
        400,
      );
    }

    /*
     * --------------------------------------------------------
     * UPDATE DATABASE
     * --------------------------------------------------------
     */

    const settings =
      await setAISupportEnabled(
        enabled,
        admin.userId,
      );

    /*
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    console.log(
      "ADMIN AI SUPPORT UPDATED:",
      {
        enabled,
        updatedBy: admin.userId,
      },
    );

    return jsonResponse(
      {
        success: true,

        settings: {
          id: settings.id,
          enabled: settings.enabled,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy,
        },
      },
      200,
    );
  } catch (error) {
    /*
     * --------------------------------------------------------
     * AUTH ERROR
     * --------------------------------------------------------
     */

    if (error instanceof AuthError) {
      return jsonResponse(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.statusCode,
      );
    }

    /*
     * --------------------------------------------------------
     * UNEXPECTED ERROR
     * --------------------------------------------------------
     */

    console.error(
      "ADMIN AI SUPPORT SETTINGS UPDATE ERROR:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          "Failed to update AI support settings.",
      },
      500,
    );
  }
};