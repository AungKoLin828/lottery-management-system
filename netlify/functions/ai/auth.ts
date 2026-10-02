import type { HandlerEvent } from "@netlify/functions";
import { jwtVerify, type JWTPayload } from "jose";

/* ============================================================
   TYPES
============================================================ */

export type AuthRole =
  | "ADMIN"
  | "PLAYER"
  | string;

export interface AuthPayload extends JWTPayload {
  userId?: string;
  sub?: string;
  username?: string;
  phone?: string;
  role?: AuthRole;
}

export interface AuthenticatedUser {
  userId: string;
  username?: string;
  phone?: string;
  role: AuthRole;
}

export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode = 401,
  ) {
    super(message);

    this.name = "AuthError";

    this.statusCode = statusCode;
  }
}

/* ============================================================
   CONSTANTS
============================================================ */

const AUTH_COOKIE_NAME = "lottery_auth";

/* ============================================================
   JWT SECRET
============================================================ */

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new AuthError(
      "JWT authentication is not configured.",
      500,
    );
  }

  return new TextEncoder().encode(secret);
}

/* ============================================================
   COOKIE PARSER
============================================================ */

function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const cookies: Record<
    string,
    string
  > = {};

  for (
    const part of cookieHeader.split(";")
  ) {
    const separatorIndex =
      part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name =
      part
        .slice(0, separatorIndex)
        .trim();

    const value =
      part
        .slice(separatorIndex + 1)
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
   AUTH COOKIE
============================================================ */

export function getAuthTokenFromCookie(
  event: HandlerEvent,
): string | null {
  /*
   * Netlify normally provides the Cookie
   * header here.
   */

  const cookieHeader =
    event.headers?.cookie ??
    event.headers?.Cookie;

  const cookies =
    parseCookies(cookieHeader);

  const token =
    cookies[AUTH_COOKIE_NAME];

  if (
    !token ||
    typeof token !== "string"
  ) {
    return null;
  }

  return token.trim() || null;
}

/* ============================================================
   VERIFY TOKEN
============================================================ */

export async function verifyToken(
  token: string,
): Promise<AuthPayload> {
  if (!token?.trim()) {
    throw new AuthError(
      "Authentication token is missing.",
      401,
    );
  }

  try {
    const result =
      await jwtVerify<AuthPayload>(
        token,
        getJwtSecret(),
        {
          algorithms: ["HS256"],
        },
      );

    return result.payload;
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error,
    );

    throw new AuthError(
      "Your session has expired. Please log in again.",
      401,
    );
  }
}

/* ============================================================
   GET CURRENT USER
============================================================ */

export async function getAuthenticatedUser(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  const token =
    getAuthTokenFromCookie(event);

  if (!token) {
    throw new AuthError(
      "Authentication required.",
      401,
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
    throw new AuthError(
      "Invalid authentication token.",
      401,
    );
  }

  return {
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
        : "",
  };
}

/* ============================================================
   VERIFY ADMIN
============================================================ */

export async function verifyAdminAuth(
  event: HandlerEvent,
): Promise<AuthenticatedUser> {
  const user =
    await getAuthenticatedUser(
      event,
    );

  if (
    user.role.toUpperCase() !==
    "ADMIN"
  ) {
    throw new AuthError(
      "Admin access required.",
      403,
    );
  }

  return user;
}

/* ============================================================
   JSON RESPONSE
============================================================ */

export function jsonResponse(
  statusCode: number,
  body: unknown,
  extraHeaders?: Record<
    string,
    string
  >,
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",

      ...extraHeaders,
    },

    body: JSON.stringify(body),
  };
}

/* ============================================================
   REQUEST BODY
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
    throw new AuthError(
      "Invalid JSON request body.",
      400,
    );
  }
}

/* ============================================================
   AUTH ERROR RESPONSE HELPER
============================================================ */

export function authErrorResponse(
  error: unknown,
) {
  if (
    error instanceof AuthError
  ) {
    return jsonResponse(
      error.statusCode,
      {
        success: false,
        message: error.message,
      },
    );
  }

  return jsonResponse(
    500,
    {
      success: false,
      message:
        "Authentication failed.",
    },
  );
}