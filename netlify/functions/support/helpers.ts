/*
 * ============================================================
 * SUPPORT API HELPERS
 * ============================================================
 */

import type {
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import {
  requireAuth,
  verifyAdminAuth,
  type AuthenticatedUser,
} from "../ai/auth";

/*
 * ============================================================
 * JSON RESPONSE
 * ============================================================
 */

export function json(
  statusCode: number,
  body: unknown,
): HandlerResponse {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",
    },

    body: JSON.stringify(body),
  };
}

/*
 * ============================================================
 * PARSE JSON BODY
 * ============================================================
 */

export function parseJsonBody<T>(
  event: HandlerEvent,
): T {
  if (!event.body) {
    return {} as T;
  }

  try {
    return JSON.parse(
      event.body,
    ) as T;
  } catch {
    throw new Error(
      "Invalid JSON request body.",
    );
  }
}

/*
 * ============================================================
 * AUTHENTICATE PLAYER
 * ============================================================
 */

export async function authenticate(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  return requireAuth(event);
}

/*
 * ============================================================
 * AUTHENTICATE ADMIN
 * ============================================================
 */

export async function authenticateAdmin(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  return verifyAdminAuth(event);
}

/*
 * ============================================================
 * USER ID
 * ============================================================
 *
 * The application uses UUID user IDs.
 *
 * Never convert this value to Number.
 * ============================================================
 */

export function getUserId(
  user: AuthenticatedUser,
): string {
  const userId =
    user.userId ??
    user.id;

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    throw new Error(
      "Authenticated user ID is missing.",
    );
  }

  return userId.trim();
}

/*
 * ============================================================
 * REQUIRE METHOD
 * ============================================================
 */

export function requireMethod(
  event: HandlerEvent,
  method: string,
): HandlerResponse | null {
  if (
    event.httpMethod.toUpperCase() !==
    method.toUpperCase()
  ) {
    return json(
      405,
      {
        success: false,
        error: "Method not allowed.",
      },
    );
  }

  return null;
}

/*
 * ============================================================
 * INTEGER PARAMETER
 * ============================================================
 */

export function parsePositiveInteger(
  value: string | null | undefined,
): number | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  if (
    !Number.isInteger(
      numberValue,
    ) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
}