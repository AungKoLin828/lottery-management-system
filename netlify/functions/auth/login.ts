import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../../../db";
import { users } from "../../../db/schema/users";

import {
  createToken,
  getAuthCookie,
} from "../utils/auth";

function response(
  statusCode: number,
  data: unknown,
  headers: Record<string, string> = {},
) {
  return {
    statusCode,

    headers: {
      "Content-Type": "application/json",

      ...headers,
    },

    body: JSON.stringify(data),
  };
}

function normalizePhone(phone: string): string {
  return phone
    .trim()
    .replace(/[\s()-]/g, "");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const body = JSON.parse(
      event.body ?? "{}",
    );

    const phone = normalizePhone(
      String(body.phone ?? ""),
    );

    const password = String(
      body.password ?? "",
    );

    if (!phone || !password) {
      return response(400, {
        success: false,
        message:
          "Phone and password are required",
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    /*
     * Don't reveal whether the phone exists.
     */
    if (!user) {
      return response(401, {
        success: false,
        message: "Invalid phone or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return response(403, {
        success: false,
        message:
          "Your account is not active",
      });
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );

    if (!passwordValid) {
      return response(401, {
        success: false,
        message: "Invalid phone or password",
      });
    }

    /*
     * Create authentication token.
     */
    const token = await createToken({
      id: user.id,
      role: user.role,
    });

    /*
     * Update last login.
     */
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return response(
      200,
      {
        success: true,

        message: "Login successful",

        data: {
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified,
          },
        },
      },
      {
        "Set-Cookie":
          getAuthCookie(token),
      },
    );
  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return response(500, {
      success: false,
      message: "Unable to login",
    });
  }
};