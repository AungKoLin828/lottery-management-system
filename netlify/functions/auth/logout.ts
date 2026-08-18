import type { Handler } from "@netlify/functions";

import { clearAuthCookie, jsonResponse } from "../utils/auth";

export const handler: Handler = async (event) => {
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

  return jsonResponse(
    200,
    {
      success: true,

      message: "Logged out successfully",
    },
    {
      "Set-Cookie": clearAuthCookie(),
    },
  );
};
