import type { Handler } from "@netlify/functions";

import { SignJWT } from "jose";

import {
  jsonResponse,
  getAuthTokenFromCookie,
  verifyToken,
} from "./utils/auth";

function getSupabaseJwtSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET environment variable is not configured",
    );
  }

  return new TextEncoder().encode(secret);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed",
      },
      {
        Allow: "GET",
      },
    );
  }

  try {
    /* ========================================================
       READ EXISTING APPLICATION AUTH COOKIE
    ======================================================== */

    const authToken = getAuthTokenFromCookie(event);

    if (!authToken) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    /* ========================================================
       VERIFY EXISTING APPLICATION JWT

       This continues using your existing JWT_SECRET.
    ======================================================== */

    const payload = await verifyToken(authToken);

    if (!payload.userId) {
      return jsonResponse(401, {
        success: false,
        message: "Invalid authentication token",
      });
    }

    /* ========================================================
       CREATE SHORT-LIVED SUPABASE REALTIME JWT

       IMPORTANT:
       - sub = your application's user ID
       - role = Supabase PostgreSQL role
       - app_role = your application's ADMIN / PLAYER role
    ======================================================== */

    const realtimeToken = await new SignJWT({
      user_id: payload.userId,

      app_role: payload.role,

      role: "authenticated",
    })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(getSupabaseJwtSecret());

    /* ========================================================
       RESPONSE
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      data: {
        token: realtimeToken,
      },
    });
  } catch (error) {
    console.error("REALTIME TOKEN ERROR:", error);

    return jsonResponse(401, {
      success: false,
      message: "Unable to authenticate realtime connection",
    });
  }
};
