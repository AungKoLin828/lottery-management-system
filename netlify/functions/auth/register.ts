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

function normalizePhone(
  phone: string,
): string {
  return phone
    .trim()
    .replace(/[\s()-]/g, "");
}

function generateUsername(): string {
  return (
    "player_" +
    crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
  );
}

export const handler: Handler = async (
  event,
) => {
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

    const fullName = String(
      body.name ?? "",
    ).trim();

    const phone = normalizePhone(
      String(body.phone ?? ""),
    );

    const password = String(
      body.password ?? "",
    );

    const confirmPassword = String(
      body.confirmPassword ?? "",
    );

    /*
     * Validate name.
     */
    if (!fullName) {
      return response(400, {
        success: false,
        message: "Full name is required",
      });
    }

    if (fullName.length > 150) {
      return response(400, {
        success: false,
        message:
          "Full name is too long",
      });
    }

    /*
     * Validate phone.
     */
    if (!phone) {
      return response(400, {
        success: false,
        message:
          "Phone number is required",
      });
    }

    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      return response(400, {
        success: false,
        message:
          "Invalid phone number",
      });
    }

    /*
     * Validate password.
     */
    if (password.length < 8) {
      return response(400, {
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    if (password.length > 100) {
      return response(400, {
        success: false,
        message:
          "Password is too long",
      });
    }

    if (
      password !==
      confirmPassword
    ) {
      return response(400, {
        success: false,
        message:
          "Passwords do not match",
      });
    }

    /*
     * Check duplicate phone.
     */
    const existingUser =
      await db.query.users.findFirst({
        where: eq(
          users.phone,
          phone,
        ),
      });

    if (existingUser) {
      return response(409, {
        success: false,
        message:
          "Phone number is already registered",
      });
    }

    /*
     * Hash password.
     *
     * NEVER save the plain password.
     */
    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    const username =
      generateUsername();

    /*
     * Create player.
     */
    const [user] =
      await db
        .insert(users)
        .values({
          username,

          fullName,

          phone,

          passwordHash,

          role: "PLAYER",

          status: "ACTIVE",

          /*
           * For now false.
           *
           * Change to true after OTP verification.
           */
          isVerified: false,
        })
        .returning({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          phone: users.phone,
          role: users.role,
          status: users.status,
          isVerified:
            users.isVerified,
        });

    if (!user) {
      return response(500, {
        success: false,
        message:
          "Unable to create account",
      });
    }

    /*
     * Automatically login after registration.
     */
    const token =
      await createToken({
        id: user.id,
        role: user.role,
      });

    return response(
      201,
      {
        success: true,

        message:
          "Account created successfully",

        data: {
          user,
        },
      },
      {
        "Set-Cookie":
          getAuthCookie(token),
      },
    );
  } catch (error) {
    console.error(
      "Register error:",
      error,
    );

    return response(500, {
      success: false,
      message:
        "Unable to create account",
    });
  }
};