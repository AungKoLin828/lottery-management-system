import type { Handler } from "@netlify/functions";

import { clearAuthCookie, jsonResponse } from "../utils/auth";

/**
 * ============================================================
 * AUTH LOGOUT
 * ============================================================
 *
 * POST /api/auth/logout
 *
 * Clears the JWT authentication cookie.
 *
 * The frontend should call this endpoint when the user
 * clicks Logout.
 *
 * ============================================================
 */

export const handler: Handler = async (event) => {
  /*
   * Only POST is allowed.
   */
  if (event.httpMethod !== "POST") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed",
      },
      {
        Allow: "POST",
      },
    );
  }

  try {
    /*
     * Clear the authentication cookie.
     *
     * clearAuthCookie() should return a Set-Cookie
     * header that expires the existing JWT cookie.
     */
    return jsonResponse(
      200,
      {
        success: true,
        message: "Logout successful",
      },
      {
        "Set-Cookie": clearAuthCookie(),
      },
    );
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return jsonResponse(500, {
      success: false,
      message: "Logout failed",
    });
  }
};
