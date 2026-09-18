import type { Handler } from "@netlify/functions";
import { SignJWT } from "jose";

import {
  getAuthTokenFromCookie,
  jsonResponse,
  verifyToken,
} from "./utils/auth";

/* ============================================================
   SUPABASE JWT SECRET
============================================================ */

function getSupabaseJwtSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET environment variable is not configured",
    );
  }

  return new TextEncoder().encode(secret);
}

/* ============================================================
   HANDLER
============================================================ */

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
       APPLICATION AUTH
    ======================================================== */

    const authToken = getAuthTokenFromCookie(event);

    if (!authToken) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    const payload = await verifyToken(authToken);

    if (!payload.userId) {
      return jsonResponse(401, {
        success: false,
        message: "Invalid authentication token",
      });
    }

    /* ========================================================
       ALLOW PLAYER + ADMIN
    ======================================================== */

    if (payload.role !== "PLAYER" && payload.role !== "ADMIN") {
      return jsonResponse(403, {
        success: false,
        message: "Realtime access denied",
      });
    }

    /* ========================================================
       SUPABASE REALTIME JWT
    ======================================================== */

    const realtimeToken = await new SignJWT({
      user_id: payload.userId,

      /*
       * Keep application role so RLS policies can distinguish
       * ADMIN from PLAYER if needed.
       */
      app_role: payload.role,

      /*
       * Supabase Realtime expects an authenticated role.
       */
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

        /*
         * Useful for debugging on the frontend.
         * Does not contain any secret.
         */
        role: payload.role,
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