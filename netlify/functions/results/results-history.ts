import type { Handler } from "@netlify/functions";
import { and, asc, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { lotteryDraws } from "../../../db/schema/lotteryDraws";
import { lotteryResults } from "../../../db/schema/lotteryResults";
import { db } from "../utils/db";

type ResultType = "2D" | "3D";

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30, s-maxage=60",
    },
    body: JSON.stringify(body),
  };
}

function normalizeSession(
  session: string | null | undefined,
): "Morning" | "Evening" | null {
  if (session === "AM") {
    return "Morning";
  }

  if (session === "PM") {
    return "Evening";
  }

  return null;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").slice(0, 10);
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return jsonResponse(405, {
        success: false,
        message: "Method not allowed",
      });
    }

    const params = event.queryStringParameters ?? {};

    const type =
      params.type === "3D" ? ("3D" as ResultType) : ("2D" as ResultType);

    const search = params.search?.trim() ?? "";
    const fromDate = params.fromDate?.trim() ?? "";
    const toDate = params.toDate?.trim() ?? "";
    const session = params.session?.trim() ?? "All";

    const conditions = [
      eq(lotteryDraws.lotteryType, type),
      eq(lotteryDraws.resultPublished, true),
      eq(lotteryDraws.status, "PUBLISHED"),
    ];

    if (fromDate) {
      conditions.push(gte(lotteryDraws.drawDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(lotteryDraws.drawDate, toDate));
    }

    if (type === "2D" && (session === "Morning" || session === "Evening")) {
      conditions.push(
        eq(lotteryDraws.session, session === "Morning" ? "AM" : "PM"),
      );
    }

    const searchCondition = search
      ? or(
          ilike(lotteryResults.result, `%${search}%`),
          ilike(lotteryResults.note, `%${search}%`),
        )
      : undefined;

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const rows = await db
      .select({
        id: lotteryResults.id,
        drawId: lotteryResults.drawId,
        date: lotteryDraws.drawDate,
        session: lotteryDraws.session,
        result: lotteryResults.result,
        note: lotteryResults.note,
        status: lotteryDraws.status,
        publishedAt: lotteryResults.publishedAt,
      })
      .from(lotteryResults)
      .innerJoin(lotteryDraws, eq(lotteryResults.drawId, lotteryDraws.id))
      .where(and(...conditions))
      .orderBy(
        desc(lotteryDraws.drawDate),
        asc(lotteryDraws.session),
        desc(lotteryDraws.drawTime),
      );

    const data = rows.map((row) => ({
      id: row.id,
      drawId: row.drawId,
      date: normalizeDate(row.date),
      session: type === "2D" ? normalizeSession(row.session) : null,
      result: row.result,
      note: row.note ?? null,
      status: row.status === "PUBLISHED" ? "Published" : "Pending",
      publishedAt: row.publishedAt,
    }));

    return jsonResponse(200, {
      success: true,
      data,
    });
  } catch (error) {
    console.error("Results history API error:", error);

    return jsonResponse(500, {
      success: false,
      message: "Failed to load lottery results",
    });
  }
};
