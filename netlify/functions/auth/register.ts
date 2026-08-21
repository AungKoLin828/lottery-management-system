import type { Handler } from "@netlify/functions";

import { eq } from "drizzle-orm";

import bcrypt from "bcryptjs";

import crypto from "node:crypto";

import { users } from "../../../db/schema/users";

import { wallets } from "../../../db/schema/wallets";

import { db } from "../utils/db";

import {
  createAuthCookie,
  createToken,
  jsonResponse,
  parseBody,
  toAuthUser,
} from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

interface RegisterBody {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

/* ============================================================
   MYANMAR PHONE VALIDATION
============================================================ */

/**
 * Normalize Myanmar phone number.
 *
 * Supported:
 *
 * 09xxxxxxxxx
 * 09 xxx xxx xxx
 * 09-xxx-xxx-xxx
 * 959xxxxxxxxx
 * +959xxxxxxxxx
 * 00959xxxxxxxxx
 *
 * Result:
 *
 * +959xxxxxxxxx
 */
function normalizeMyanmarPhone(phone: string): string {
  let value = phone.trim().replace(/[\s\-().]/g, "");

  /*
   * 00959xxxxxxxxx
   *
   * becomes
   *
   * +959xxxxxxxxx
   */
  if (value.startsWith("00")) {
    value = `+${value.substring(2)}`;
  }

  /*
   * Remove + temporarily.
   */
  const withoutPlus = value.startsWith("+") ? value.substring(1) : value;

  /*
   * Local Myanmar format
   *
   * 09123456789
   *
   * becomes
   *
   * +959123456789
   */
  if (withoutPlus.startsWith("09")) {
    return `+95${withoutPlus.substring(1)}`;
  }

  /*
   * International format without +
   *
   * 959123456789
   *
   * becomes
   *
   * +959123456789
   */
  if (withoutPlus.startsWith("959")) {
    return `+${withoutPlus}`;
  }

  /*
   * Keep +95 so validation can reject
   * invalid Myanmar numbers correctly.
   */
  if (withoutPlus.startsWith("95")) {
    return `+${withoutPlus}`;
  }

  return value;
}

/**
 * Validate Myanmar mobile number.
 *
 * This checks:
 *
 * 1. +95 country code
 * 2. +959 mobile prefix
 * 3. Numeric format
 * 4. Subscriber length
 * 5. Mobile prefix
 *
 * NOTE:
 *
 * This does NOT verify ownership of the phone number.
 *
 * No OTP or external verification service is used.
 */
function validateMyanmarPhone(phone: string): {
  valid: boolean;
  normalized: string;
  message: string;
} {
  if (!phone.trim()) {
    return {
      valid: false,
      normalized: "",
      message: "Phone number is required",
    };
  }

  const normalized = normalizeMyanmarPhone(phone);

  /* ----------------------------------------------------------
     Country code
  ---------------------------------------------------------- */

  if (!normalized.startsWith("+95")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar phone number",
    };
  }

  /* ----------------------------------------------------------
     Mobile number must start +959
  ---------------------------------------------------------- */

  if (!normalized.startsWith("+959")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar mobile number starting with 09",
    };
  }

  /* ----------------------------------------------------------
     Only digits after +
  ---------------------------------------------------------- */

  if (!/^\+95\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      message: "Phone number contains invalid characters",
    };
  }

  /* ----------------------------------------------------------
     Subscriber number
     
     +959123456789
          ↓
       9123456789
  ---------------------------------------------------------- */

  const subscriber = normalized.substring(3);

  /* ----------------------------------------------------------
     Length
  ---------------------------------------------------------- */

  if (subscriber.length !== 9 && subscriber.length !== 10) {
    return {
      valid: false,
      normalized,
      message: "Invalid Myanmar mobile number length",
    };
  }

  /* ----------------------------------------------------------
     Mobile prefix
  ---------------------------------------------------------- */

  const mobilePrefix = subscriber.substring(0, 2);

  /**
   * Myanmar mobile numbering prefixes.
   *
   * These are used only as a format check.
   */
  const validPrefixes = new Set([
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "50",
    "51",
    "52",
    "53",
    "54",
    "55",
    "56",
    "57",
    "58",
    "59",
    "60",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "70",
    "71",
    "72",
    "73",
    "74",
    "75",
    "76",
    "77",
    "78",
    "79",
    "80",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "90",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
  ]);

  if (!validPrefixes.has(mobilePrefix)) {
    return {
      valid: false,
      normalized,
      message: "Invalid Myanmar mobile number prefix",
    };
  }

  return {
    valid: true,
    normalized,
    message: "Valid Myanmar mobile number",
  };
}

/* ============================================================
   USERNAME
============================================================ */

function generateUsername(): string {
  const random = crypto.randomUUID().replace(/-/g, "").substring(0, 10);

  return `player_${random}`;
}

/* ============================================================
   REGISTER HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  /* ========================================================
       HTTP METHOD
    ======================================================== */

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
    /* ======================================================
         PARSE BODY
      ====================================================== */

    const body = parseBody<RegisterBody>(event);

    const name = body.name?.trim() ?? "";

    const rawPhone = body.phone?.trim() ?? "";

    const password = body.password ?? "";

    const confirmPassword = body.confirmPassword ?? "";

    /* ======================================================
         NAME
      ====================================================== */

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

    /* ======================================================
         PHONE
      ====================================================== */

    const phoneResult = validateMyanmarPhone(rawPhone);

    if (!phoneResult.valid) {
      return jsonResponse(400, {
        success: false,
        message: phoneResult.message,
      });
    }

    /**
     * Always use normalized phone.
     *
     * Example:
     *
     * 09 123 456 789
     *
     * becomes:
     *
     * +959123456789
     */

    const phone = phoneResult.normalized;

    /* ======================================================
         PASSWORD
      ====================================================== */

    if (!password) {
      return jsonResponse(400, {
        success: false,
        message: "Password is required",
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

    /* ======================================================
         CHECK EXISTING PHONE
      ====================================================== */

    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (existingUser) {
      return jsonResponse(409, {
        success: false,
        message: "An account with this phone number already exists",
      });
    }

    /* ======================================================
         PASSWORD HASH
      ====================================================== */

    const passwordHash = await bcrypt.hash(password, 12);

    /* ======================================================
         USERNAME
      ====================================================== */

    const username = generateUsername();

    /* ======================================================
         CREATE USER + WALLET
         
         IMPORTANT:
         
         Both operations are inside one transaction.
         
         If wallet creation fails:
         
         User creation is also rolled back.
      ====================================================== */

    const result = await db.transaction(async (tx) => {
      /* ==================================================
               CREATE USER
            ================================================== */

      const [user] = await tx
        .insert(users)
        .values({
          username,

          phone,

          fullName: name,

          passwordHash,

          role: "PLAYER",

          status: "ACTIVE",

          /**
           * No OTP.
           * No SMS.
           * No Viber.
           * No Telegram.
           *
           * This means the phone number has
           * only passed format validation.
           */
          isVerified: false,
        })
        .returning();

      /* ==================================================
               DATABASE INSERT FAILURE
            ================================================== */

      if (!user) {
        throw new Error("Unable to create account");
      }

      /* ==================================================
               CREATE PLAYER WALLET
            ================================================== */

      const [wallet] = await tx
        .insert(wallets)
        .values({
          userId: user.id,

          /*
           * New player's wallet always starts at zero.
           */
          balance: "0",

          totalDeposit: "0",

          totalWithdraw: "0",

          totalBet: "0",

          totalWin: "0",
        })
        .returning({
          id: wallets.id,

          balance: wallets.balance,

          totalDeposit: wallets.totalDeposit,

          totalWithdraw: wallets.totalWithdraw,

          totalBet: wallets.totalBet,

          totalWin: wallets.totalWin,
        });

      /* ==================================================
               WALLET INSERT FAILURE
            ================================================== */

      if (!wallet) {
        throw new Error("Unable to create wallet");
      }

      return {
        user,

        wallet,
      };
    });

    /* ======================================================
         CREATE JWT
      ====================================================== */

    const token = await createToken(result.user);

    /* ======================================================
         RESPONSE
      ====================================================== */

    return jsonResponse(
      201,
      {
        success: true,

        message: "Account created successfully",

        data: {
          user: toAuthUser(result.user),

          /*
           * Wallet is returned as additional data.
           *
           * Existing frontend code that only reads
           * data.user will continue to work.
           */
          wallet: {
            id: result.wallet.id,

            balance: Number(result.wallet.balance),

            totalDeposit: Number(result.wallet.totalDeposit),

            totalWithdraw: Number(result.wallet.totalWithdraw),

            totalBet: Number(result.wallet.totalBet),

            totalWin: Number(result.wallet.totalWin),
          },
        },
      },
      {
        "Set-Cookie": createAuthCookie(token),
      },
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    /*
     * PostgreSQL unique constraint.
     *
     * This protects against duplicate phone/username
     * requests that happen at nearly the same time.
     */
    if (error && typeof error === "object" && "code" in error) {
      const code = String(
        (
          error as {
            code?: unknown;
          }
        ).code,
      );

      if (code === "23505") {
        return jsonResponse(409, {
          success: false,
          message:
            "An account with this phone number or username already exists",
        });
      }
    }

    return jsonResponse(500, {
      success: false,
      message: "Unable to create account",
    });
  }
};
