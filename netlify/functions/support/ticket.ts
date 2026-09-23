import type { Handler, HandlerEvent } from "@netlify/functions";

import { asc, eq } from "drizzle-orm";

import {
  supportTickets,
  supportTicketMessages,
} from ".../../../db/schema/supportTickets";

import { users } from ".../../../db/schema/users";

import { db } from "../utils/db";

import { jsonResponse } from "../utils/auth";

import { requireAdmin } from "./helpers";

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

  const ticketId = event.queryStringParameters?.ticketId?.trim();

  if (!ticketId) {
    return jsonResponse(400, {
      success: false,
      message: "Ticket ID is required",
    });
  }

  try {
    const ticketRows = await db
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
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    const ticket = ticketRows[0];

    if (!ticket) {
      return jsonResponse(404, {
        success: false,
        message: "Support ticket not found",
      });
    }

    const messages = await db
      .select({
        id: supportTicketMessages.id,
        ticketId: supportTicketMessages.ticketId,
        senderType: supportTicketMessages.senderType,
        message: supportTicketMessages.message,
        createdAt: supportTicketMessages.createdAt,
      })
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt));

    return jsonResponse(200, {
      success: true,
      ticket: {
        ...ticket,
        messages,
      },
    });
  } catch (error) {
    console.error("[Admin Support] Failed to load ticket:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to load support ticket.",
    });
  }
};

export { handler };
