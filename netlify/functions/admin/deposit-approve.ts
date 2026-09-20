import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";

import { db } from "../utils/db";

import { deposits } from "../../../db/schema/deposits";
import { wallets } from "../../../db/schema/wallets";
import { transactions } from "../../../db/schema/transactions";

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
    // verifyToken() returns:
    // {
    //   userId: string;
    //   role: "ADMIN" | "PLAYER";
    // }
    //
    // Therefore use authUser.userId, NOT authUser.id.
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
    const depositId = body.depositId?.trim();

    if (!depositId) {
      return json(400, {
        success: false,
        message: "depositId is required",
      });
    }

    // ---------------------------------------------------------
    // 7. DATABASE TRANSACTION
    //
    // Deposit approval performs:
    //
    // 1. Find pending deposit
    // 2. Find player's wallet
    // 3. Approve deposit
    // 4. Add amount to wallet balance
    // 5. Add amount to totalDeposit
    // 6. Create DEPOSIT transaction
    //
    // Everything is committed together.
    //
    // No row locking is used.
    // ---------------------------------------------------------
    const result = await db.transaction(async (tx) => {
      // -------------------------------------------------------
      // 7.1 FIND DEPOSIT
      // -------------------------------------------------------
      const depositRows = await tx
        .select()
        .from(deposits)
        .where(eq(deposits.id, depositId))
        .limit(1);

      const deposit = depositRows[0];

      if (!deposit) {
        throw new Error("DEPOSIT_NOT_FOUND");
      }

      // -------------------------------------------------------
      // 7.2 CHECK DEPOSIT STATUS
      // -------------------------------------------------------
      if (deposit.status !== "PENDING") {
        throw new Error("DEPOSIT_ALREADY_PROCESSED");
      }

      // -------------------------------------------------------
      // 7.3 CONVERT DEPOSIT AMOUNT
      // -------------------------------------------------------
      const amount = Number(deposit.requestedAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("INVALID_DEPOSIT_AMOUNT");
      }

      // -------------------------------------------------------
      // 7.4 FIND PLAYER WALLET
      // -------------------------------------------------------
      const walletRows = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, deposit.userId))
        .limit(1);

      const wallet = walletRows[0];

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // -------------------------------------------------------
      // 7.5 CURRENT WALLET VALUES
      // -------------------------------------------------------
      const currentBalance = Number(wallet.balance ?? "0");

      const currentTotalDeposit = Number(wallet.totalDeposit ?? "0");

      // -------------------------------------------------------
      // 7.6 CALCULATE NEW WALLET VALUES
      // -------------------------------------------------------
      const newBalance = currentBalance + amount;

      const newTotalDeposit = currentTotalDeposit + amount;

      const now = new Date();

      // -------------------------------------------------------
      // 7.7 UPDATE DEPOSIT
      // -------------------------------------------------------
      //
      // IMPORTANT:
      // approvedBy references users.id.
      //
      // verifyToken() gives us userId, so:
      //
      // approvedBy: authUser.userId
      //
      // NOT:
      //
      // approvedBy: authUser.id
      //
      await tx
        .update(deposits)
        .set({
          status: "APPROVED",
          approvedAmount: amount.toFixed(2),
          approvedBy: authUser.userId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(deposits.id, depositId));

      // -------------------------------------------------------
      // 7.8 UPDATE WALLET
      // -------------------------------------------------------
      await tx
        .update(wallets)
        .set({
          balance: newBalance.toFixed(2),
          totalDeposit: newTotalDeposit.toFixed(2),
          updatedAt: now,
        })
        .where(eq(wallets.id, wallet.id));

      // -------------------------------------------------------
      // 7.9 CREATE TRANSACTION LEDGER
      // -------------------------------------------------------
      //
      // Your transactions schema contains:
      //
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
      // It does NOT contain walletId,
      // referenceId, or description.
      //
      await tx.insert(transactions).values({
        userId: deposit.userId,

        type: "DEPOSIT",

        status: "COMPLETED",

        amount: amount.toFixed(2),

        balanceBefore: currentBalance.toFixed(2),

        balanceAfter: newBalance.toFixed(2),

        paymentMethodId: deposit.paymentMethodId,

        transactionNumber: deposit.transactionNumber,

        referenceNumber: deposit.id,

        note: `Deposit approved: ${deposit.id}`,

        // verifyToken() returns userId
        // NOT id.
        createdBy: authUser.userId,

        createdAt: now,
      });

      // -------------------------------------------------------
      // 7.10 RETURN RESULT
      // -------------------------------------------------------
      return {
        depositId: deposit.id,

        userId: deposit.userId,

        amount,

        balanceBefore: currentBalance,

        balanceAfter: newBalance,

        status: "APPROVED",
      };
    });

    // ---------------------------------------------------------
    // 8. SUCCESS RESPONSE
    // ---------------------------------------------------------
    return json(200, {
      success: true,
      message: "Deposit approved successfully",
      data: result,
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 9. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin deposit approval error:", error);

    // ---------------------------------------------------------
    // 10. DEPOSIT NOT FOUND
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "DEPOSIT_NOT_FOUND") {
      return json(404, {
        success: false,
        message: "Deposit not found",
      });
    }

    // ---------------------------------------------------------
    // 11. ALREADY PROCESSED
    // ---------------------------------------------------------
    if (
      error instanceof Error &&
      error.message === "DEPOSIT_ALREADY_PROCESSED"
    ) {
      return json(409, {
        success: false,
        message: "Deposit has already been processed",
      });
    }

    // ---------------------------------------------------------
    // 12. INVALID AMOUNT
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "INVALID_DEPOSIT_AMOUNT") {
      return json(400, {
        success: false,
        message: "Invalid deposit amount",
      });
    }

    // ---------------------------------------------------------
    // 13. WALLET NOT FOUND
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return json(404, {
        success: false,
        message: "Player wallet not found",
      });
    }

    // ---------------------------------------------------------
    // 14. GENERAL ERROR
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to approve deposit",
    });
  }
};
