import type { Handler } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../utils/db";
import { withdrawals } from "../../../db/schema/withdrawals";
import { users } from "../../../db/schema/users";
import { paymentMethods } from "../../../db/schema/paymentMethods";

import { getAuthTokenFromCookie, verifyToken } from "../utils/auth";

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, {
        success: false,
        message: "Method not allowed",
      });
    }

    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

    const token = getAuthTokenFromCookie(event);

    if (!token) {
      return json(401, {
        success: false,
        message: "Authentication required",
      });
    }

    const authUser = await verifyToken(token);

    if (!authUser) {
      return json(401, {
        success: false,
        message: "Invalid or expired authentication",
      });
    }

    if (authUser.role !== "ADMIN") {
      return json(403, {
        success: false,
        message: "Admin access required",
      });
    }

    // --------------------------------------------------
    // Query parameters
    // --------------------------------------------------

    const requestedStatus = event.queryStringParameters?.status || "PENDING";

    const limitValue = Number(event.queryStringParameters?.limit || "50");

    const limit = Math.min(
      Math.max(Number.isFinite(limitValue) ? limitValue : 50, 1),
      100,
    );

    // --------------------------------------------------
    // Build conditions
    // --------------------------------------------------

    const conditions = [];

    if (requestedStatus !== "ALL") {
      const status = requestedStatus as WithdrawalStatus;

      conditions.push(eq(withdrawals.status, status));
    }

    // --------------------------------------------------
    // Load withdrawals
    // --------------------------------------------------

    const rows = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,

        username: users.username,
        phone: users.phone,

        requestedAmount: withdrawals.requestedAmount,
        approvedAmount: withdrawals.approvedAmount,

        fee: withdrawals.fee,

        paymentMethodId: withdrawals.paymentMethodId,
        paymentMethodName: paymentMethods.name,

        transactionNumber: withdrawals.transactionNumber,

        note: withdrawals.note,

        status: withdrawals.status,

        approvedBy: withdrawals.approvedBy,
        approvedAt: withdrawals.approvedAt,

        rejectionReason: withdrawals.rejectionReason,

        createdAt: withdrawals.createdAt,
        updatedAt: withdrawals.updatedAt,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .leftJoin(
        paymentMethods,
        eq(withdrawals.paymentMethodId, paymentMethods.id),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(withdrawals.createdAt))
      .limit(limit);

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return json(200, {
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Admin withdrawals error:", error);

    return json(500, {
      success: false,
      message: "Failed to load withdrawals",
    });
  }
};
