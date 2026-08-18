import type { Handler } from "@netlify/functions";

import { eq } from "drizzle-orm";

import bcrypt from "bcryptjs";

import { users } from "../../../db/schema/users";

import { db } from "../utils/db";

import {
  createAuthCookie,
  createToken,
  jsonResponse,
  parseBody,
  toAuthUser,
} from "../utils/auth";

interface LoginBody {
  phone?: string;

  password?: string;
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

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

  try {
    const body = parseBody<LoginBody>(event);

    const phone = normalizePhone(body.phone ?? "");

    const password = body.password ?? "";

    if (!phone || !password) {
      return jsonResponse(400, {
        success: false,

        message: "Phone number and password are required",
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (!user) {
      return jsonResponse(401, {
        success: false,

        message: "Invalid phone number or password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return jsonResponse(401, {
        success: false,

        message: "Invalid phone number or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,

        message:
          user.status === "SUSPENDED"
            ? "Your account has been suspended"
            : "Your account is inactive",
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),

        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    const currentUser = updatedUser ?? user;

    const token = await createToken(currentUser);

    return jsonResponse(
      200,
      {
        success: true,

        message: "Login successful",

        data: {
          user: toAuthUser(currentUser),
        },
      },
      {
        "Set-Cookie": createAuthCookie(token),
      },
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return jsonResponse(500, {
      success: false,

      message: "Login failed",
    });
  }
};
