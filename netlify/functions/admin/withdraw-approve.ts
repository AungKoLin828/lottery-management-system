import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";

import { db } from "../utils/db";

import { withdrawals } from "../../../db/schema/withdrawals";
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
    // 7. DATABASE TRANSACTION
    // ---------------------------------------------------------
    //
    // Approval performs:
    //
    // 1. Find withdrawal
    // 2. Verify it is PENDING
    // 3. Calculate withdrawal amount + fee
    // 4. Find player's wallet
    // 5. Check wallet balance
    // 6. Approve withdrawal
    // 7. Deduct wallet balance
    // 8. Update totalWithdraw
    // 9. Create transaction ledger
    //
    // All database changes are performed in one transaction.
    //
    // No row locking is used.
    // ---------------------------------------------------------
    const result = await db.transaction(async (tx) => {
      // -------------------------------------------------------
      // 7.1 FIND WITHDRAWAL
      // -------------------------------------------------------
      const rows = await tx
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, withdrawalId))
        .limit(1);

      const withdrawal = rows[0];

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      // -------------------------------------------------------
      // 7.2 CHECK WITHDRAWAL STATUS
      // -------------------------------------------------------
      if (withdrawal.status !== "PENDING") {
        throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
      }

      // -------------------------------------------------------
      // 7.3 REQUESTED AMOUNT
      // -------------------------------------------------------
      const requestedAmount = Number(withdrawal.requestedAmount);

      // -------------------------------------------------------
      // 7.4 FEE
      // -------------------------------------------------------
      const fee = Number(withdrawal.fee ?? "0");

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error("INVALID_WITHDRAWAL_FEE");
      }

      // -------------------------------------------------------
      // 7.5 APPROVED AMOUNT
      //
      // If approvedAmount is not set yet,
      // use requestedAmount.
      // -------------------------------------------------------
      const amount = Number(
        withdrawal.approvedAmount ?? withdrawal.requestedAmount,
      );

      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        throw new Error("INVALID_WITHDRAWAL_AMOUNT");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("INVALID_WITHDRAWAL_AMOUNT");
      }

      // -------------------------------------------------------
      // 7.6 FIND PLAYER WALLET
      // -------------------------------------------------------
      const walletRows = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, withdrawal.userId))
        .limit(1);

      const wallet = walletRows[0];

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // -------------------------------------------------------
      // 7.7 CURRENT BALANCE
      // -------------------------------------------------------
      const currentBalance = Number(wallet.balance ?? "0");

      if (!Number.isFinite(currentBalance) || currentBalance < 0) {
        throw new Error("INVALID_WALLET_BALANCE");
      }

      // -------------------------------------------------------
      // 7.8 TOTAL DEDUCTION
      //
      // Example:
      //
      // Withdrawal = 10,000
      // Fee        =    500
      // ------------------
      // Deduction  = 10,500
      // -------------------------------------------------------
      const totalDeduction = amount + fee;

      if (!Number.isFinite(totalDeduction) || totalDeduction <= 0) {
        throw new Error("INVALID_WITHDRAWAL_AMOUNT");
      }

      // -------------------------------------------------------
      // 7.9 CHECK BALANCE
      // -------------------------------------------------------
      if (currentBalance < totalDeduction) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // -------------------------------------------------------
      // 7.10 CALCULATE NEW BALANCE
      // -------------------------------------------------------
      const newBalance = currentBalance - totalDeduction;

      // -------------------------------------------------------
      // 7.11 CURRENT TOTAL WITHDRAW
      // -------------------------------------------------------
      const currentTotalWithdraw = Number(wallet.totalWithdraw ?? "0");

      if (!Number.isFinite(currentTotalWithdraw) || currentTotalWithdraw < 0) {
        throw new Error("INVALID_TOTAL_WITHDRAW");
      }

      // -------------------------------------------------------
      // 7.12 NEW TOTAL WITHDRAW
      //
      // totalWithdraw records the actual
      // withdrawal amount, excluding the fee.
      // -------------------------------------------------------
      const newTotalWithdraw = currentTotalWithdraw + amount;

      const now = new Date();

      // -------------------------------------------------------
      // 7.13 UPDATE WITHDRAWAL
      // -------------------------------------------------------
      //
      // Actual withdrawals schema contains:
      //
      // status
      // approvedAmount
      // approvedBy
      // approvedAt
      // updatedAt
      //
      // authUser.userId is used because
      // verifyToken() returns userId.
      // -------------------------------------------------------
      await tx
        .update(withdrawals)
        .set({
          status: "APPROVED",

          approvedAmount: amount.toFixed(2),

          approvedBy: authUser.userId,

          approvedAt: now,

          updatedAt: now,
        })
        .where(eq(withdrawals.id, withdrawalId));

      // -------------------------------------------------------
      // 7.14 UPDATE WALLET
      // -------------------------------------------------------
      await tx
        .update(wallets)
        .set({
          balance: newBalance.toFixed(2),

          totalWithdraw: newTotalWithdraw.toFixed(2),

          updatedAt: now,
        })
        .where(eq(wallets.id, wallet.id));

      // -------------------------------------------------------
      // 7.15 CREATE TRANSACTION LEDGER
      // -------------------------------------------------------
      //
      // Your actual transactions schema uses:
      //
      // type:
      //   "DEPOSIT"
      //   "WITHDRAW"
      //   "BET"
      //   "WIN"
      //   "ADJUSTMENT"
      //   "REFUND"
      //
      // Therefore use "WITHDRAW", NOT "WITHDRAWAL".
      //
      // The transactions table does NOT have:
      //
      // walletId
      // referenceId
      // description
      //
      // Instead it has:
      //
      // paymentMethodId
      // transactionNumber
      // referenceNumber
      // note
      // createdBy
      // -------------------------------------------------------
      await tx.insert(transactions).values({
        userId: withdrawal.userId,

        type: "WITHDRAW",

        status: "COMPLETED",

        // Total amount removed from wallet
        // including fee.
        amount: totalDeduction.toFixed(2),

        balanceBefore: currentBalance.toFixed(2),

        balanceAfter: newBalance.toFixed(2),

        paymentMethodId: withdrawal.paymentMethodId,

        transactionNumber: withdrawal.transactionNumber,

        referenceNumber: withdrawal.id,

        note: `Withdrawal approved: ${withdrawal.id}`,

        createdBy: authUser.userId,

        createdAt: now,
      });

      // -------------------------------------------------------
      // 7.16 RETURN RESULT
      // -------------------------------------------------------
      return {
        withdrawalId: withdrawal.id,

        userId: withdrawal.userId,

        amount,

        fee,

        totalDeduction,

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
      message: "Withdrawal approved successfully",
      data: result,
    });
  } catch (error) {
    // ---------------------------------------------------------
    // 9. ERROR LOG
    // ---------------------------------------------------------
    console.error("Admin withdrawal approval error:", error);

    // ---------------------------------------------------------
    // 10. WITHDRAWAL NOT FOUND
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "WITHDRAWAL_NOT_FOUND") {
      return json(404, {
        success: false,
        message: "Withdrawal not found",
      });
    }

    // ---------------------------------------------------------
    // 11. ALREADY PROCESSED
    // ---------------------------------------------------------
    if (
      error instanceof Error &&
      error.message === "WITHDRAWAL_ALREADY_PROCESSED"
    ) {
      return json(409, {
        success: false,
        message: "Withdrawal has already been processed",
      });
    }

    // ---------------------------------------------------------
    // 12. INVALID AMOUNT
    // ---------------------------------------------------------
    if (
      error instanceof Error &&
      error.message === "INVALID_WITHDRAWAL_AMOUNT"
    ) {
      return json(400, {
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    // ---------------------------------------------------------
    // 13. INVALID FEE
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "INVALID_WITHDRAWAL_FEE") {
      return json(400, {
        success: false,
        message: "Invalid withdrawal fee",
      });
    }

    // ---------------------------------------------------------
    // 14. WALLET NOT FOUND
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return json(404, {
        success: false,
        message: "Player wallet not found",
      });
    }

    // ---------------------------------------------------------
    // 15. INSUFFICIENT BALANCE
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return json(400, {
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // ---------------------------------------------------------
    // 16. INVALID WALLET BALANCE
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "INVALID_WALLET_BALANCE") {
      return json(500, {
        success: false,
        message: "Invalid wallet balance",
      });
    }

    // ---------------------------------------------------------
    // 17. INVALID TOTAL WITHDRAW
    // ---------------------------------------------------------
    if (error instanceof Error && error.message === "INVALID_TOTAL_WITHDRAW") {
      return json(500, {
        success: false,
        message: "Invalid total withdrawal balance",
      });
    }

    // ---------------------------------------------------------
    // 18. GENERAL ERROR
    // ---------------------------------------------------------
    return json(500, {
      success: false,
      message: "Failed to approve withdrawal",
    });
  }
};
