import type {
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import {
  AuthError,
  requireAdmin,
  requireAuth,
  jsonResponse,
  type AuthenticatedUser,
} from "../ai/auth";

/*
 * ============================================================
 * JSON RESPONSE
 * ============================================================
 */

export function response(
  statusCode: number,
  body: unknown,
): HandlerResponse {
  return jsonResponse(body, statusCode);
}

/*
 * ============================================================
 * BODY
 * ============================================================
 */

export function parseJsonBody<T = Record<string, unknown>>(
  event: HandlerEvent,
): T {
  if (!event.body) {
    return {} as T;
  }

  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    return JSON.parse(raw) as T;
  } catch {
    throw new AuthError(
      "Invalid JSON request body",
      400,
    );
  }
}

/*
 * ============================================================
 * AUTH USER ID
 *
 * UUID-safe.
 * ============================================================
 */

export function getAuthenticatedUserId(
  user: AuthenticatedUser,
): string {
  const raw =
    user as unknown as Record<
      string,
      unknown
    >;

  const candidate =
    raw.userId ??
    raw.id ??
    raw.sub;

  if (
    typeof candidate !== "string" &&
    typeof candidate !== "number"
  ) {
    throw new AuthError(
      "Authenticated user ID is missing",
      401,
    );
  }

  const id = String(candidate).trim();

  if (!id) {
    throw new AuthError(
      "Authenticated user ID is invalid",
      401,
    );
  }

  return id;
}

/*
 * ============================================================
 * AUTHENTICATE PLAYER
 * ============================================================
 */

export async function authenticate(
  event: HandlerEvent,
): Promise<{
  user: AuthenticatedUser;
  userId: string;
}> {
  const user = await requireAuth(event);

  return {
    user,
    userId: getAuthenticatedUserId(user),
  };
}

/*
 * ============================================================
 * AUTHENTICATE ADMIN
 * ============================================================
 */

export async function authenticateAdmin(
  event: HandlerEvent,
): Promise<{
  user: AuthenticatedUser;
  userId: string;
}> {
  const user = await requireAdmin(event);

  return {
    user,
    userId: getAuthenticatedUserId(user),
  };
}

/*
 * ============================================================
 * METHOD
 * ============================================================
 */

export function requireMethod(
  event: HandlerEvent,
  method: string,
): void {
  if (
    String(event.httpMethod ?? "")
      .toUpperCase() !==
    method.toUpperCase()
  ) {
    throw new AuthError(
      `Method ${event.httpMethod} not allowed`,
      405,
    );
  }
}

/*
 * ============================================================
 * ERROR
 * ============================================================
 */

export function handleError(
  error: unknown,
  label: string,
): HandlerResponse {
  console.error(label, error);

  if (error instanceof AuthError) {
    return response(
      error.statusCode,
      {
        success: false,
        error: error.message,
      },
    );
  }

  return response(
    500,
    {
      success: false,
      error: "Internal server error",
    },
  );
}