import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";

import { db } from "../utils/db";

import { deposits } from "../../../db/schema/deposits";

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
    //
    // verifyToken() returns the authenticated user information.
    //
    // Expected structure:
    //
    // {
    //   userId: string;
    //   role: "ADMIN" | "PLAYER";
    // }
    //
    // Therefore use:
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
    // 5. PARSE REQUEST BODY
    // ---------------------------------------------------------
    let body: {
      depositId?: string;
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
    // 6. VALIDATE DEPOSIT ID
    // ---------------------------------------------------------
    const depositId =
      typeof body.depositId === "string" ? body.depositId.trim() : "";

    if (!depositId) {
      return json(400, {
        success: false,
        message: "depositId is required",
      });
    }

    // ---------------------------------------------------------
    // 7. GET REJECTION REASON
    // ---------------------------------------------------------
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    // ---------------------------------------------------------
    // 8. FIND DEPOSIT
    // ---------------------------------------------------------
    const depositRows = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, depositId))
      .limit(1);

    const deposit = depositRows[0];

    // ---------------------------------------------------------
    // 9. DEPOSIT NOT FOUND
    // ---------------------------------------------------------
    if (!deposit) {
      return json(404, {
        success: false,
        message: "Deposit not found",
      });
    }

    // ---------------------------------------------------------
    // 10. CHECK CURRENT STATUS
    // ---------------------------------------------------------
    if (deposit.status !== "PENDING") {
      return json(409, {
        success: false,
        message: "Deposit has already been processed",
      });
    }

    // ---------------------------------------------------------
    // 11. UPDATE DEPOSIT
    // ---------------------------------------------------------
    //
    // Your actual deposits schema contains:
    //
    // status
    // rejectionReason
    // updatedAt
    //
    // It does NOT contain:
    //
    // rejectedBy
    // rejectedAt
    //
    // Therefore those fields must NOT be included here.
    //
    // approvedBy / approvedAt are only used when approving
    // the deposit.
    // ---------------------------------------------------------
    const now = new Date();

    await db
      .update(deposits)
      .set({
        status: "REJECTED",
        rejectionReason: reason || null,
        updatedAt: now,
      })
      .where(eq(deposits.id, depositId));

    // ---------------------------------------------------------
    // 12. SUCCESS RESPONSE
    // ---------------------------------------------------------
    return json(200, {
      success: true,
      message: "Deposit rejected successfully",
      data: {
        depositId: deposit.id,
        userId: deposit.userId,
        status: "REJECTED",
        rejectionReason: reason || null,
      },
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 13. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin deposit rejection error:", error);

    // ---------------------------------------------------------
    // 14. GENERAL ERROR
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to reject deposit",
    });
  }
};
