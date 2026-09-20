import type { Handler } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../utils/db";

import { deposits } from "../../../db/schema/deposits";
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
 * Get and clean query-string parameter
 */
function getQueryParam(event: Parameters<Handler>[0], name: string) {
  const value = event.queryStringParameters?.[name];

  return value?.trim() || undefined;
}

/**
 * Deposit status values defined in:
 *
 * db/schema/deposits.ts
 *
 * PENDING
 * APPROVED
 * REJECTED
 * CANCELLED
 */
type DepositStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

function isDepositStatus(value: string): value is DepositStatus {
  return (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "CANCELLED"
  );
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
    // Therefore the authenticated admin ID is:
    //
    // authUser.userId
    //
    // NOT:
    //
    // authUser.id
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
    // 5. STATUS FILTER
    // ---------------------------------------------------------
    //
    // Default:
    //
    // GET /api/admin/deposits
    //
    // returns PENDING deposits.
    //
    // Examples:
    //
    // ?status=PENDING
    // ?status=APPROVED
    // ?status=REJECTED
    // ?status=CANCELLED
    // ?status=ALL
    // ---------------------------------------------------------
    const statusParam = getQueryParam(event, "status") || "PENDING";

    // ---------------------------------------------------------
    // 6. VALIDATE STATUS
    // ---------------------------------------------------------
    if (statusParam !== "ALL" && !isDepositStatus(statusParam)) {
      return json(400, {
        success: false,
        message: "Invalid deposit status",
      });
    }

    // ---------------------------------------------------------
    // 7. LIMIT
    // ---------------------------------------------------------
    const limitParam = getQueryParam(event, "limit");

    const parsedLimit = limitParam ? Number(limitParam) : 50;

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 100)
      : 50;

    // ---------------------------------------------------------
    // 8. BUILD CONDITIONS
    // ---------------------------------------------------------
    const conditions = [];

    if (statusParam !== "ALL" && isDepositStatus(statusParam)) {
      conditions.push(eq(deposits.status, statusParam));
    }

    // ---------------------------------------------------------
    // 9. LOAD DEPOSITS
    // ---------------------------------------------------------
    //
    // Joined information:
    //
    // deposits
    //      ↓
    // users
    //      ↓
    // paymentMethods
    //
    // This allows the admin UI to display:
    //
    // - Player username
    // - Player phone
    // - Deposit amount
    // - Payment method
    // - Transaction number
    // - Status
    // - Approval information
    // - Rejection reason
    // - Created / updated time
    // ---------------------------------------------------------
    const rows = await db
      .select({
        // -----------------------------------------------------
        // Deposit
        // -----------------------------------------------------
        id: deposits.id,
        userId: deposits.userId,

        // -----------------------------------------------------
        // Player
        // -----------------------------------------------------
        username: users.username,
        phone: users.phone,

        // -----------------------------------------------------
        // Amount
        // -----------------------------------------------------
        requestedAmount: deposits.requestedAmount,

        approvedAmount: deposits.approvedAmount,

        // -----------------------------------------------------
        // Payment method
        // -----------------------------------------------------
        paymentMethodId: deposits.paymentMethodId,

        paymentMethodName: paymentMethods.name,

        // -----------------------------------------------------
        // Deposit information
        // -----------------------------------------------------
        transactionNumber: deposits.transactionNumber,

        note: deposits.note,

        status: deposits.status,

        // -----------------------------------------------------
        // Approval information
        // -----------------------------------------------------
        approvedBy: deposits.approvedBy,

        approvedAt: deposits.approvedAt,

        // -----------------------------------------------------
        // Rejection information
        //
        // IMPORTANT:
        // Your current deposits schema has:
        //
        // rejectionReason
        //
        // but does NOT have:
        //
        // rejectedBy
        // rejectedAt
        // -----------------------------------------------------
        rejectionReason: deposits.rejectionReason,

        // -----------------------------------------------------
        // Timestamps
        // -----------------------------------------------------
        createdAt: deposits.createdAt,

        updatedAt: deposits.updatedAt,
      })
      .from(deposits)

      // -------------------------------------------------------
      // Join player
      // -------------------------------------------------------
      .leftJoin(users, eq(deposits.userId, users.id))

      // -------------------------------------------------------
      // Join payment method
      // -------------------------------------------------------
      .leftJoin(paymentMethods, eq(deposits.paymentMethodId, paymentMethods.id))

      // -------------------------------------------------------
      // Apply status condition
      // -------------------------------------------------------
      .where(conditions.length ? and(...conditions) : undefined)

      // -------------------------------------------------------
      // Latest deposits first
      // -------------------------------------------------------
      .orderBy(desc(deposits.createdAt))

      // -------------------------------------------------------
      // Limit result
      // -------------------------------------------------------
      .limit(limit);

    // ---------------------------------------------------------
    // 10. SUCCESS RESPONSE
    // ---------------------------------------------------------
    return json(200, {
      success: true,
      data: rows,
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 11. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin deposits error:", error);

    // ---------------------------------------------------------
    // 12. ERROR RESPONSE
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to load deposits",
    });
  }
};
