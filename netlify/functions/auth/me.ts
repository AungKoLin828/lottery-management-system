import type { Handler } from "@netlify/functions";

import { eq } from "drizzle-orm";

import { users } from "../../../db/schema/users";

import { db } from "../utils/db";

import {
  getCookie,
  jsonResponse,
  toAuthUser,
  verifyToken,
} from "../utils/auth";

const COOKIE_NAME = "lottery_auth";

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
    const token = getCookie(event, COOKIE_NAME);

    if (!token) {
      return jsonResponse(401, {
        success: false,

        message: "Not authenticated",
      });
    }

    let payload;

    try {
      payload = await verifyToken(token);
    } catch {
      return jsonResponse(401, {
        success: false,

        message: "Session expired or invalid",
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return jsonResponse(401, {
        success: false,

        message: "User account no longer exists",
      });
    }

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,

        message: "Your account is not active",
      });
    }

    return jsonResponse(200, {
      success: true,

      message: "Authenticated",

      data: {
        user: toAuthUser(user),
      },
    });
  } catch (error) {
    console.error("ME ERROR:", error);

    return jsonResponse(500, {
      success: false,

      message: "Unable to get current user",
    });
  }
};
