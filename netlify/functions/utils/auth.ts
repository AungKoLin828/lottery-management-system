import { SignJWT, jwtVerify } from "jose";

import type { HandlerEvent } from "@netlify/functions";

import type { InferSelectModel } from "drizzle-orm";

import { users } from "../../../db/schema/users";

export type DbUser = InferSelectModel<typeof users>;

export interface AuthUser {
  id: string;

  username: string;

  fullName: string | null;

  phone: string;

  role: "ADMIN" | "PLAYER";

  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  isVerified: boolean;
}

const COOKIE_NAME = "lottery_auth";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }

  return new TextEncoder().encode(secret);
}

export function toAuthUser(user: DbUser): AuthUser {
  return {
    id: user.id,

    username: user.username,

    fullName: user.fullName,

    phone: user.phone,

    role: user.role,

    status: user.status,

    isVerified: user.isVerified,
  };
}

export async function createToken(user: DbUser): Promise<string> {
  return new SignJWT({
    userId: user.id,

    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const result = await jwtVerify(token, getSecret());

  return result.payload as {
    userId: string;

    role: "ADMIN" | "PLAYER";
  };
}

export function getCookie(event: HandlerEvent, name: string): string | null {
  const cookieHeader = event.headers.cookie ?? event.headers.Cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const index = cookie.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = cookie.substring(0, index);

    const value = cookie.substring(index + 1);

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

export function createAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,

    "Path=/",

    "HttpOnly",

    "SameSite=Lax",

    "Max-Age=604800",

    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearAuthCookie(): string {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    `${COOKIE_NAME}=`,

    "Path=/",

    "HttpOnly",

    "SameSite=Lax",

    "Max-Age=0",

    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",

    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function jsonResponse(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return {
    statusCode,

    headers: {
      "Content-Type": "application/json",

      ...headers,
    },

    body: JSON.stringify(body),
  };
}

export function parseBody<T>(event: HandlerEvent): T {
  if (!event.body) {
    throw new Error("Request body is required");
  }

  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new Error("Invalid JSON request");
  }
}
