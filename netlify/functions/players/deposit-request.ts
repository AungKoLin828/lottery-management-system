import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { and, eq } from "drizzle-orm";

import { deposits } from "../../../db/schema/deposits";
import { paymentMethods } from "../../../db/schema/paymentMethods";

import { db } from "../utils/db";

import { getCookie, jsonResponse, parseBody, verifyToken } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

interface DepositRequestPayload {
  amount?: unknown;

  paymentMethodId?: unknown;

  transactionNumber?: unknown;

  note?: unknown;
}

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function successResponse(data: unknown, statusCode = 200): HandlerResponse {
  return jsonResponse(statusCode, {
    success: true,
    data,
  });
}

function errorResponse(message: string, statusCode = 400): HandlerResponse {
  return jsonResponse(statusCode, {
    success: false,
    message,
  });
}

/* ============================================================
   AUTHENTICATED PLAYER
============================================================ */

async function getAuthenticatedPlayer(event: HandlerEvent) {
  try {
    const token = getCookie(event, "lottery_auth");

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    if (!payload.userId) {
      return null;
    }

    /*
     * Only PLAYER accounts can create
     * deposit requests.
     */
    if (payload.role !== "PLAYER") {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Deposit authentication error:", error);

    return null;
  }
}

/* ============================================================
   STRING VALIDATION
============================================================ */

function parseString(
  value: unknown,
  fieldName: string,
  required = true,
): string {
  if (value === null || value === undefined) {
    if (!required) {
      return "";
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const result = value.trim();

  if (required && !result) {
    throw new Error(`${fieldName} is required.`);
  }

  return result;
}

/* ============================================================
   AMOUNT VALIDATION
============================================================ */

function parseAmount(value: unknown): number {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  if (!Number.isFinite(amount)) {
    throw new Error("Deposit amount must be a valid number.");
  }

  if (amount <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  /*
   * MMK deposits should be whole numbers.
   */
  if (!Number.isInteger(amount)) {
    throw new Error("Deposit amount must be a whole number.");
  }

  return amount;
}

/* ============================================================
   TRANSACTION NUMBER VALIDATION
============================================================ */

function parseTransactionNumber(value: unknown): string {
  const transactionNumber = parseString(value, "transactionNumber");

  /*
   * The player UI requires the last
   * 6 digits of the transaction number.
   */
  if (!/^\d{6}$/.test(transactionNumber)) {
    throw new Error("Transaction number must contain exactly 6 digits.");
  }

  return transactionNumber;
}

/* ============================================================
   CREATE DEPOSIT
============================================================ */

async function createDepositRequest(
  body: DepositRequestPayload,
  userId: string,
): Promise<HandlerResponse> {
  /* ==========================================================
     AMOUNT
  ========================================================== */

  const amount = parseAmount(body.amount);

  /*
   * PostgreSQL numeric(18,2)
   *
   * Store as a string to avoid JavaScript
   * floating-point precision problems.
   */
  const requestedAmount = amount.toFixed(2);

  /* ==========================================================
     PAYMENT METHOD
  ========================================================== */

  const paymentMethodId = parseString(body.paymentMethodId, "paymentMethodId");

  /* ==========================================================
     TRANSACTION NUMBER
  ========================================================== */

  const transactionNumber = parseTransactionNumber(body.transactionNumber);

  /* ==========================================================
     NOTE
  ========================================================== */

  const note = parseString(body.note, "note", false);

  /* ==========================================================
     GET PAYMENT METHOD FROM DATABASE
  ========================================================== */

  const paymentMethodResult = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, paymentMethodId))
    .limit(1);

  if (paymentMethodResult.length === 0) {
    return errorResponse("Payment method not found.", 404);
  }

  const paymentMethod = paymentMethodResult[0];

  /* ==========================================================
     CHECK ENABLED
  ========================================================== */

  if (!paymentMethod.enabled) {
    return errorResponse("This payment method is currently disabled.", 400);
  }

  /* ==========================================================
     CHECK PAYMENT METHOD TYPE
     
     PostgreSQL enum:
     
     DEPOSIT
     WITHDRAW
     BOTH
  ========================================================== */

  const paymentMethodType = String(paymentMethod.type).toUpperCase();

  if (paymentMethodType !== "DEPOSIT" && paymentMethodType !== "BOTH") {
    return errorResponse(
      "This payment method cannot be used for deposits.",
      400,
    );
  }

  /* ==========================================================
     DUPLICATE TRANSACTION CHECK
     
     Check whether the same player already
     submitted this transaction number.
  ========================================================== */

  const duplicate = await db
    .select({
      id: deposits.id,
      status: deposits.status,
    })
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, userId),
        eq(deposits.paymentMethodId, paymentMethodId),
        eq(deposits.transactionNumber, transactionNumber),
      ),
    )
    .limit(1);

  if (duplicate.length > 0) {
    return errorResponse(
      "A deposit request with this transaction number already exists.",
      409,
    );
  }

  /* ==========================================================
     CREATE DEPOSIT
  ========================================================== */

  const now = new Date();

  /*
   * IMPORTANT:
   *
   * Match the actual deposits schema:
   *
   * requestedAmount
   * paymentMethodId
   * transactionNumber
   * status
   * note
   * createdAt
   * updatedAt
   *
   * There is NO:
   *
   * amount
   * paymentMethodName
   */

  const inserted = await db
    .insert(deposits)
    .values({
      userId,

      requestedAmount,

      paymentMethodId,

      transactionNumber,

      status: "PENDING",

      note: note || null,

      createdAt: now,

      updatedAt: now,
    })
    .returning();

  /* ==========================================================
     INSERT RESULT
  ========================================================== */

  if (inserted.length === 0) {
    throw new Error("Failed to create deposit request.");
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  return successResponse(
    {
      deposit: inserted[0],

      /*
       * Useful frontend information.
       * Payment method information comes from
       * the database, not from the browser.
       */
      paymentMethod: {
        id: paymentMethod.id,

        name: paymentMethod.name,

        type: paymentMethodType,
      },
    },
    201,
  );
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  try {
    /* ========================================================
       METHOD
    ======================================================== */

    if (event.httpMethod !== "POST") {
      return errorResponse("Method not allowed.", 405);
    }

    /* ========================================================
       AUTHENTICATION
    ======================================================== */

    const player = await getAuthenticatedPlayer(event);

    if (!player) {
      return errorResponse("Unauthorized. Player login is required.", 401);
    }

    /* ========================================================
       BODY
    ======================================================== */

    const body = parseBody<DepositRequestPayload>(event);

    /* ========================================================
       CREATE REQUEST
    ======================================================== */

    return await createDepositRequest(body, player.userId);
  } catch (error) {
    console.error("Deposit request API error:", error);

    /* ========================================================
       POSTGRES UNIQUE VIOLATION
       
       23505 = unique_violation
    ======================================================== */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return errorResponse(
        "A deposit request with this transaction number already exists.",
        409,
      );
    }

    /* ========================================================
       INVALID UUID / ENUM / POSTGRES INPUT
       
       22P02 = invalid_text_representation
    ======================================================== */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "22P02"
    ) {
      return errorResponse("Invalid payment method or request data.", 400);
    }

    /* ========================================================
       FOREIGN KEY ERROR
       
       23503 = foreign_key_violation
    ======================================================== */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      return errorResponse("Invalid player or payment method.", 400);
    }

    /* ========================================================
       DEFAULT ERROR
    ======================================================== */

    return errorResponse(
      error instanceof Error ? error.message : "Internal server error.",
      500,
    );
  }
};
