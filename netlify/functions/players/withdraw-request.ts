import type { Handler } from "@netlify/functions";
import { and, eq, gte, sql } from "drizzle-orm";

import { withdrawals } from "../../../db/schema/withdrawals";

import { wallets } from "../../../db/schema/wallets";

import { paymentMethods } from "../../../db/schema/paymentMethods";

import { db } from "../utils/db";

import {
  getAuthTokenFromCookie,
  verifyToken,
  jsonResponse,
  parseBody,
} from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

interface WithdrawRequestBody {
  amount?: number | string;

  paymentMethodId?: string;

  accountName?: string;

  accountNumber?: string;

  note?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function parseMoney(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function moneyString(value: number): string {
  return value.toFixed(2);
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  /* ==========================================================
     METHOD
  ========================================================== */

  if (event.httpMethod !== "POST") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed.",
      },
      {
        Allow: "POST",
      },
    );
  }

  /* ==========================================================
     AUTHENTICATION
  ========================================================== */

  try {
    const token = getAuthTokenFromCookie(event);

    if (!token) {
      return jsonResponse(401, {
        success: false,
        message: "Please log in first.",
      });
    }

    const auth = await verifyToken(token);

    if (!auth.userId) {
      return jsonResponse(401, {
        success: false,
        message: "Invalid authentication.",
      });
    }

    if (auth.role !== "PLAYER") {
      return jsonResponse(403, {
        success: false,
        message: "Only players can create withdrawal requests.",
      });
    }

    /* ========================================================
       BODY
    ======================================================== */

    let body: WithdrawRequestBody;

    try {
      body = parseBody<WithdrawRequestBody>(event);
    } catch {
      return jsonResponse(400, {
        success: false,
        message: "Invalid request body.",
      });
    }

    /* ========================================================
       AMOUNT
    ======================================================== */

    const amount = parseMoney(body.amount);

    if (amount <= 0) {
      return jsonResponse(400, {
        success: false,
        message: "Please enter a valid withdrawal amount.",
      });
    }

    if (!Number.isSafeInteger(amount)) {
      return jsonResponse(400, {
        success: false,
        message: "Withdrawal amount must be a valid whole MMK amount.",
      });
    }

    /* ========================================================
       PAYMENT METHOD
    ======================================================== */

    const paymentMethodId = String(body.paymentMethodId ?? "").trim();

    if (!paymentMethodId) {
      return jsonResponse(400, {
        success: false,
        message: "Payment method is required.",
      });
    }

    /* ========================================================
       ACCOUNT
    ======================================================== */

    const accountName = String(body.accountName ?? "").trim();

    const accountNumber = String(body.accountNumber ?? "").trim();

    if (!accountName) {
      return jsonResponse(400, {
        success: false,
        message: "Account name is required.",
      });
    }

    if (!accountNumber) {
      return jsonResponse(400, {
        success: false,
        message: "Account number is required.",
      });
    }

    if (accountName.length > 150) {
      return jsonResponse(400, {
        success: false,
        message: "Account name is too long.",
      });
    }

    if (accountNumber.length > 50) {
      return jsonResponse(400, {
        success: false,
        message: "Account number is too long.",
      });
    }

    /* ========================================================
       NOTE
    ======================================================== */

    const note = String(body.note ?? "").trim();

    if (note.length > 1000) {
      return jsonResponse(400, {
        success: false,
        message: "Note must be 1000 characters or less.",
      });
    }

    /* ========================================================
       TRANSACTION
    ======================================================== */

    const result = await db.transaction(async (tx) => {
      /* ======================================================
         PAYMENT METHOD

         IMPORTANT:
         Payment method ID comes from the database.
         Do not trust the player's method name.
      ====================================================== */

      const paymentMethodRows = await tx
        .select({
          id: paymentMethods.id,
          name: paymentMethods.name,
          type: paymentMethods.type,
          enabled: paymentMethods.enabled,
        })
        .from(paymentMethods)
        .where(eq(paymentMethods.id, paymentMethodId))
        .limit(1);

      const paymentMethod = paymentMethodRows[0];

      if (!paymentMethod) {
        throw new Error("Selected payment method was not found.");
      }

      if (!paymentMethod.enabled) {
        throw new Error("Selected payment method is currently unavailable.");
      }

      const methodType = String(paymentMethod.type ?? "").toLowerCase();

      if (methodType !== "withdraw" && methodType !== "both") {
        throw new Error(
          "Selected payment method cannot be used for withdrawals.",
        );
      }

      /* ======================================================
         WALLET
      ====================================================== */

      const walletRows = await tx
        .select({
          id: wallets.id,
          userId: wallets.userId,
          balance: wallets.balance,
        })
        .from(wallets)
        .where(eq(wallets.userId, auth.userId))
        .limit(1);

      const wallet = walletRows[0];

      if (!wallet) {
        throw new Error("Wallet was not found.");
      }

      const balance = Number(wallet.balance);

      if (!Number.isFinite(balance)) {
        throw new Error("Unable to read wallet balance.");
      }

      /*
       * IMPORTANT:
       *
       * Pending withdrawal does NOT deduct wallet balance.
       *
       * Existing admin approval flow deducts the balance
       * only after admin approval.
       */
      if (amount > balance) {
        throw new Error(
          `Insufficient wallet balance. Available balance is ${balance.toLocaleString()} MMK.`,
        );
      }

      /* ======================================================
         FIRST WITHDRAWAL

         Determine from database instead of localStorage.
      ====================================================== */

      const previousWithdrawals = await tx
        .select({
          id: withdrawals.id,
        })
        .from(withdrawals)
        .where(eq(withdrawals.userId, auth.userId))
        .limit(1);

      const isFirstWithdrawal = previousWithdrawals.length === 0;

      /* ======================================================
         PREVENT TOO MANY PENDING REQUESTS

         One active pending withdrawal at a time.
      ====================================================== */

      const pendingRows = await tx
        .select({
          id: withdrawals.id,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, auth.userId),
            eq(withdrawals.status, "PENDING"),
          ),
        )
        .limit(1);

      if (pendingRows.length > 0) {
        throw new Error("You already have a pending withdrawal request.");
      }

      /* ======================================================
         CREATE WITHDRAWAL
      ====================================================== */

      const insertedRows = await tx
        .insert(withdrawals)
        .values({
          userId: auth.userId,

          requestedAmount: moneyString(amount),

          approvedAmount: null,

          fee: "0",

          paymentMethodId: paymentMethod.id,

          accountName,

          accountNumber,

          status: "PENDING",

          note: note || null,

          rejectionReason: null,

          approvedBy: null,

          approvedAt: null,

          processedAt: null,

          transactionNumber: null,

          createdAt: new Date(),

          updatedAt: new Date(),
        })
        .returning({
          id: withdrawals.id,
          userId: withdrawals.userId,
          requestedAmount: withdrawals.requestedAmount,
          fee: withdrawals.fee,
          paymentMethodId: withdrawals.paymentMethodId,
          accountName: withdrawals.accountName,
          accountNumber: withdrawals.accountNumber,
          status: withdrawals.status,
          note: withdrawals.note,
          createdAt: withdrawals.createdAt,
        });

      const withdrawal = insertedRows[0];

      if (!withdrawal) {
        throw new Error("Unable to create withdrawal request.");
      }

      return {
        withdrawal,
        paymentMethod,
        isFirstWithdrawal,
        balance,
      };
    });

    /* ========================================================
       SUCCESS
    ======================================================== */

    return jsonResponse(201, {
      success: true,

      message: "Withdrawal request submitted successfully.",

      withdrawal: {
        id: result.withdrawal.id,

        requestedAmount: Number(result.withdrawal.requestedAmount),

        fee: Number(result.withdrawal.fee),

        paymentMethodId: result.withdrawal.paymentMethodId,

        paymentMethodName: result.paymentMethod.name,

        accountName: result.withdrawal.accountName,

        /*
         * Do not return the complete account number
         * unnecessarily.
         */
        accountNumber: result.withdrawal.accountNumber,

        status: result.withdrawal.status,

        createdAt: result.withdrawal.createdAt,

        isFirstWithdrawal: result.isFirstWithdrawal,
      },
    });
  } catch (error) {
    console.error("[Player Withdraw] Request failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create withdrawal request.";

    return jsonResponse(400, {
      success: false,
      message,
    });
  }
};
