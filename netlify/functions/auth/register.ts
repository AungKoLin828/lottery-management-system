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

interface RegisterBody {
  name?: string;

  phone?: string;

  password?: string;

  confirmPassword?: string;
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function generateUsername(): string {
  const random = crypto.randomUUID().replace(/-/g, "").substring(0, 10);

  return `player_${random}`;
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
    const body = parseBody<RegisterBody>(event);

    const name = body.name?.trim() ?? "";

    const phone = normalizePhone(body.phone ?? "");

    const password = body.password ?? "";

    const confirmPassword = body.confirmPassword ?? "";

    if (!name) {
      return jsonResponse(400, {
        success: false,

        message: "Full name is required",
      });
    }

    if (name.length < 2) {
      return jsonResponse(400, {
        success: false,

        message: "Full name must be at least 2 characters",
      });
    }

    if (!phone) {
      return jsonResponse(400, {
        success: false,

        message: "Phone number is required",
      });
    }

    if (password.length < 6) {
      return jsonResponse(400, {
        success: false,

        message: "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return jsonResponse(400, {
        success: false,

        message: "Passwords do not match",
      });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (existingUser) {
      return jsonResponse(409, {
        success: false,

        message: "An account with this phone number already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const username = generateUsername();

    const [user] = await db
      .insert(users)
      .values({
        username,

        phone,

        fullName: name,

        passwordHash,

        role: "PLAYER",

        status: "ACTIVE",

        isVerified: false,
      })
      .returning();

    if (!user) {
      return jsonResponse(500, {
        success: false,

        message: "Unable to create account",
      });
    }

    const token = await createToken(user);

    return jsonResponse(
      201,
      {
        success: true,

        message: "Account created successfully",

        data: {
          user: toAuthUser(user),
        },
      },
      {
        "Set-Cookie": createAuthCookie(token),
      },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return jsonResponse(500, {
      success: false,

      message: "Unable to create account",
    });
  }
};
