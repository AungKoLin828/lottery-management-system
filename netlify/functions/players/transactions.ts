import type { Handler } from "@netlify/functions";

import { desc, eq } from "drizzle-orm";

import { db } from "../utils/db";

import { getCookie, jsonResponse, verifyToken } from "../utils/auth";

import { users } from "../../../db/schema/users";
import { transactions } from "../../../db/schema/transactions";

/* ============================================================
   TYPES
============================================================ */

type TransactionType =
  | "Deposit"
  | "Withdraw"
  | "Bet"
  | "Win"
  | "Adjustment"
  | "Refund";

type TransactionStatus = "Completed" | "Pending" | "Failed";

/* ============================================================
   DATE
============================================================ */

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Yangon",
  })
    .format(date)
    .replace(",", " ·");
}

/* ============================================================
   TRANSACTION TYPE
============================================================ */

function normalizeTransactionType(value: unknown): TransactionType {
  const type = String(value ?? "")
    .trim()
    .toUpperCase();

  switch (type) {
    case "DEPOSIT":
      return "Deposit";

    case "WITHDRAW":
      return "Withdraw";

    case "BET":
      return "Bet";

    case "WIN":
      return "Win";

    case "ADJUSTMENT":
      return "Adjustment";

    case "REFUND":
      return "Refund";

    default:
      return "Adjustment";
  }
}

/* ============================================================
   TRANSACTION STATUS
============================================================ */

function normalizeTransactionStatus(value: unknown): TransactionStatus {
  const status = String(value ?? "")
    .trim()
    .toUpperCase();

  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "PENDING":
      return "Pending";

    case "REJECTED":
    case "CANCELLED":
      return "Failed";

    default:
      return "Pending";
  }
}

/* ============================================================
   PAYMENT METHOD
============================================================ */

/*
 * Your transactions table stores:
 *
 * paymentMethodId
 *
 * NOT:
 *
 * paymentMethod
 *
 * Until we join paymentMethods using its exact schema,
 * return the ID as a safe fallback.
 */
function formatPaymentMethod(
  paymentMethodId: string | null | undefined,
): string {
  if (!paymentMethodId) {
    return "Wallet";
  }

  return String(paymentMethodId);
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    /* ========================================================
       METHOD
    ======================================================== */

    if (event.httpMethod !== "GET") {
      return jsonResponse(
        405,
        {
          success: false,
          message: "Method not allowed",
        },
        {
          Allow: "GET",
        },
      );
    }

    /* ========================================================
       AUTH COOKIE
    ======================================================== */

    const token = getCookie(event, "lottery_auth");

    if (!token) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    /* ========================================================
       VERIFY TOKEN
    ======================================================== */

    let authPayload: {
      userId: string;
      role: "ADMIN" | "PLAYER";
    };

    try {
      authPayload = await verifyToken(token);
    } catch {
      return jsonResponse(401, {
        success: false,
        message: "Invalid or expired authentication",
      });
    }

    /* ========================================================
       PLAYER ONLY
    ======================================================== */

    if (authPayload.role !== "PLAYER") {
      return jsonResponse(403, {
        success: false,
        message: "Player access required",
      });
    }

    /* ========================================================
       USER
    ======================================================== */

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, authPayload.userId))
      .limit(1);

    const user = userRows[0];

    if (!user) {
      return jsonResponse(404, {
        success: false,
        message: "User not found",
      });
    }

    /* ========================================================
       USER STATUS
    ======================================================== */

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,
        message: "Your account is not active",
      });
    }

    /* ========================================================
       LIMIT
    ======================================================== */

    const requestedLimit = Number(event.queryStringParameters?.limit ?? 20);

    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 100)
        : 20;

    /* ========================================================
       TRANSACTIONS
    ======================================================== */

    const transactionRows = await db
      .select({
        id: transactions.id,

        type: transactions.type,

        status: transactions.status,

        amount: transactions.amount,

        paymentMethodId: transactions.paymentMethodId,

        transactionNumber: transactions.transactionNumber,

        referenceNumber: transactions.referenceNumber,

        note: transactions.note,

        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    /* ========================================================
       MAP DATABASE DATA
    ======================================================== */

    const transactionData = transactionRows.map((transaction) => ({
      id: String(transaction.id),

      type: normalizeTransactionType(transaction.type),

      amount: Number(transaction.amount ?? 0),

      /*
       * IMPORTANT:
       *
       * Current schema:
       * paymentMethodId
       *
       * There is no paymentMethod column.
       */
      method: formatPaymentMethod(transaction.paymentMethodId),

      /*
       * IMPORTANT:
       *
       * Current schema:
       * referenceNumber
       *
       * There is no reference column.
       *
       * Prefer referenceNumber.
       * If unavailable, use transactionNumber.
       */
      reference: transaction.referenceNumber
        ? String(transaction.referenceNumber)
        : transaction.transactionNumber
          ? String(transaction.transactionNumber)
          : "-",

      /*
       * Keep transaction number available
       * to the frontend if needed later.
       */
      transactionNumber: transaction.transactionNumber
        ? String(transaction.transactionNumber)
        : null,

      referenceNumber: transaction.referenceNumber
        ? String(transaction.referenceNumber)
        : null,

      note: transaction.note ? String(transaction.note) : null,

      date: formatDate(transaction.createdAt),

      status: normalizeTransactionStatus(transaction.status),
    }));

    /* ========================================================
       RESPONSE
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      transactions: transactionData,

      count: transactionData.length,
    });
  } catch (error) {
    console.error("Player transactions error:", error);

    return jsonResponse(500, {
      success: false,
      message: "Failed to load transactions",
    });
  }
};
