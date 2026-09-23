import type { Handler, HandlerEvent } from "@netlify/functions";

import { eq } from "drizzle-orm";

import {
  supportTickets,
  supportTicketMessages,
} from ".../../../db/schema/supportTickets";

import { db } from "../utils/db";

import { jsonResponse } from "../utils/auth";

import { requireAdmin } from "./helpers";

interface ReplyRequest {
  message?: unknown;
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed",
      },
      {
        Allow: "POST",
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

  let body: ReplyRequest;

  try {
    if (!event.body) {
      return jsonResponse(400, {
        success: false,
        message: "Request body is required",
      });
    }

    body = JSON.parse(event.body) as ReplyRequest;
  } catch {
    return jsonResponse(400, {
      success: false,
      message: "Invalid JSON request",
    });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return jsonResponse(400, {
      success: false,
      message: "Message is required",
    });
  }

  if (message.length > 5000) {
    return jsonResponse(400, {
      success: false,
      message: "Message must not exceed 5000 characters",
    });
  }

  try {
    const existingTicket = await db
      .select({
        id: supportTickets.id,
        status: supportTickets.status,
      })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    const ticket = existingTicket[0];

    if (!ticket) {
      return jsonResponse(404, {
        success: false,
        message: "Support ticket not found",
      });
    }

    if (ticket.status === "CLOSED") {
      return jsonResponse(400, {
        success: false,
        message: "Closed tickets cannot receive new replies",
      });
    }

    const result = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(supportTicketMessages)
        .values({
          ticketId,
          senderType: "ADMIN",
          message,
        })
        .returning({
          id: supportTicketMessages.id,
          ticketId: supportTicketMessages.ticketId,
          senderType: supportTicketMessages.senderType,
          message: supportTicketMessages.message,
          createdAt: supportTicketMessages.createdAt,
        });

      await tx
        .update(supportTickets)
        .set({
          updatedAt: new Date(),
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
        })
        .where(eq(supportTickets.id, ticketId));

      return inserted[0];
    });

    return jsonResponse(201, {
      success: true,
      ticketMessage: result,
      message: "Reply sent successfully.",
    });
  } catch (error) {
    console.error("[Admin Support] Failed to send reply:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to send reply.",
    });
  }
};

export { handler };
