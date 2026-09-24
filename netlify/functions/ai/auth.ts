import { jwtVerify } from "jose";

/* ============================================================
   TYPES
============================================================ */

export interface AuthUser {
  id: string;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
}

/* ============================================================
   JWT SECRET
============================================================ */

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  if (secret.length < 16) {
    throw new Error("JWT_SECRET is too short");
  }

  return new TextEncoder().encode(secret);
}

/* ============================================================
   COOKIE PARSER
============================================================ */

function getCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const index = cookie.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = cookie.slice(0, index).trim();

    if (key !== name) {
      continue;
    }

    const rawValue = cookie
      .slice(index + 1)
      .trim();

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

/* ============================================================
   AUTHENTICATION
============================================================ */

export async function requireAuth(
  request: Request,
): Promise<AuthUser> {
  const cookieHeader =
    request.headers.get("cookie");

  const token = getCookieValue(
    cookieHeader,
    "lottery_auth",
  );

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    const secret = getJwtSecret();

    const { payload } =
      await jwtVerify(
        token,
        secret,
      );

    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : typeof payload.sub === "string"
          ? payload.sub
          : null;

    if (!userId) {
      throw new Error("UNAUTHORIZED");
    }

    return {
      id: userId,

      username:
        typeof payload.username === "string"
          ? payload.username
          : null,

      phone:
        typeof payload.phone === "string"
          ? payload.phone
          : null,

      role:
        typeof payload.role === "string"
          ? payload.role
          : null,
    };
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}