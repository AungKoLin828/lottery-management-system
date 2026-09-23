import { jwtVerify } from "jose";

export interface AuthUser {
  id: string;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

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
    const value = cookie.slice(index + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

export async function requireAuth(
  request: Request,
): Promise<AuthUser> {
  const cookieHeader = request.headers.get("cookie");

  const token = getCookieValue(
    cookieHeader,
    "lottery_auth",
  );

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getJwtSecret(),
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