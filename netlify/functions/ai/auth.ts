import type { HandlerEvent } from "@netlify/functions";
import { jwtVerify, type JWTPayload } from "jose";

/* ============================================================
   TYPES
============================================================ */

export interface AIAuthPayload extends JWTPayload {
  userId?: string;
  username?: string;
  phone?: string;
  role?: string;
}

export interface AuthenticatedUser {
  id: string;
  userId: string;
  username?: string;
  phone?: string;
  role?: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const AUTH_COOKIE_NAME = "lottery_auth";

/* ============================================================
   JWT SECRET
============================================================ */

function getJWTSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured.",
    );
  }

  return new TextEncoder().encode(
    secret,
  );
}

/* ============================================================
   COOKIE PARSER
============================================================ */

function parseCookies(
  cookieHeader?: string,
): Record<string, string> {
  const cookies: Record<
    string,
    string
  > = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (
    const part of cookieHeader.split(";")
  ) {
    const separator =
      part.indexOf("=");

    if (separator < 0) {
      continue;
    }

    const name =
      part
        .slice(0, separator)
        .trim();

    const value =
      part
        .slice(separator + 1)
        .trim();

    if (!name) {
      continue;
    }

    try {
      cookies[name] =
        decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

/* ============================================================
   GET AUTH TOKEN
============================================================ */

export function getAuthTokenFromCookie(
  event: HandlerEvent,
): string | null {
  const cookieHeader =
    event.headers?.cookie ??
    event.headers?.Cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    parseCookies(cookieHeader);

  const token =
    cookies[AUTH_COOKIE_NAME];

  if (
    typeof token !== "string" ||
    !token.trim()
  ) {
    return null;
  }

  return token.trim();
}

/* ============================================================
   VERIFY TOKEN
============================================================ */

export async function verifyToken(
  token: string,
): Promise<AIAuthPayload> {
  if (!token?.trim()) {
    throw new Error(
      "Authentication token is missing.",
    );
  }

  try {
    const result =
      await jwtVerify<AIAuthPayload>(
        token,
        getJWTSecret(),
        {
          algorithms: ["HS256"],
        },
      );

    return result.payload;
  } catch (error) {
    console.error(
      "AI JWT verification failed:",
      error,
    );

    throw new Error(
      "Invalid or expired authentication token.",
    );
  }
}

/* ============================================================
   REQUIRE AUTH
   ------------------------------------------------------------
   IMPORTANT:
   Existing ai/support.ts already imports this function.
   Keep this API for compatibility.
============================================================ */

export async function requireAuth(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  const token =
    getAuthTokenFromCookie(event);

  if (!token) {
    throw new Error(
      "Authentication required.",
    );
  }

  const payload =
    await verifyToken(token);

  const userId =
    typeof payload.userId ===
    "string"
      ? payload.userId
      : typeof payload.sub ===
          "string"
        ? payload.sub
        : "";

  if (!userId) {
    throw new Error(
      "Invalid authentication token.",
    );
  }

  return {
    id: userId,
    userId,

    username:
      typeof payload.username ===
      "string"
        ? payload.username
        : undefined,

    phone:
      typeof payload.phone ===
      "string"
        ? payload.phone
        : undefined,

    role:
      typeof payload.role ===
      "string"
        ? payload.role
        : undefined,
  };
}

/* ============================================================
   VERIFY ADMIN AUTH
   ------------------------------------------------------------
   Used by admin AI settings endpoints.
============================================================ */

export async function verifyAdminAuth(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  const user =
    await requireAuth(event);

  if (
    user.role?.toUpperCase() !==
    "ADMIN"
  ) {
    throw new Error(
      "Admin access required.",
    );
  }

  return user;
}

/* ============================================================
   REQUIRE ADMIN
   ------------------------------------------------------------
   Alias for future compatibility.
============================================================ */

export async function requireAdmin(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  return verifyAdminAuth(event);
}

/* ============================================================
   JSON RESPONSE
============================================================ */

export function jsonResponse(
  statusCode: number,
  body: unknown,
  headers?: Record<string, string>,
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",

      ...headers,
    },

    body: JSON.stringify(body),
  };
}

/* ============================================================
   PARSE BODY
============================================================ */

export function parseBody<T>(
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