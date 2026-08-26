import type { Handler } from "@netlify/functions";

import { asc, eq } from "drizzle-orm";

import { db } from "../utils/db";
import { paymentMethods } from "../../../db/schema/paymentMethods";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethodType = "Deposit" | "Withdraw" | "Both";

/* ============================================================
   JSON RESPONSE
============================================================ */

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,

    headers: {
      "Content-Type": "application/json; charset=utf-8",

      "Cache-Control": "no-store, no-cache, must-revalidate",

      Pragma: "no-cache",
    },

    body: JSON.stringify(body),
  };
}

/* ============================================================
   NORMALIZE PAYMENT METHOD TYPE
============================================================ */

function normalizeType(value: unknown): PaymentMethodType {
  const type = String(value ?? "").trim();

  switch (type) {
    case "Deposit":
      return "Deposit";

    case "Withdraw":
      return "Withdraw";

    case "Both":
      return "Both";

    default:
      return "Both";
  }
}

/* ============================================================
   NORMALIZE BOOLEAN
============================================================ */

function normalizeEnabled(value: unknown): boolean {
  return value === true;
}

/* ============================================================
   NORMALIZE NUMBER
============================================================ */

function normalizeNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

/* ============================================================
   GET PAYMENT METHODS
============================================================ */

const handler: Handler = async () => {
  try {
    /* ========================================================
       LOAD ENABLED PAYMENT METHODS
    ======================================================== */

    const rows = await db
      .select({
        id: paymentMethods.id,

        name: paymentMethods.name,

        type: paymentMethods.type,

        enabled: paymentMethods.enabled,

        accountName: paymentMethods.accountName,

        accountNumber: paymentMethods.accountNumber,

        bankName: paymentMethods.bankName,

        branch: paymentMethods.branch,

        displayOrder: paymentMethods.displayOrder,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.enabled, true))
      .orderBy(asc(paymentMethods.displayOrder));

    /* ========================================================
       NORMALIZE DATABASE RESULT
    ======================================================== */

    const methods = rows.map((method) => ({
      id: String(method.id),

      name: String(method.name ?? ""),

      type: normalizeType(method.type),

      enabled: normalizeEnabled(method.enabled),

      accountName: String(method.accountName ?? ""),

      accountNumber: String(method.accountNumber ?? ""),

      bankName:
        method.bankName === null || method.bankName === undefined
          ? null
          : String(method.bankName),

      branch:
        method.branch === null || method.branch === undefined
          ? null
          : String(method.branch),

      displayOrder: normalizeNumber(method.displayOrder, 0),
    }));

    /* ========================================================
       SUCCESS RESPONSE
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      data: {
        paymentMethods: methods,
      },
    });
  } catch (error) {
    console.error("Player payment methods API error:", error);

    /* ========================================================
       ERROR RESPONSE
    ======================================================== */

    return jsonResponse(500, {
      success: false,

      message: "Failed to load payment methods.",

      data: {
        paymentMethods: [],
      },
    });
  }
};

/* ============================================================
   EXPORT
============================================================ */

export { handler };
