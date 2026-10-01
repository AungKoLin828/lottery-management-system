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
   GET SETTING
============================================================ */

async function getSetting() {
  const result =
    await db
      .select({
        id:
          systemSettings.id,

        key:
          systemSettings.key,

        booleanValue:
          systemSettings.booleanValue,

        description:
          systemSettings.description,

        updatedAt:
          systemSettings.updatedAt,
      })
      .from(systemSettings)
      .where(
        eq(
          systemSettings.key,
          AI_SUPPORT_SETTING_KEY,
        ),
      )
      .limit(1);

  return result[0] ?? null;
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
      "GET"
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
       SETTING
    ======================================================== */

    const setting =
      await getSetting();

    if (!setting) {
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
      setting.booleanValue === true;

    const effectiveEnabled =
      environmentEnabled &&
      databaseEnabled;

    return {
      statusCode: 200,

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        success: true,

        setting: {
          key: setting.key,

          databaseEnabled,

          environmentEnabled,

          enabled:
            effectiveEnabled,

          description:
            setting.description,

          updatedAt:
            setting.updatedAt,
        },
      }),
    };
  } catch (error) {
    console.error(
      "Admin AI support settings GET error:",
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
          "Unable to load AI support settings.",
      }),
    };
  }
};