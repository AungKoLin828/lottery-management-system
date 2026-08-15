import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { clearAuthCookie } from "../utils/auth";

export const handler: Handler = async (
  event: HandlerEvent
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        message: "Method not allowed",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearAuthCookie(),
    },
    body: JSON.stringify({
      success: true,
      message: "Logged out successfully",
    }),
  };
};