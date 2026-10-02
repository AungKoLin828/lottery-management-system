import {
  jwtVerify,
  type JWTPayload,
} from "jose";

/*
 * ============================================================
 * AUTH TYPES
 * ============================================================
 */

export interface AuthenticatedUser {
  /**
   * Normalized user ID.
   *
   * The existing application may store this in either:
   *
   *   payload.userId
   *
   * or:
   *
   *   payload.sub
   *
   * We normalize both to id/userId.
   */
  id: string;

  userId: string;

  username?: string;

  phone?: string;

  role?: string;
}

/*
 * ============================================================
 * AUTH ERROR
 * ============================================================
 *
 * Existing AI/admin functions import AuthError from this file.
 *
 * Example:
 *
 *   import {
 *     AuthError,
 *     verifyAdminAuth,
 *   } from "./ai/auth";
 *
 * AuthError therefore MUST remain a named export.
 * ============================================================
 */

export class AuthError extends Error {
  public readonly statusCode: number;

  public readonly code: string;

  constructor(
    message = "Authentication required.",
    statusCode = 401,
    code = "UNAUTHORIZED",
  ) {
    super(message);

    this.name = "AuthError";

    this.statusCode =
      statusCode;

    this.code =
      code;

    /*
     * Required when extending Error in some
     * JavaScript/TypeScript runtimes.
     */
    Object.setPrototypeOf(
      this,
      AuthError.prototype,
    );
  }
}

/*
 * ============================================================
 * JWT SECRET
 * ============================================================
 */

function getJWTSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new AuthError(
      "JWT_SECRET is not configured.",
      500,
      "SERVER_CONFIGURATION_ERROR",
    );
  }

  return new TextEncoder().encode(
    secret,
  );
}

/*
 * ============================================================
 * COOKIE PARSER
 * ============================================================
 */

function parseCookies(
  cookieHeader?: string | null,
): Record<string, string> {
  if (
    !cookieHeader ||
    !cookieHeader.trim()
  ) {
    return {};
  }

  const cookies: Record<
    string,
    string
  > = {};

  for (const part of cookieHeader.split(
    ";",
  )) {
    const separatorIndex =
      part.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const rawName =
      part
        .slice(0, separatorIndex)
        .trim();

    const rawValue =
      part
        .slice(separatorIndex + 1)
        .trim();

    if (!rawName) {
      continue;
    }

    try {
      cookies[rawName] =
        decodeURIComponent(
          rawValue,
        );
    } catch {
      /*
       * If a cookie contains malformed
       * URI encoding, keep the raw value.
       */
      cookies[rawName] =
        rawValue;
    }
  }

  return cookies;
}

/*
 * ============================================================
 * AUTH COOKIE NAME
 * ============================================================
 *
 * The existing application uses:
 *
 *   lottery_auth
 *
 * for the JWT authentication cookie.
 * ============================================================
 */

export const AUTH_COOKIE_NAME =
  "lottery_auth";

/*
 * ============================================================
 * GET AUTH TOKEN FROM COOKIE
 * ============================================================
 */

export function getAuthTokenFromCookie(
  event: {
    headers?: Record<
      string,
      string | undefined
    >;
  },
): string | null {
  const headers =
    event.headers ?? {};

  /*
   * Netlify normally exposes headers
   * in lowercase, but supporting the
   * capitalized version makes this helper
   * safer.
   */
  const cookieHeader =
    headers.cookie ??
    headers.Cookie ??
    null;

  const cookies =
    parseCookies(cookieHeader);

  const token =
    cookies[
      AUTH_COOKIE_NAME
    ];

  if (
    typeof token !== "string" ||
    !token.trim()
  ) {
    return null;
  }

  return token.trim();
}

/*
 * ============================================================
 * JWT CLAIM HELPERS
 * ============================================================
 */

function getStringClaim(
  payload: JWTPayload,
  key: string,
): string | undefined {
  const value =
    payload[key];

  return typeof value ===
    "string"
    ? value
    : undefined;
}

/*
 * ============================================================
 * NORMALIZE JWT USER
 * ============================================================
 */

function normalizeAuthenticatedUser(
  payload: JWTPayload,
): AuthenticatedUser {
  /*
   * Existing tokens may contain:
   *
   *   userId
   *
   * while standard JWT implementations
   * commonly use:
   *
   *   sub
   *
   * Support both.
   */

  const userId =
    getStringClaim(
      payload,
      "userId",
    ) ??
    getStringClaim(
      payload,
      "sub",
    );

  if (
    !userId ||
    !userId.trim()
  ) {
    throw new AuthError(
      "Authentication token does not contain a valid user ID.",
      401,
      "INVALID_AUTH_TOKEN",
    );
  }

  return {
    id: userId,
    userId,

    username:
      getStringClaim(
        payload,
        "username",
      ),

    phone:
      getStringClaim(
        payload,
        "phone",
      ),

    role:
      getStringClaim(
        payload,
        "role",
      ),
  };
}

/*
 * ============================================================
 * VERIFY TOKEN
 * ============================================================
 */

export async function verifyToken(
  token: string,
): Promise<AuthenticatedUser> {
  if (
    typeof token !== "string" ||
    !token.trim()
  ) {
    throw new AuthError(
      "Authentication token is missing.",
      401,
      "MISSING_AUTH_TOKEN",
    );
  }

  try {
    const secret =
      getJWTSecret();

    const result =
      await jwtVerify(
        token,
        secret,
      );

    return normalizeAuthenticatedUser(
      result.payload,
    );
  } catch (error) {
    /*
     * Do not expose internal JWT details
     * to the client.
     */

    if (
      error instanceof AuthError
    ) {
      throw error;
    }

    console.error(
      "JWT verification failed:",
      error,
    );

    throw new AuthError(
      "Your session is invalid or has expired. Please log in again.",
      401,
      "INVALID_AUTH_TOKEN",
    );
  }
}

/*
 * ============================================================
 * REQUIRE AUTHENTICATED USER
 * ============================================================
 *
 * Used by:
 *
 *   netlify/functions/ai/support.ts
 *
 * Example:
 *
 *   const user =
 *     await requireAuth(event);
 *
 * ============================================================
 */

export async function requireAuth(
  event: {
    headers?: Record<
      string,
      string | undefined
    >;
  },
): Promise<AuthenticatedUser> {
  const token =
    getAuthTokenFromCookie(
      event,
    );

  if (!token) {
    throw new AuthError(
      "Authentication required. Please log in.",
      401,
      "MISSING_AUTH_TOKEN",
    );
  }

  return verifyToken(token);
}

/*
 * ============================================================
 * VERIFY ADMIN AUTH
 * ============================================================
 *
 * Used by:
 *
 *   admin-ai-support-settings.ts
 *   admin-ai-support-settings-update.ts
 *
 * It first authenticates the JWT and then
 * checks the role.
 *
 * Accepted admin role:
 *
 *   ADMIN
 *
 * ============================================================
 */

export async function verifyAdminAuth(
  event: {
    headers?: Record<
      string,
      string | undefined
    >;
  },
): Promise<AuthenticatedUser> {
  const user =
    await requireAuth(event);

  const role =
    user.role
      ?.trim()
      .toUpperCase();

  if (role !== "ADMIN") {
    throw new AuthError(
      "Administrator access is required.",
      403,
      "FORBIDDEN",
    );
  }

  return user;
}

/*
 * ============================================================
 * REQUIRE ADMIN
 * ============================================================
 *
 * Alias/helper for code that uses
 * requireAdmin() instead of verifyAdminAuth().
 *
 * Keeping both avoids breaking existing
 * functions as the application grows.
 * ============================================================
 */

export async function requireAdmin(
  event: {
    headers?: Record<
      string,
      string | undefined
    >;
  },
): Promise<AuthenticatedUser> {
  return verifyAdminAuth(event);
}

/*
 * ============================================================
 * JSON RESPONSE
 * ============================================================
 *
 * Shared helper for AI/admin functions.
 *
 * Example:
 *
 *   return jsonResponse(
 *     { success: true },
 *     200,
 *   );
 * ============================================================
 */

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<
    string,
    string
  >,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store",

        ...extraHeaders,
      },
    },
  );
}

/*
 * ============================================================
 * AUTH ERROR RESPONSE
 * ============================================================
 *
 * Converts AuthError into the JSON response
 * expected by frontend/API callers.
 * ============================================================
 */

export function authErrorResponse(
  error: unknown,
): Response {
  if (
    error instanceof AuthError
  ) {
    return jsonResponse(
      {
        success: false,
        error: error.code,
        message: error.message,
      },
      error.statusCode,
    );
  }

  console.error(
    "Unexpected authentication error:",
    error,
  );

  return jsonResponse(
    {
      success: false,
      error: "AUTHENTICATION_ERROR",
      message:
        "Authentication failed.",
    },
    500,
  );
}

/*
 * ============================================================
 * PARSE JSON BODY
 * ============================================================
 *
 * This helper is kept here because some of
 * the AI/admin functions use the same auth
 * utility module.
 * ============================================================
 */

export async function parseBody<T = unknown>(
  event: {
    body?: string | null;
    isBase64Encoded?: boolean;
  },
): Promise<T> {
  if (
    !event.body ||
    !event.body.trim()
  ) {
    return {} as T;
  }

  let body =
    event.body;

  /*
   * Netlify can provide a base64 encoded
   * request body.
   */
  if (
    event.isBase64Encoded
  ) {
    try {
      body = Buffer.from(
        body,
        "base64",
      ).toString("utf8");
    } catch {
      throw new AuthError(
        "Invalid request body encoding.",
        400,
        "INVALID_REQUEST_BODY",
      );
    }
  }

  try {
    return JSON.parse(
      body,
    ) as T;
  } catch {
    throw new AuthError(
      "Invalid JSON request body.",
      400,
      "INVALID_JSON",
    );
  }
}
