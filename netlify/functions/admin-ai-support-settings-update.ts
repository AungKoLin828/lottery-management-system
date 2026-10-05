import type { Handler } from "@netlify/functions";

import {
  verifyAdminAuth,
  AuthError,
  jsonResponse,
  parseBody,
} from "./ai/auth";

import { setAISupportEnabled } from "./ai/settings";

interface UpdateAISupportSettingsBody {
  enabled?: unknown;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "PATCH") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed.",
      },
      405,
      { Allow: "PATCH" },
    );
  }

  try {
    const admin = await verifyAdminAuth(event);

    let body: UpdateAISupportSettingsBody;

    try {
      body = parseBody<UpdateAISupportSettingsBody>(event);
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        400,
      );
    }

    const enabled = parseBoolean(body.enabled);

    if (enabled === null) {
      return jsonResponse(
        {
          success: false,
          message: "'enabled' must be a boolean.",
        },
        400,
      );
    }

    const settings = await setAISupportEnabled(
      enabled,
      admin.userId,
    );

    return jsonResponse(
      {
        success: true,
        message: enabled
          ? "AI support enabled successfully."
          : "AI support disabled successfully.",
        settings: {
          enabled: settings.enabled,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy,
        },
      },
      200,
    );
  } catch (error) {
    console.error(
      "ADMIN AI SUPPORT SETTINGS UPDATE ERROR:",
      error,
    );

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

    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update AI support settings.",
      },
      500,
    );
  }
};
