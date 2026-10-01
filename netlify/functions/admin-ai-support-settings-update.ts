import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  eq,
} from "drizzle-orm";

import {
  systemSettings,
} from "../../db/schema/systemSettings";

import {
  db,
} from "../../db";

import {
  verifyAdminAuth,
} from "./ai/auth";

const AI_SUPPORT_SETTING_KEY =
  "ai_support_enabled";

/* ============================================================
   REQUEST TYPE
============================================================ */

interface UpdateRequest {
  enabled?: unknown;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext,
) => {
  try {
    if (
      event.httpMethod !==
      "PATCH"
    ) {
      return {
        statusCode: 405,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          success: false,
          message:
            "Method not allowed.",
        }),
      };
    }

    /* ========================================================
       ADMIN AUTH
    ======================================================== */

    const auth =
      await verifyAdminAuth(
        event,
      );

    if (!auth) {
      return {
        statusCode: 401,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          success: false,
          message:
            "Unauthorized.",
        }),
      };
    }

    /* ========================================================
       REQUEST BODY
    ======================================================== */

    let body: UpdateRequest;

    try {
      body = JSON.parse(
        event.body ?? "{}",
      );
    } catch {
      return {
        statusCode: 400,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          success: false,
          message:
            "Invalid JSON request body.",
        }),
      };
    }

    /* ========================================================
       VALIDATE ENABLED
    ======================================================== */

    if (
      typeof body.enabled !==
      "boolean"
    ) {
      return {
        statusCode: 400,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          success: false,
          message:
            "enabled must be a boolean.",
        }),
      };
    }

    /* ========================================================
       UPDATE
    ======================================================== */

    const result =
      await db
        .update(systemSettings)
        .set({
          booleanValue:
            body.enabled,

          updatedBy:
            auth.id,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            systemSettings.key,
            AI_SUPPORT_SETTING_KEY,
          ),
        )
        .returning({
          id:
            systemSettings.id,

          key:
            systemSettings.key,

          booleanValue:
            systemSettings.booleanValue,

          updatedAt:
            systemSettings.updatedAt,
        });

    if (
      result.length ===
      0
    ) {
      return {
        statusCode: 404,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          success: false,
          message:
            "AI support setting was not found.",
        }),
      };
    }

    const environmentEnabled =
      process.env
        .AI_SUPPORT_ENABLED
        ?.trim()
        .toLowerCase() ===
      "true";

    const databaseEnabled =
      result[0].booleanValue ===
      true;

    const effectiveEnabled =
      environmentEnabled &&
      databaseEnabled;

    return {
      statusCode: 200,

      headers: {
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store",
      },

      body: JSON.stringify({
        success: true,

        message:
          databaseEnabled
            ? "AI support has been enabled."
            : "AI support has been disabled.",

        setting: {
          key:
            result[0].key,

          databaseEnabled,

          environmentEnabled,

          enabled:
            effectiveEnabled,

          updatedAt:
            result[0].updatedAt,
        },
      }),
    };
  } catch (error) {
    console.error(
      "Admin AI support settings update error:",
      error,
    );

    return {
      statusCode: 500,

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        success: false,
        message:
          "Unable to update AI support settings.",
      }),
    };
  }
};