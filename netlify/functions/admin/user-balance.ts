import type { Handler, HandlerEvent } from "@netlify/functions";
import { eq, sql } from "drizzle-orm";

import { db } from "../../../db";
import { users } from "../../../db/schema/users";
import { wallets } from "../../../db/schema/wallets";

interface BalanceRequest {
  amount: number;
  type: "ADD" | "DEDUCT";
  note?: string;
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getUserId(event: HandlerEvent): string | null {
  const value = event.queryStringParameters?.userId;

  if (value) {
    return value;
  }

  const match = event.path.match(/\/admin\/users\/([^/]+)\/balance/);

  return match?.[1] ?? null;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, {
        success: false,
        message: "Method not allowed.",
      });
    }

    const userId = getUserId(event);

    if (!userId) {
      return json(400, {
        success: false,
        message: "User ID is required.",
      });
    }

    let body: BalanceRequest;

    try {
      body = JSON.parse(event.body || "{}") as BalanceRequest;
    } catch {
      return json(400, {
        success: false,
        message: "Invalid JSON request body.",
      });
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return json(400, {
        success: false,
        message: "Amount must be greater than 0.",
      });
    }

    if (!["ADD", "DEDUCT"].includes(body.type)) {
      return json(400, {
        success: false,
        message: "Balance type must be ADD or DEDUCT.",
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return json(404, {
        success: false,
        message: "User not found.",
      });
    }

    /*
     * Do not allow changing an ADMIN wallet through this screen.
     * Remove this check if you want admins to have adjustable wallets.
     */
    if (user.role === "ADMIN") {
      return json(400, {
        success: false,
        message: "Admin balance cannot be changed from User Management.",
      });
    }

    /*
     * Make sure the wallet exists.
     *
     * Your wallets table has one wallet per user because userId is unique.
     */
    const [wallet] = await db
      .select({
        id: wallets.id,
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      return json(404, {
        success: false,
        message: "Wallet not found for this user.",
      });
    }

    /*
     * DEDUCT:
     *
     * Prevent negative wallet balances.
     */
    if (body.type === "DEDUCT") {
      const currentBalance = Number(wallet.balance);

      if (currentBalance < amount) {
        return json(400, {
          success: false,
          message: `Insufficient balance. Current balance is ${currentBalance.toLocaleString()} MMK.`,
        });
      }
    }

    const amountString = amount.toFixed(2);

    /*
     * Update wallet atomically.
     */
    if (body.type === "ADD") {
      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amountString}::numeric`,
          totalDeposit: sql`${wallets.totalDeposit} + ${amountString}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));
    } else {
      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${amountString}::numeric`,
          totalWithdraw: sql`${wallets.totalWithdraw} + ${amountString}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));
    }

    const [updatedWallet] = await db
      .select({
        balance: wallets.balance,
        totalDeposit: wallets.totalDeposit,
        totalWithdraw: wallets.totalWithdraw,
        totalBet: wallets.totalBet,
        totalWin: wallets.totalWin,
      })
      .from(wallets)
      .where(eq(wallets.id, wallet.id))
      .limit(1);

    return json(200, {
      success: true,
      message:
        body.type === "ADD"
          ? "Balance added successfully."
          : "Balance deducted successfully.",
      data: {
        userId: user.id,
        username: user.username,
        type: body.type,
        amount,
        note: body.note?.trim() || null,
        wallet: updatedWallet,
      },
    });
  } catch (error) {
    console.error("Admin balance error:", error);

    return json(500, {
      success: false,
      message: "Failed to update user balance.",
    });
  }
};
