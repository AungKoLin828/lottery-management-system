import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";

import { db } from "../../../db";
import { users } from "../../../db/schema/users";

import {
  getTokenFromCookie,
  verifyToken,
} from "../utils/auth";

function response(
  statusCode: number,
  data: unknown,
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify(data),
  };
}

export const handler: Handler = async (
  event,
) => {
  if (event.httpMethod !== "GET") {
    return response(405, {
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const cookie =
      event.headers.cookie ??
      event.headers.Cookie;

    const token =
      getTokenFromCookie(cookie);

    if (!token) {
      return response(401, {
        success: false,
        message: "Not authenticated",
      });
    }

    const authUser =
      await verifyToken(token);

    const user =
      await db.query.users.findFirst({
        where: eq(
          users.id,
          authUser.id,
        ),
      });

    if (!user) {
      return response(401, {
        success: false,
        message:
          "User no longer exists",
      });
    }

    if (user.status !== "ACTIVE") {
      return response(403, {
        success: false,
        message:
          "Your account is not active",
      });
    }

    return response(200, {
      success: true,

      data: {
        user: {
          id: user.id,
          username:
            user.username,
          fullName:
            user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          isVerified:
            user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error(
      "Me error:",
      error,
    );

    return response(401, {
      success: false,
      message:
        "Invalid authentication",
    });
  }
};