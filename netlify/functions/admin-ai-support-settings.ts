import type { Handler } from "@netlify/functions";

import {
  verifyAdminAuth,
  AuthError,
  jsonResponse,
} from "./ai/auth";

import { getAISupportSettings } from "./ai/settings";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed.",
      },
      405,
      { Allow: "GET" },
    );
  }

  try {
    const admin = await verifyAdminAuth(event);
    const settings = await getAISupportSettings();

    return jsonResponse(
      {
        success: true,
        settings: {
          enabled: settings.enabled,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy,
        },
        admin: {
          id: admin.userId,
          username: admin.username ?? null,
        },
      },
      200,
    );
  } catch (error) {
    console.error("ADMIN AI SUPPORT SETTINGS ERROR:", error);

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
        message: "Failed to load AI support settings.",
      },
      500,
    );
  }
};
