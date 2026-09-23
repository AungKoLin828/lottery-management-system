import type { Handler, HandlerEvent } from "@netlify/functions";

import { eq } from "drizzle-orm";

import { supportTickets } from ".../../../db/schema/supportTickets";

import { db } from "../../utils/db";

import { jsonResponse } from "../../utils/auth";

import { requireAdmin } from "./helpers";

type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

const VALID_PRIORITIES: SupportTicketPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

interface PriorityRequest {
  priority?: unknown;
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "PATCH") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed",
      },
      {
        Allow: "PATCH",
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

  let body: PriorityRequest;

  try {
    if (!event.body) {
      return jsonResponse(400, {
        success: false,
        message: "Request body is required",
      });
    }

    body = JSON.parse(event.body) as PriorityRequest;
  } catch {
    return jsonResponse(400, {
      success: false,
      message: "Invalid JSON request",
    });
  }

  const priority =
    typeof body.priority === "string" ? body.priority.trim().toUpperCase() : "";

  if (!VALID_PRIORITIES.includes(priority as SupportTicketPriority)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid ticket priority",
    });
  }

  try {
    const updated = await db
      .update(supportTickets)
      .set({
        priority: priority as SupportTicketPriority,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId))
      .returning({
        id: supportTickets.id,
        status: supportTickets.status,
        priority: supportTickets.priority,
        updatedAt: supportTickets.updatedAt,
      });

    const ticket = updated[0];

    if (!ticket) {
      return jsonResponse(404, {
        success: false,
        message: "Support ticket not found",
      });
    }

    return jsonResponse(200, {
      success: true,
      ticket,
      message: "Ticket priority updated successfully.",
    });
  } catch (error) {
    console.error("[Admin Support] Failed to update priority:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to update ticket priority.",
    });
  }
};

export { handler };
