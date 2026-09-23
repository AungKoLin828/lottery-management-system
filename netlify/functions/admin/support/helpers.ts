import type { HandlerEvent } from "@netlify/functions";

import { getAuthTokenFromCookie, verifyToken } from "../utils/auth";

export interface AdminAuthResult {
  userId: string;
  role: "ADMIN";
}

export async function requireAdmin(
  event: HandlerEvent,
): Promise<AdminAuthResult | null> {
  try {
    const token = getAuthTokenFromCookie(event);

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    if (!payload.userId) {
      return null;
    }

    if (payload.role !== "ADMIN") {
      return null;
    }

    return {
      userId: payload.userId,
      role: "ADMIN",
    };
  } catch (error) {
    console.warn(
      "[Admin Support] Authentication failed:",
      error instanceof Error ? error.message : error,
    );

    return null;
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
