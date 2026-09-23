import type { Handler, HandlerEvent } from "@netlify/functions";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { supportTickets } from ".../../../db/schema/supportTickets";

import { users } from ".../../../db/schema/users";

import { db } from "../../utils/db";

import { jsonResponse } from "../../utils/auth";

import { requireAdmin } from "./helpers";

type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

const VALID_STATUSES: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const VALID_PRIORITIES: SupportTicketPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

const handler: Handler = async (event: HandlerEvent) => {
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

  const admin = await requireAdmin(event);

  if (!admin) {
    return jsonResponse(403, {
      success: false,
      message: "Administrator access required",
    });
  }

  try {
    const statusParam = event.queryStringParameters?.status?.trim() || "";

    const priorityParam = event.queryStringParameters?.priority?.trim() || "";

    const search = event.queryStringParameters?.search?.trim() || "";

    const conditions = [];

    if (
      statusParam &&
      VALID_STATUSES.includes(statusParam as SupportTicketStatus)
    ) {
      conditions.push(
        eq(supportTickets.status, statusParam as SupportTicketStatus),
      );
    }

    if (
      priorityParam &&
      VALID_PRIORITIES.includes(priorityParam as SupportTicketPriority)
    ) {
      conditions.push(
        eq(supportTickets.priority, priorityParam as SupportTicketPriority),
      );
    }

    if (search) {
      const searchPattern = `%${search}%`;

      conditions.push(
        or(
          ilike(supportTickets.subject, searchPattern),
          ilike(users.username, searchPattern),
          ilike(users.fullName, searchPattern),
          ilike(users.phone, searchPattern),
          ilike(supportTickets.id, searchPattern),
        ),
      );
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,

        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          phone: users.phone,
        },
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(supportTickets.updatedAt));

    return jsonResponse(200, {
      success: true,
      tickets: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("[Admin Support] Failed to load tickets:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to load support tickets.",
    });
  }
};

export { handler };
