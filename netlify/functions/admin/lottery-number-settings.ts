import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { eq } from "drizzle-orm";

import { lotteryNumberSettings } from "../../../db/schema/lotteryNumberSettings";

import { users } from "../../../db/schema/users";

import { db } from "../utils/db";

import {
  getCookie,
  jsonResponse,
  parseBody,
  toAuthUser,
  verifyToken,
} from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type LotteryType = "2D" | "3D";

interface LotteryNumberSettingsPayload {
  lotteryType?: unknown;

  enabled?: unknown;

  numberLength?: unknown;

  minBet?: unknown;

  maxBet?: unknown;

  maxNumberLimit?: unknown;

  allowDuplicateNumbers?: unknown;
}

/* ============================================================
   CONSTANTS
============================================================ */

const AUTH_COOKIE_NAME = "lottery_auth";

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function successResponse(data: unknown, statusCode = 200): HandlerResponse {
  return jsonResponse(statusCode, {
    success: true,
    data,
  });
}

function errorResponse(message: string, statusCode = 400): HandlerResponse {
  return jsonResponse(statusCode, {
    success: false,
    message,
  });
}

/* ============================================================
   AUTHENTICATION
============================================================ */

/**
 * Authenticate the current request and make sure the user
 * is an ADMIN.
 *
 * Authentication flow:
 *
 * 1. Read lottery_auth cookie
 * 2. Verify JWT
 * 3. Get userId from JWT
 * 4. Load user from PostgreSQL
 * 5. Convert DbUser -> AuthUser
 * 6. Verify ADMIN role
 * 7. Verify ACTIVE status
 */
async function getAuthenticatedAdmin(event: HandlerEvent) {
  try {
    /* --------------------------------------------------------
       GET AUTH COOKIE
    -------------------------------------------------------- */

    const token = getCookie(event, AUTH_COOKIE_NAME);

    if (!token) {
      return null;
    }

    /* --------------------------------------------------------
       VERIFY JWT
    -------------------------------------------------------- */

    let payload;

    try {
      payload = await verifyToken(token);
    } catch (error) {
      console.error("JWT verification failed:", error);

      return null;
    }

    /* --------------------------------------------------------
       VALIDATE USER ID
    -------------------------------------------------------- */

    if (!payload.userId) {
      return null;
    }

    /* --------------------------------------------------------
       LOAD USER FROM DATABASE
    -------------------------------------------------------- */

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const dbUser = result[0];

    /* --------------------------------------------------------
       CONVERT DATABASE USER TO AUTH USER
    -------------------------------------------------------- */

    const authUser = toAuthUser(dbUser);

    /* --------------------------------------------------------
       CHECK ADMIN ROLE
    -------------------------------------------------------- */

    if (authUser.role !== "ADMIN") {
      return null;
    }

    /* --------------------------------------------------------
       CHECK ACCOUNT STATUS
    -------------------------------------------------------- */

    if (authUser.status !== "ACTIVE") {
      return null;
    }

    return authUser;
  } catch (error) {
    console.error("Admin authentication error:", error);

    return null;
  }
}

/* ============================================================
   LOTTERY TYPE VALIDATION
============================================================ */

function isLotteryType(value: unknown): value is LotteryType {
  return value === "2D" || value === "3D";
}

/* ============================================================
   POSITIVE INTEGER VALIDATION
============================================================ */

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

/* ============================================================
   BOOLEAN VALIDATION
============================================================ */

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be true or false.`);
  }

  return value;
}

/* ============================================================
   GET SETTINGS
============================================================ */

async function getSettings(): Promise<HandlerResponse> {
  const settings = await db.select().from(lotteryNumberSettings);

  /* ----------------------------------------------------------
     NORMALIZE DATABASE DATA
  ---------------------------------------------------------- */

  const normalized = settings.map((item) => ({
    id: item.id,

    lotteryType: item.lotteryType,

    enabled: item.enabled,

    numberLength: item.numberLength,

    minBet: item.minBet,

    maxBet: item.maxBet,

    maxNumberLimit: item.maxNumberLimit,

    allowDuplicateNumbers: item.allowDuplicateNumbers,

    createdAt: item.createdAt,

    updatedAt: item.updatedAt,
  }));

  /* ----------------------------------------------------------
     FIND 2D
  ---------------------------------------------------------- */

  const twoD = normalized.find((item) => item.lotteryType === "2D") ?? null;

  /* ----------------------------------------------------------
     FIND 3D
  ---------------------------------------------------------- */

  const threeD = normalized.find((item) => item.lotteryType === "3D") ?? null;

  /* ----------------------------------------------------------
     RESPONSE
  ---------------------------------------------------------- */

  return successResponse({
    settings: normalized,

    twoD,

    threeD,
  });
}

/* ============================================================
   SAVE SETTINGS
============================================================ */

async function saveSettings(
  body: LotteryNumberSettingsPayload,
): Promise<HandlerResponse> {
  /* ----------------------------------------------------------
     LOTTERY TYPE
  ---------------------------------------------------------- */

  if (!isLotteryType(body.lotteryType)) {
    return errorResponse("lotteryType must be either 2D or 3D.");
  }

  /* ----------------------------------------------------------
     ENABLED
  ---------------------------------------------------------- */

  if (typeof body.enabled !== "boolean") {
    return errorResponse("enabled must be true or false.");
  }

  /* ----------------------------------------------------------
     NUMBER LENGTH
  ---------------------------------------------------------- */

  const numberLength = parsePositiveInteger(body.numberLength, "numberLength");

  /* ----------------------------------------------------------
     MINIMUM BET
  ---------------------------------------------------------- */

  const minBet = parsePositiveInteger(body.minBet, "minBet");

  /* ----------------------------------------------------------
     MAXIMUM BET
  ---------------------------------------------------------- */

  const maxBet = parsePositiveInteger(body.maxBet, "maxBet");

  /* ----------------------------------------------------------
     MAXIMUM NUMBER LIMIT
  ---------------------------------------------------------- */

  const maxNumberLimit = parsePositiveInteger(
    body.maxNumberLimit,
    "maxNumberLimit",
  );

  /* ----------------------------------------------------------
     DUPLICATE NUMBERS
  ---------------------------------------------------------- */

  const allowDuplicateNumbers = parseBoolean(
    body.allowDuplicateNumbers,
    "allowDuplicateNumbers",
  );

  /* ----------------------------------------------------------
     VALIDATE 2D LENGTH
  ---------------------------------------------------------- */

  if (body.lotteryType === "2D" && numberLength !== 2) {
    return errorResponse("2D lottery number length must be 2.");
  }

  /* ----------------------------------------------------------
     VALIDATE 3D LENGTH
  ---------------------------------------------------------- */

  if (body.lotteryType === "3D" && numberLength !== 3) {
    return errorResponse("3D lottery number length must be 3.");
  }

  /* ----------------------------------------------------------
     VALIDATE BET RANGE
  ---------------------------------------------------------- */

  if (minBet > maxBet) {
    return errorResponse("Minimum bet cannot exceed maximum bet.");
  }

  /* ----------------------------------------------------------
     VALIDATE NUMBER LIMIT
  ---------------------------------------------------------- */

  const maximumPossibleNumbers = Math.pow(10, numberLength);

  if (maxNumberLimit > maximumPossibleNumbers) {
    return errorResponse(
      `Maximum number limit cannot exceed ${maximumPossibleNumbers}.`,
    );
  }

  /* ----------------------------------------------------------
     CURRENT TIMESTAMP
  ---------------------------------------------------------- */

  const now = new Date();

  /* ----------------------------------------------------------
     FIND EXISTING SETTING
  ---------------------------------------------------------- */

  const existing = await db
    .select()
    .from(lotteryNumberSettings)
    .where(eq(lotteryNumberSettings.lotteryType, body.lotteryType))
    .limit(1);

  /* ==========================================================
     UPDATE EXISTING RECORD
  ========================================================== */

  if (existing.length > 0) {
    const updated = await db
      .update(lotteryNumberSettings)
      .set({
        enabled: body.enabled,

        numberLength,

        minBet,

        maxBet,

        maxNumberLimit,

        allowDuplicateNumbers,

        updatedAt: now,
      })
      .where(eq(lotteryNumberSettings.lotteryType, body.lotteryType))
      .returning();

    if (updated.length === 0) {
      return errorResponse("Failed to update lottery number settings.", 500);
    }

    return successResponse({
      setting: updated[0],
    });
  }

  /* ==========================================================
     INSERT NEW RECORD
  ========================================================== */

  const inserted = await db
    .insert(lotteryNumberSettings)
    .values({
      lotteryType: body.lotteryType,

      enabled: body.enabled,

      numberLength,

      minBet,

      maxBet,

      maxNumberLimit,

      allowDuplicateNumbers,

      createdAt: now,

      updatedAt: now,
    })
    .returning();

  if (inserted.length === 0) {
    return errorResponse("Failed to create lottery number settings.", 500);
  }

  return successResponse({
    setting: inserted[0],
  });
}

/* ============================================================
   MAIN HANDLER
============================================================ */

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  try {
    /* ========================================================
         AUTHENTICATION
      ======================================================== */

    const admin = await getAuthenticatedAdmin(event);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access is required.", 401);
    }

    /* ========================================================
         GET
      ======================================================== */

    if (event.httpMethod === "GET") {
      return await getSettings();
    }

    /* ========================================================
         PUT
      ======================================================== */

    if (event.httpMethod === "PUT") {
      const body = parseBody<LotteryNumberSettingsPayload>(event);

      return await saveSettings(body);
    }

    /* ========================================================
         METHOD NOT ALLOWED
      ======================================================== */

    return errorResponse("Method not allowed.", 405);
  } catch (error) {
    console.error("Lottery number settings API error:", error);

    return errorResponse(
      error instanceof Error ? error.message : "Internal server error.",
      500,
    );
  }
};
