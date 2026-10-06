/*
 * ============================================================
 * SUPPORT API HELPERS
 * ============================================================
 */

import type {
  HandlerEvent,
} from "@netlify/functions";

import {
  requireAuth,
  type AuthenticatedUser,
} from "../ai/auth";

/* ============================================================
   JSON RESPONSE
============================================================ */

export function json(
  statusCode: number,
  body: unknown,
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json",
      "Cache-Control":
        "no-store",
    },

    body: JSON.stringify(
      body,
    ),
  };
}

/* ============================================================
   BODY
============================================================ */

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

/* ============================================================
   USER ID
============================================================ */

export function getNumericUserId(
  user: AuthenticatedUser,
): number {
  const id = Number(
    user.id,
  );

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Authenticated user ID is invalid.",
    );
  }

  return id;
}

/* ============================================================
   AUTH
============================================================ */

export async function authenticate(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  return requireAuth(event);
}

/* ============================================================
   ADMIN AUTH
============================================================ */

export async function authenticateAdmin(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  const user =
    await authenticate(event);

  if (
    String(user.role)
      .toUpperCase() !==
    "ADMIN"
  ) {
    throw Object.assign(
      new Error(
        "Admin access required.",
      ),
      {
        statusCode: 403,
      },
    );
  }

  return user;
}

/* ============================================================
   METHOD
============================================================ */

export function requireMethod(
  event: HandlerEvent,
  method: string,
) {
  if (
    event.httpMethod !== method
  ) {
    return json(
      405,
      {
        success: false,
        message:
          "Method not allowed.",
      },
    );
  }

  return null;
}