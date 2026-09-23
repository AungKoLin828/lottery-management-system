import { desc, eq } from "drizzle-orm";

import { db } from "../utils/db";
import { wallets } from ".../../../db/schema/wallets";
import { deposits } from ".../../../db/schema/deposits";
import { withdrawals } from ".../../../db/schema/withdrawals";
import { transactions } from ".../../../db/schema/transactions";

/* ============================================================
   HELPERS
============================================================ */

function stringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

function dateValue(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/* ============================================================
   WALLET
============================================================ */

export async function getMyWallet(userId: string) {
  const rows = await db
    .select({
      balance: wallets.balance,
      totalDeposit: wallets.totalDeposit,
      totalWithdraw: wallets.totalWithdraw,
      totalBet: wallets.totalBet,
      totalWin: wallets.totalWin,
    })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    return {
      found: false,
    };
  }

  const wallet = rows[0];

  return {
    found: true,
    balance: stringValue(wallet.balance),
    totalDeposit: stringValue(wallet.totalDeposit),
    totalWithdraw: stringValue(wallet.totalWithdraw),
    totalBet: stringValue(wallet.totalBet),
    totalWin: stringValue(wallet.totalWin),
  };
}

/* ============================================================
   LATEST DEPOSIT
============================================================ */

export async function getMyLatestDeposit(userId: string) {
  const rows = await db
    .select({
      id: deposits.id,
      amount: deposits.requestedAmount,
      status: deposits.status,
      createdAt: deposits.createdAt,
    })
    .from(deposits)
    .where(eq(deposits.userId, userId))
    .orderBy(desc(deposits.createdAt))
    .limit(1);

  if (rows.length === 0) {
    return {
      found: false,
    };
  }

  const row = rows[0];

  return {
    found: true,
    deposit: {
      id: stringValue(row.id),
      amount: stringValue(row.amount),
      status: stringValue(row.status),
      createdAt: dateValue(row.createdAt),
    },
  };
}

/* ============================================================
   LATEST WITHDRAWAL
============================================================ */

export async function getMyLatestWithdrawal(userId: string) {
  const rows = await db
    .select({
      id: withdrawals.id,
      amount: withdrawals.requestedAmount,
      status: withdrawals.status,
      createdAt: withdrawals.createdAt,
    })
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(1);

  if (rows.length === 0) {
    return {
      found: false,
    };
  }

  const row = rows[0];

  return {
    found: true,
    withdrawal: {
      id: stringValue(row.id),
      amount: stringValue(row.amount),
      status: stringValue(row.status),
      createdAt: dateValue(row.createdAt),
    },
  };
}

/* ============================================================
   RECENT TRANSACTIONS
============================================================ */

export async function getMyRecentTransactions(userId: string, limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 10);

  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(safeLimit);

  return {
    transactions: rows.map((row) => ({
      id: stringValue(row.id),
      type: stringValue(row.type),
      amount: stringValue(row.amount),
      status: stringValue(row.status),
      createdAt: dateValue(row.createdAt),
    })),
  };
}
