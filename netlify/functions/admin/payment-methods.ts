import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { asc, eq } from "drizzle-orm";

import { paymentMethods } from "../../../db/schema/paymentMethods";

import { db } from "../utils/db";

import { getCookie, jsonResponse, parseBody, verifyToken } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethodType = "Deposit" | "Withdraw" | "Both";

type DatabasePaymentMethodType = "DEPOSIT" | "WITHDRAW" | "BOTH";

interface PaymentMethodPayload {
  id?: unknown;

  name?: unknown;

  type?: unknown;

  enabled?: unknown;

  accountName?: unknown;

  accountNumber?: unknown;

  bankName?: unknown;

  branch?: unknown;

  displayOrder?: unknown;
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
   AUTHENTICATION
============================================================ */

async function getAuthenticatedAdmin(event: HandlerEvent) {
  try {
    const token = getCookie(event, "lottery_auth");

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    if (!payload.userId) {
      return null;
    }

    if (payload.role !== "ADMIN") {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Payment methods authentication error:", error);

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
  /*
   * Allow null / undefined for optional fields.
   */
  if (!required && (value === null || value === undefined)) {
    return "";
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
   PAYMENT TYPE - API FORMAT
============================================================ */

/*
 * The frontend/API uses:
 *
 * Deposit
 * Withdraw
 * Both
 */

function parsePaymentType(value: unknown): PaymentMethodType {
  if (value !== "Deposit" && value !== "Withdraw" && value !== "Both") {
    throw new Error("type must be Deposit, Withdraw, or Both.");
  }

  return value;
}

/* ============================================================
   PAYMENT TYPE - API → DATABASE
============================================================ */

/*
 * PostgreSQL enum values are:
 *
 * DEPOSIT
 * WITHDRAW
 * BOTH
 *
 * PostgreSQL enum values are case-sensitive.
 *
 * Therefore:
 *
 * Deposit  → DEPOSIT
 * Withdraw → WITHDRAW
 * Both     → BOTH
 */

function toDatabasePaymentType(
  value: PaymentMethodType,
): DatabasePaymentMethodType {
  switch (value) {
    case "Deposit":
      return "DEPOSIT";

    case "Withdraw":
      return "WITHDRAW";

    case "Both":
      return "BOTH";

    default:
      throw new Error("Invalid payment method type.");
  }
}

/* ============================================================
   PAYMENT TYPE - DATABASE → API
============================================================ */

/*
 * PostgreSQL:
 *
 * DEPOSIT
 * WITHDRAW
 * BOTH
 *
 * API:
 *
 * Deposit
 * Withdraw
 * Both
 */

function toApiPaymentType(value: unknown): PaymentMethodType {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  switch (normalized) {
    case "DEPOSIT":
      return "Deposit";

    case "WITHDRAW":
      return "Withdraw";

    case "BOTH":
      return "Both";

    default:
      throw new Error(
        `Invalid payment method type returned by database: ${String(value)}`,
      );
  }
}

/* ============================================================
   BOOLEAN VALIDATION
============================================================ */

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be true or false.`);
  }

  return value;
}

/* ============================================================
   POSITIVE INTEGER VALIDATION
============================================================ */

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

/* ============================================================
   UUID VALIDATION
============================================================ */

function parseUuid(value: unknown, fieldName: string): string {
  const id = parseString(value, fieldName);

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    throw new Error(`${fieldName} is not a valid UUID.`);
  }

  return id;
}

/* ============================================================
   MAP DATABASE RECORD → API RECORD
============================================================ */

function mapPaymentMethod(method: typeof paymentMethods.$inferSelect) {
  return {
    id: String(method.id),

    name: method.name,

    /*
     * Convert:
     *
     * DEPOSIT → Deposit
     * WITHDRAW → Withdraw
     * BOTH → Both
     */
    type: toApiPaymentType(method.type),

    enabled: method.enabled,

    accountName: method.accountName,

    accountNumber: method.accountNumber,

    bankName: method.bankName ?? "",

    branch: method.branch ?? "",

    displayOrder: Number(method.displayOrder),

    createdAt: method.createdAt,

    updatedAt: method.updatedAt,
  };
}

/* ============================================================
   GET PAYMENT METHODS
============================================================ */

async function getPaymentMethods(): Promise<HandlerResponse> {
  const methods = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.createdAt));

  /*
   * Convert database enum values to
   * frontend/API values.
   */
  const mappedMethods = methods.map(mapPaymentMethod);

  return successResponse({
    paymentMethods: mappedMethods,

    /*
     * Keep this compatibility property
     * in case another frontend/API part
     * expects "methods".
     */
    methods: mappedMethods,
  });
}

/* ============================================================
   CREATE PAYMENT METHOD
============================================================ */

async function createPaymentMethod(
  body: PaymentMethodPayload,
): Promise<HandlerResponse> {
  /* ----------------------------------------------------------
     VALIDATE
  ---------------------------------------------------------- */

  const name = parseString(body.name, "name");

  const apiType = parsePaymentType(body.type);

  /*
   * IMPORTANT:
   *
   * Convert:
   *
   * Deposit → DEPOSIT
   * Withdraw → WITHDRAW
   * Both → BOTH
   */
  const databaseType = toDatabasePaymentType(apiType);

  const enabled = parseBoolean(body.enabled, "enabled");

  const accountName = parseString(body.accountName, "accountName");

  const accountNumber = parseString(body.accountNumber, "accountNumber");

  const bankName = parseString(body.bankName, "bankName", false);

  const branch = parseString(body.branch, "branch", false);

  const displayOrder = parsePositiveInteger(body.displayOrder, "displayOrder");

  /* ----------------------------------------------------------
     INSERT
  ---------------------------------------------------------- */

  const now = new Date();

  /*
   * databaseType is now:
   *
   * DEPOSIT
   * WITHDRAW
   * BOTH
   *
   * which exactly matches the PostgreSQL enum.
   */
  const inserted = await db
    .insert(paymentMethods)
    .values({
      name,

      type: databaseType,

      enabled,

      accountName,

      accountNumber,

      bankName: bankName || null,

      branch: branch || null,

      displayOrder,

      createdAt: now,

      updatedAt: now,
    })
    .returning();

  if (inserted.length === 0) {
    throw new Error("Failed to create payment method.");
  }

  const paymentMethod = mapPaymentMethod(inserted[0]);

  return successResponse(
    {
      paymentMethod,

      method: paymentMethod,
    },
    201,
  );
}

/* ============================================================
   UPDATE PAYMENT METHOD
============================================================ */

async function updatePaymentMethod(
  body: PaymentMethodPayload,
): Promise<HandlerResponse> {
  /* ----------------------------------------------------------
     VALIDATE ID
  ---------------------------------------------------------- */

  const id = parseUuid(body.id, "id");

  /* ----------------------------------------------------------
     VALIDATE FIELDS
  ---------------------------------------------------------- */

  const name = parseString(body.name, "name");

  const apiType = parsePaymentType(body.type);

  /*
   * IMPORTANT:
   *
   * Convert API enum to PostgreSQL enum.
   */
  const databaseType = toDatabasePaymentType(apiType);

  const enabled = parseBoolean(body.enabled, "enabled");

  const accountName = parseString(body.accountName, "accountName");

  const accountNumber = parseString(body.accountNumber, "accountNumber");

  const bankName = parseString(body.bankName, "bankName", false);

  const branch = parseString(body.branch, "branch", false);

  const displayOrder = parsePositiveInteger(body.displayOrder, "displayOrder");

  /* ----------------------------------------------------------
     CHECK EXISTING
  ---------------------------------------------------------- */

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (existing.length === 0) {
    return errorResponse("Payment method not found.", 404);
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

  const updated = await db
    .update(paymentMethods)
    .set({
      name,

      type: databaseType,

      enabled,

      accountName,

      accountNumber,

      bankName: bankName || null,

      branch: branch || null,

      displayOrder,

      updatedAt: new Date(),
    })
    .where(eq(paymentMethods.id, id))
    .returning();

  if (updated.length === 0) {
    throw new Error("Failed to update payment method.");
  }

  const paymentMethod = mapPaymentMethod(updated[0]);

  return successResponse({
    paymentMethod,

    method: paymentMethod,
  });
}

/* ============================================================
   DELETE PAYMENT METHOD
============================================================ */

async function deletePaymentMethod(
  body: PaymentMethodPayload,
): Promise<HandlerResponse> {
  /* ----------------------------------------------------------
     VALIDATE ID
  ---------------------------------------------------------- */

  const id = parseUuid(body.id, "id");

  /* ----------------------------------------------------------
     CHECK EXISTING
  ---------------------------------------------------------- */

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (existing.length === 0) {
    return errorResponse("Payment method not found.", 404);
  }

  /* ----------------------------------------------------------
     DELETE
  ---------------------------------------------------------- */

  const deleted = await db
    .delete(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .returning();

  if (deleted.length === 0) {
    throw new Error("Failed to delete payment method.");
  }

  const paymentMethod = mapPaymentMethod(deleted[0]);

  return successResponse({
    paymentMethod,

    method: paymentMethod,
  });
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  try {
    /* ------------------------------------------------------
         AUTHENTICATION
      ------------------------------------------------------ */

    const admin = await getAuthenticatedAdmin(event);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access is required.", 401);
    }

    /* ------------------------------------------------------
         HTTP METHOD
      ------------------------------------------------------ */

    const method = event.httpMethod.toUpperCase();

    /* ------------------------------------------------------
         GET
      ------------------------------------------------------ */

    if (method === "GET") {
      return await getPaymentMethods();
    }

    /* ------------------------------------------------------
         POST
      ------------------------------------------------------ */

    if (method === "POST") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await createPaymentMethod(body);
    }

    /* ------------------------------------------------------
         PUT
      ------------------------------------------------------ */

    if (method === "PUT") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await updatePaymentMethod(body);
    }

    /* ------------------------------------------------------
         DELETE
      ------------------------------------------------------ */

    if (method === "DELETE") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await deletePaymentMethod(body);
    }

    /* ------------------------------------------------------
         METHOD NOT ALLOWED
      ------------------------------------------------------ */

    return errorResponse("Method not allowed.", 405);
  } catch (error) {
    /* ------------------------------------------------------
         LOG FULL ERROR
      ------------------------------------------------------ */

    console.error("Payment methods API error:", error);

    /* ------------------------------------------------------
         SAFE ERROR FOR CLIENT
      ------------------------------------------------------ */

    if (error instanceof Error) {
      /*
       * Validation errors can safely be
       * returned to the frontend.
       */
      const validationMessages = [
        "name is required.",
        "type must be",
        "enabled must be",
        "accountName is required.",
        "accountNumber is required.",
        "bankName must be",
        "branch must be",
        "displayOrder must be",
        "id is required.",
        "id is not a valid UUID.",
      ];

      const isValidationError = validationMessages.some((message) =>
        error.message.includes(message),
      );

      if (isValidationError) {
        return errorResponse(error.message, 400);
      }

      /*
       * Payment method not found.
       */
      if (error.message === "Payment method not found.") {
        return errorResponse(error.message, 404);
      }

      /*
       * Invalid payment type.
       */
      if (error.message.includes("Invalid payment method type")) {
        return errorResponse(error.message, 400);
      }

      /*
       * Don't expose raw PostgreSQL /
       * Drizzle errors to the browser.
       */
    }

    return errorResponse(
      "Internal server error while processing payment method.",
      500,
    );
  }
};
