import type { Handler } from "@netlify/functions";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../utils/db";

import { getCookie, jsonResponse, verifyToken } from "../utils/auth";

import { users } from "../../../db/schema/users";
import { wallets } from "../../../db/schema/wallets";
import { tickets } from "../../../db/schema/tickets";
import { lotteryDraws } from "../../../db/schema/lotteryDraws";
import { lotteryResults } from "../../../db/schema/lotteryResults";

/* ============================================================
   HELPERS
============================================================ */

const AUTH_COOKIE_NAME = "lottery_auth";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Yangon",
  });
}

function formatTime(time: string | null | undefined): string {
  if (!time) {
    return "";
  }

  /*
   * PostgreSQL TIME usually returns:
   *
   * HH:mm:ss
   *
   * Convert it to a readable 12-hour time.
   */
  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

function maskPlayerName(
  fullName: string | null | undefined,
  username: string | null | undefined,
): string {
  const name = fullName?.trim() || username?.trim() || "Player";

  const parts = name.split(/\s+/);

  /*
   * Example:
   *
   * Aung Ko Lin
   * =>
   * Aung K***
   */

  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}***`;
  }

  if (name.length <= 2) {
    return `${name.charAt(0)}***`;
  }

  return `${name.charAt(0)}***`;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  /*
   * ==========================================================
   * METHOD
   * ==========================================================
   */

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

  try {
    /*
     * ========================================================
     * AUTH COOKIE
     * ========================================================
     */

    const token = getCookie(event, AUTH_COOKIE_NAME);

    if (!token) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    /*
     * ========================================================
     * VERIFY JWT
     * ========================================================
     */

    let payload;

    try {
      payload = await verifyToken(token);
    } catch {
      return jsonResponse(401, {
        success: false,
        message: "Invalid or expired authentication",
      });
    }

    /*
     * ========================================================
     * PLAYER ONLY
     * ========================================================
     */

    if (payload.role !== "PLAYER") {
      return jsonResponse(403, {
        success: false,
        message: "Player access required",
      });
    }

    const userId = payload.userId;

    /*
     * ========================================================
     * USER
     * ========================================================
     */

    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return jsonResponse(404, {
        success: false,
        message: "Player account not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return jsonResponse(403, {
        success: false,
        message: "Your account is not active",
      });
    }

    /*
     * ========================================================
     * WALLET
     *
     * One wallet per user.
     * ========================================================
     */

    const walletResult = await db
      .select({
        id: wallets.id,
        balance: wallets.balance,
        totalDeposit: wallets.totalDeposit,
        totalWithdraw: wallets.totalWithdraw,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const wallet = walletResult[0];

    /*
     * If the wallet does not exist yet, don't make the
     * dashboard fail.
     */

    const walletBalance = toNumber(wallet?.balance);

    const totalDeposit = toNumber(wallet?.totalDeposit);

    const totalWithdraw = toNumber(wallet?.totalWithdraw);

    /*
     * ========================================================
     * TOTAL TICKETS
     * ========================================================
     */

    const ticketCountResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(tickets)
      .where(eq(tickets.userId, userId));

    const totalTickets = Number(ticketCountResult[0]?.count ?? 0);

    /*
     * ========================================================
     * LATEST PUBLISHED DRAW
     *
     * Join:
     *
     * lottery_draws
     *        +
     * lottery_results
     *
     * Only published results are displayed.
     * ========================================================
     */

    const latestDrawResult = await db
      .select({
        drawId: lotteryDraws.id,

        lotteryType: lotteryDraws.lotteryType,

        drawDate: lotteryDraws.drawDate,

        session: lotteryDraws.session,

        drawTime: lotteryDraws.drawTime,

        status: lotteryDraws.status,

        resultPublished: lotteryDraws.resultPublished,

        result: lotteryResults.result,

        publishedAt: lotteryResults.publishedAt,
      })
      .from(lotteryDraws)
      .innerJoin(lotteryResults, eq(lotteryResults.drawId, lotteryDraws.id))
      .where(
        and(
          eq(lotteryDraws.status, "PUBLISHED"),
          eq(lotteryDraws.resultPublished, true),
        ),
      )
      .orderBy(desc(lotteryDraws.drawDate), desc(lotteryDraws.drawTime))
      .limit(1);

    const latestDraw = latestDrawResult[0] ?? null;

    /*
     * ========================================================
     * LATEST WINNERS
     *
     * Current ticket schema has:
     *
     * - userId
     * - totalWinAmount
     * - status
     * - createdAt
     *
     * It does NOT currently have drawId.
     *
     * Therefore we use WON tickets and display the latest
     * published result as the winning number.
     *
     * When ticketItems/drawId is added later, this can be
     * changed to an exact draw-specific winner query.
     * ========================================================
     */

    let winners: Array<{
      id: string;
      player: string;
      type: "2D" | "3D";
      number: string;
      session: "AM" | "PM" | null;
      date: string;
      prize: number;
    }> = [];

    if (latestDraw) {
      const winnerResult = await db
        .select({
          ticketId: tickets.id,

          playerName: users.fullName,

          username: users.username,

          winAmount: tickets.totalWinAmount,

          createdAt: tickets.createdAt,
        })
        .from(tickets)
        .innerJoin(users, eq(users.id, tickets.userId))
        .where(eq(tickets.status, "WON"))
        .orderBy(desc(tickets.createdAt))
        .limit(3);

      winners = winnerResult.map((winner) => ({
        id: winner.ticketId,

        player: maskPlayerName(winner.playerName, winner.username),

        type: latestDraw.lotteryType,

        number: latestDraw.result,

        session: latestDraw.session,

        date: formatDate(latestDraw.drawDate),

        prize: toNumber(winner.winAmount),
      }));
    }

    /*
     * ========================================================
     * RESPONSE
     * ========================================================
     */

    return jsonResponse(200, {
      success: true,

      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
        },

        stats: {
          walletBalance,
          totalTickets,
          totalDeposit,
          totalWithdraw,
        },

        latestDraw: latestDraw
          ? {
              id: latestDraw.drawId,

              type: latestDraw.lotteryType,

              number: latestDraw.result,

              session: latestDraw.session,

              date: formatDate(latestDraw.drawDate),

              time: formatTime(latestDraw.drawTime),
            }
          : null,

        winners,
      },
    });
  } catch (error) {
    console.error("Player dashboard error:", error);

    return jsonResponse(500, {
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};
