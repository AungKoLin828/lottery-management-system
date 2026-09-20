import type { Handler } from "@netlify/functions";
import { desc, eq } from "drizzle-orm";

import { db } from "../utils/db";

import { transactions } from "../../../db/schema/transactions";
import { users } from "../../../db/schema/users";
import { paymentMethods } from "../../../db/schema/paymentMethods";

import { getAuthTokenFromCookie, verifyToken } from "../utils/auth";

/**
 * Standard JSON response helper
 */
function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

/**
 * Get query-string parameter
 */
function getQueryParam(event: Parameters<Handler>[0], name: string) {
  const value = event.queryStringParameters?.[name];

  return value?.trim() || undefined;
}

export const handler: Handler = async (event) => {
  try {
    // ---------------------------------------------------------
    // 1. HTTP METHOD
    // ---------------------------------------------------------
    if (event.httpMethod !== "GET") {
      return json(405, {
        success: false,
        message: "Method not allowed",
      });
    }

    // ---------------------------------------------------------
    // 2. GET AUTH TOKEN
    // ---------------------------------------------------------
    const token = getAuthTokenFromCookie(event);

    if (!token) {
      return json(401, {
        success: false,
        message: "Authentication required",
      });
    }

    // ---------------------------------------------------------
    // 3. VERIFY JWT
    // ---------------------------------------------------------
    //
    // verifyToken() returns:
    //
    // {
    //   userId: string;
    //   role: "ADMIN" | "PLAYER";
    // }
    //
    // We only need the role here.
    // ---------------------------------------------------------
    const authUser = await verifyToken(token);

    if (!authUser) {
      return json(401, {
        success: false,
        message: "Invalid or expired authentication",
      });
    }

    // ---------------------------------------------------------
    // 4. ADMIN CHECK
    // ---------------------------------------------------------
    if (authUser.role !== "ADMIN") {
      return json(403, {
        success: false,
        message: "Admin access required",
      });
    }

    // ---------------------------------------------------------
    // 5. LIMIT
    // ---------------------------------------------------------
    const limitParam = getQueryParam(event, "limit");

    const parsedLimit = limitParam ? Number(limitParam) : 100;

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 200)
      : 100;

    // ---------------------------------------------------------
    // 6. LOAD TRANSACTIONS
    // ---------------------------------------------------------
    //
    // Current transactions schema:
    //
    // id
    // userId
    // type
    // status
    // amount
    // balanceBefore
    // balanceAfter
    // paymentMethodId
    // transactionNumber
    // referenceNumber
    // note
    // createdBy
    // createdAt
    //
    // There is NO:
    //
    // walletId
    // referenceId
    // description
    // ---------------------------------------------------------
    const rows = await db
      .select({
        // -----------------------------------------------------
        // Transaction
        // -----------------------------------------------------
        id: transactions.id,

        userId: transactions.userId,

        // -----------------------------------------------------
        // Player
        // -----------------------------------------------------
        username: users.username,

        phone: users.phone,

        // -----------------------------------------------------
        // Transaction details
        // -----------------------------------------------------
        type: transactions.type,

        status: transactions.status,

        amount: transactions.amount,

        balanceBefore: transactions.balanceBefore,

        balanceAfter: transactions.balanceAfter,

        // -----------------------------------------------------
        // Payment information
        // -----------------------------------------------------
        paymentMethodId: transactions.paymentMethodId,

        paymentMethodName: paymentMethods.name,

        transactionNumber: transactions.transactionNumber,

        referenceNumber: transactions.referenceNumber,

        // -----------------------------------------------------
        // Note
        // -----------------------------------------------------
        note: transactions.note,

        // -----------------------------------------------------
        // Admin / creator
        // -----------------------------------------------------
        createdBy: transactions.createdBy,

        // -----------------------------------------------------
        // Timestamp
        // -----------------------------------------------------
        createdAt: transactions.createdAt,
      })
      .from(transactions)

      // -------------------------------------------------------
      // Join player
      // -------------------------------------------------------
      .leftJoin(users, eq(transactions.userId, users.id))

      // -------------------------------------------------------
      // Join payment method
      // -------------------------------------------------------
      .leftJoin(
        paymentMethods,
        eq(transactions.paymentMethodId, paymentMethods.id),
      )

      // -------------------------------------------------------
      // Latest transactions first
      // -------------------------------------------------------
      .orderBy(desc(transactions.createdAt))

      // -------------------------------------------------------
      // Limit results
      // -------------------------------------------------------
      .limit(limit);

    // ---------------------------------------------------------
    // 7. SUCCESS RESPONSE
    // ---------------------------------------------------------
    return json(200, {
      success: true,
      data: rows,
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 8. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin transactions error:", error);

    // ---------------------------------------------------------
    // 9. ERROR RESPONSE
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to load transactions",
    });
  }
};
