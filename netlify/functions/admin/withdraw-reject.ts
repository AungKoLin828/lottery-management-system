import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";

import { db } from "../utils/db";

import { withdrawals } from "../../../db/schema/withdrawals";

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

export const handler: Handler = async (event) => {
  try {
    // ---------------------------------------------------------
    // 1. HTTP METHOD
    // ---------------------------------------------------------
    if (event.httpMethod !== "POST") {
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
    // Therefore use authUser.userId.
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
    // 5. PARSE REQUEST BODY
    // ---------------------------------------------------------
    let body: {
      withdrawalId?: string;
      reason?: string;
    };

    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return json(400, {
        success: false,
        message: "Invalid JSON request body",
      });
    }

    // ---------------------------------------------------------
    // 6. VALIDATE WITHDRAWAL ID
    // ---------------------------------------------------------
    const withdrawalId =
      typeof body.withdrawalId === "string" ? body.withdrawalId.trim() : "";

    if (!withdrawalId) {
      return json(400, {
        success: false,
        message: "withdrawalId is required",
      });
    }

    // ---------------------------------------------------------
    // 7. GET REJECTION REASON
    // ---------------------------------------------------------
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    // ---------------------------------------------------------
    // 8. FIND WITHDRAWAL
    // ---------------------------------------------------------
    const rows = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, withdrawalId))
      .limit(1);

    const withdrawal = rows[0];

    // ---------------------------------------------------------
    // 9. WITHDRAWAL NOT FOUND
    // ---------------------------------------------------------
    if (!withdrawal) {
      return json(404, {
        success: false,
        message: "Withdrawal not found",
      });
    }

    // ---------------------------------------------------------
    // 10. CHECK CURRENT STATUS
    // ---------------------------------------------------------
    if (withdrawal.status !== "PENDING") {
      return json(409, {
        success: false,
        message: "Withdrawal has already been processed",
      });
    }

    // ---------------------------------------------------------
    // 11. UPDATE WITHDRAWAL
    // ---------------------------------------------------------
    //
    // The current schema uses:
    //
    // status
    // rejectionReason
    // updatedAt
    //
    // It does not use:
    //
    // rejectedBy
    // rejectedAt
    //
    // Therefore those fields are intentionally omitted.
    //
    // Note:
    // authUser.userId is available if you later add
    // a rejectedBy column to the schema.
    // ---------------------------------------------------------
    const now = new Date();

    await db
      .update(withdrawals)
      .set({
        status: "REJECTED",

        rejectionReason: reason || null,

        updatedAt: now,
      })
      .where(eq(withdrawals.id, withdrawalId));

    // ---------------------------------------------------------
    // 12. SUCCESS RESPONSE
    // ---------------------------------------------------------
    return json(200, {
      success: true,
      message: "Withdrawal rejected successfully",
      data: {
        withdrawalId: withdrawal.id,

        userId: withdrawal.userId,

        status: "REJECTED",

        rejectionReason: reason || null,
      },
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 13. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin withdrawal rejection error:", error);

    // ---------------------------------------------------------
    // 14. GENERAL ERROR
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to reject withdrawal",
    });
  }
};
