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

/**
 * Normalize Myanmar phone number.
 *
 * Supports:
 *
 * 09123456789
 * 959123456789
 * +959123456789
 *
 * Database value:
 *
 * +959123456789
 */
function normalizePhone(phone: string): string {
  let value = phone.trim().replace(/[\s\-().]/g, "");

  if (!value) {
    return "";
  }

  /**
   * 00959123456789
   * ↓
   * +959123456789
   */
  if (value.startsWith("00")) {
    value = `+${value.substring(2)}`;
  }

  /**
   * Remove + temporarily.
   */
  const withoutPlus = value.startsWith("+") ? value.substring(1) : value;

  /**
   * Local Myanmar:
   *
   * 09123456789
   * ↓
   * +959123456789
   */
  if (withoutPlus.startsWith("09")) {
    return `+95${withoutPlus.substring(1)}`;
  }

  /**
   * International without +:
   *
   * 959123456789
   * ↓
   * +959123456789
   */
  if (withoutPlus.startsWith("959")) {
    return `+${withoutPlus}`;
  }

  /**
   * Already 95:
   */
  if (withoutPlus.startsWith("95")) {
    return `+${withoutPlus}`;
  }

  return value;
}

export const handler: Handler = async (event) => {
  /* ==========================================================
     METHOD
  ========================================================== */

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
    /* ========================================================
       BODY
    ======================================================== */

    const body = parseBody<LoginBody>(event);

    const phone = normalizePhone(body.phone ?? "");

    const password = body.password ?? "";

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (!phone || !password) {
      return jsonResponse(400, {
        success: false,
        message: "Phone number and password are required",
      });
    }

    /* ========================================================
       FIND USER
    ======================================================== */

    const user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (!user) {
      return jsonResponse(401, {
        success: false,
        message: "Invalid phone number or password",
      });
    }

    /* ========================================================
       PASSWORD
    ======================================================== */

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return jsonResponse(401, {
        success: false,
        message: "Invalid phone number or password",
      });
    }

    /* ========================================================
       ACCOUNT STATUS
    ======================================================== */

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,
        message:
          user.status === "SUSPENDED"
            ? "Your account has been suspended"
            : "Your account is inactive",
      });
    }

    /* ========================================================
       UPDATE LAST LOGIN
    ======================================================== */

    const [updatedUser] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    const currentUser = updatedUser ?? user;

    /* ========================================================
       CREATE JWT
    ======================================================== */

    const token = await createToken(currentUser);

    /* ========================================================
       RESPONSE
    ======================================================== */

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
