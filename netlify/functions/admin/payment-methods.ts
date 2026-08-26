import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { and, asc, eq } from "drizzle-orm";

import { paymentMethods } from "../../../db/schema/paymentMethods";

import { db } from "../utils/db";

import { jsonResponse, parseBody, getCookie, verifyToken } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethodType = "Deposit" | "Withdraw" | "Both";

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
   VALIDATION
============================================================ */

function parseString(
  value: unknown,
  fieldName: string,
  required = true,
): string {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) {
      return "";
    }

    throw new Error(`${fieldName} must be a string.`);
  }

  const result = value.trim();

  if (required && !result) {
    throw new Error(`${fieldName} is required.`);
  }

  return result;
}

function parsePaymentType(value: unknown): PaymentMethodType {
  if (value !== "Deposit" && value !== "Withdraw" && value !== "Both") {
    throw new Error("type must be Deposit, Withdraw, or Both.");
  }

  return value;
}

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be true or false.`);
  }

  return value;
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

/* ============================================================
   GET PAYMENT METHODS
============================================================ */

async function getPaymentMethods(): Promise<HandlerResponse> {
  const methods = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.displayOrder), asc(paymentMethods.createdAt));

  return successResponse({
    paymentMethods: methods,
  });
}

/* ============================================================
   CREATE PAYMENT METHOD
============================================================ */

async function createPaymentMethod(
  body: PaymentMethodPayload,
): Promise<HandlerResponse> {
  const name = parseString(body.name, "name");

  const type = parsePaymentType(body.type);

  const enabled = parseBoolean(body.enabled, "enabled");

  const accountName = parseString(body.accountName, "accountName");

  const accountNumber = parseString(body.accountNumber, "accountNumber");

  const bankName = parseString(body.bankName, "bankName", false);

  const branch = parseString(body.branch, "branch", false);

  const displayOrder = parsePositiveInteger(body.displayOrder, "displayOrder");

  const now = new Date();

  const inserted = await db
    .insert(paymentMethods)
    .values({
      name,
      type,
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

  return successResponse(
    {
      paymentMethod: inserted[0],
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
  const id = parseString(body.id, "id");

  const name = parseString(body.name, "name");

  const type = parsePaymentType(body.type);

  const enabled = parseBoolean(body.enabled, "enabled");

  const accountName = parseString(body.accountName, "accountName");

  const accountNumber = parseString(body.accountNumber, "accountNumber");

  const bankName = parseString(body.bankName, "bankName", false);

  const branch = parseString(body.branch, "branch", false);

  const displayOrder = parsePositiveInteger(body.displayOrder, "displayOrder");

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (existing.length === 0) {
    return errorResponse("Payment method not found.", 404);
  }

  const updated = await db
    .update(paymentMethods)
    .set({
      name,
      type,
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

  return successResponse({
    paymentMethod: updated[0],
  });
}

/* ============================================================
   DELETE PAYMENT METHOD
============================================================ */

async function deletePaymentMethod(
  body: PaymentMethodPayload,
): Promise<HandlerResponse> {
  const id = parseString(body.id, "id");

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);

  if (existing.length === 0) {
    return errorResponse("Payment method not found.", 404);
  }

  const deleted = await db
    .delete(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .returning();

  return successResponse({
    paymentMethod: deleted[0],
  });
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const admin = await getAuthenticatedAdmin(event);

    if (!admin) {
      return errorResponse("Unauthorized. Admin access is required.", 401);
    }

    /* --------------------------------------------------------
       GET
    -------------------------------------------------------- */

    if (event.httpMethod === "GET") {
      return await getPaymentMethods();
    }

    /* --------------------------------------------------------
       POST
    -------------------------------------------------------- */

    if (event.httpMethod === "POST") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await createPaymentMethod(body);
    }

    /* --------------------------------------------------------
       PUT
    -------------------------------------------------------- */

    if (event.httpMethod === "PUT") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await updatePaymentMethod(body);
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    if (event.httpMethod === "DELETE") {
      const body = parseBody<PaymentMethodPayload>(event);

      return await deletePaymentMethod(body);
    }

    return errorResponse("Method not allowed.", 405);
  } catch (error) {
    console.error("Payment methods API error:", error);

    return errorResponse(
      error instanceof Error ? error.message : "Internal server error.",
      500,
    );
  }
};
