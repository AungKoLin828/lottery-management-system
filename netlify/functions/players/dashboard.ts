import type { Handler } from "@netlify/functions";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../utils/db";

import {
  getCookie,
  jsonResponse,
  toAuthUser,
  verifyToken,
} from "../utils/auth";

import { users } from "../../../db/schema/users";
import { wallets } from "../../../db/schema/wallets";
import { tickets } from "../../../db/schema/tickets";
import { ticketItems } from "../../../db/schema/ticketItems";
import { lotteryDraws } from "../../../db/schema/lotteryDraws";
import { lotteryResults } from "../../../db/schema/lotteryResults";

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Yangon",
  }).format(date);
}

/* ============================================================
   SESSION HELPER
============================================================ */

function normalizeSession(
  value: string | null | undefined,
): "AM" | "PM" | null {
  if (value === "AM") {
    return "AM";
  }

  if (value === "PM") {
    return "PM";
  }

  return null;
}

/* ============================================================
   NAME MASKING
============================================================ */

function maskPlayerName(fullName: string | null, username: string): string {
  const displayName = fullName?.trim() || username;

  if (!displayName) {
    return "***";
  }

  if (displayName.length <= 3) {
    return displayName;
  }

  return displayName.substring(0, 2) + "***";
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    /* ========================================================
       METHOD
    ======================================================== */

    if (event.httpMethod !== "GET") {
      return jsonResponse(
        405,
        {
          success: false,
          message: "Method not allowed",
        },
        {
          Allow: "GET",
        },
      );
    }

    /* ========================================================
       AUTH COOKIE
    ======================================================== */

    const token = getCookie(event, "lottery_auth");

    if (!token) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    /* ========================================================
       VERIFY TOKEN
    ======================================================== */

    let authPayload: {
      userId: string;
      role: "ADMIN" | "PLAYER";
    };

    try {
      authPayload = await verifyToken(token);
    } catch {
      return jsonResponse(401, {
        success: false,
        message: "Invalid or expired authentication",
      });
    }

    if (authPayload.role !== "PLAYER") {
      return jsonResponse(403, {
        success: false,
        message: "Player access required",
      });
    }

    /* ========================================================
       USER
    ======================================================== */

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, authPayload.userId))
      .limit(1);

    const user = userRows[0];

    if (!user) {
      return jsonResponse(404, {
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,
        message: "Your account is not active",
      });
    }

    /* ========================================================
       WALLET
    ======================================================== */

    const walletRows = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .limit(1);

    const wallet = walletRows[0] ?? null;

    /* ========================================================
       TOTAL TICKETS
    ======================================================== */

    const ticketCountRows = await db
      .select({
        count: sql<number>`
            count(*)::int
          `,
      })
      .from(tickets)
      .where(eq(tickets.userId, user.id));

    const totalTickets = Number(ticketCountRows[0]?.count ?? 0);

    /* ========================================================
       LATEST PUBLISHED DRAW
    ======================================================== */

    const latestDrawRows = await db
      .select({
        drawId: lotteryDraws.id,

        lotteryType: lotteryDraws.lotteryType,

        drawDate: lotteryDraws.drawDate,

        drawTime: lotteryDraws.drawTime,

        session: lotteryDraws.session,

        result: lotteryResults.result,
      })
      .from(lotteryDraws)
      .innerJoin(lotteryResults, eq(lotteryResults.drawId, lotteryDraws.id))
      .where(
        and(
          eq(lotteryDraws.resultPublished, true),

          eq(lotteryDraws.status, "PUBLISHED"),
        ),
      )
      .orderBy(
        desc(lotteryDraws.drawDate),

        desc(lotteryDraws.drawTime),
      )
      .limit(1);

    const latestDrawRow = latestDrawRows[0] ?? null;

    /* ========================================================
       LATEST DRAW
    ======================================================== */

    const latestDraw = latestDrawRow
      ? {
          id: latestDrawRow.drawId,

          type: latestDrawRow.lotteryType,

          number: latestDrawRow.result,

          session: normalizeSession(latestDrawRow.session),

          date: formatDate(latestDrawRow.drawDate),

          time: latestDrawRow.drawTime ?? "",
        }
      : null;

    /* ========================================================
       LATEST WINNERS
    ======================================================== */

    type DashboardWinner = {
      id: string;
      player: string;
      type: "2D" | "3D";
      number: string;
      session: "AM" | "PM" | null;
      date: string;
      prize: number;
    };

    let winners: DashboardWinner[] = [];

    if (latestDrawRow) {
      const winnerRows = await db
        .select({
          itemId: ticketItems.id,

          number: ticketItems.number,

          session: ticketItems.session,

          winAmount: ticketItems.winAmount,

          username: users.username,

          fullName: users.fullName,

          lotteryType: lotteryDraws.lotteryType,

          drawDate: lotteryDraws.drawDate,
        })
        .from(ticketItems)
        .innerJoin(tickets, eq(ticketItems.ticketId, tickets.id))
        .innerJoin(users, eq(tickets.userId, users.id))
        .innerJoin(lotteryDraws, eq(ticketItems.drawId, lotteryDraws.id))
        .where(
          and(
            eq(ticketItems.drawId, latestDrawRow.drawId),

            eq(ticketItems.status, "WON"),

            sql`
                ${ticketItems.winAmount} > 0
              `,
          ),
        )
        .orderBy(desc(ticketItems.winAmount))
        .limit(3);

      /* ======================================================
         MAP DATABASE ROWS
      ====================================================== */

      winners = winnerRows.map(
        (row): DashboardWinner => ({
          id: row.itemId,

          player: maskPlayerName(row.fullName, row.username),

          type: row.lotteryType,

          number: row.number,

          session: normalizeSession(row.session),

          date: formatDate(row.drawDate),

          prize: Number(row.winAmount ?? 0),
        }),
      );
    }

    /* ========================================================
       RESPONSE
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      user: toAuthUser(user),

      stats: {
        walletBalance: Number(wallet?.balance ?? 0),

        totalTickets,

        totalDeposit: Number(wallet?.totalDeposit ?? 0),

        totalWithdraw: Number(wallet?.totalWithdraw ?? 0),
      },

      latestDraw,

      winners,
    });
  } catch (error) {
    console.error("Player dashboard error:", error);

    return jsonResponse(500, {
      success: false,
      message: "Failed to load dashboard",
    });
  }
};
