import type { Handler, HandlerEvent } from "@netlify/functions";

import { eq } from "drizzle-orm";

import { supportTickets } from ".../../../db/schema/supportTickets";

import { db } from "../utils/db";

import { jsonResponse } from "../utils/auth";

import { requireAdmin } from "./helpers";

type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const VALID_STATUSES: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

interface StatusRequest {
  status?: unknown;
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

  let body: StatusRequest;

  try {
    if (!event.body) {
      return jsonResponse(400, {
        success: false,
        message: "Request body is required",
      });
    }

    body = JSON.parse(event.body) as StatusRequest;
  } catch {
    return jsonResponse(400, {
      success: false,
      message: "Invalid JSON request",
    });
  }

  const status =
    typeof body.status === "string" ? body.status.trim().toUpperCase() : "";

  if (!VALID_STATUSES.includes(status as SupportTicketStatus)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid ticket status",
    });
  }

  try {
    const updated = await db
      .update(supportTickets)
      .set({
        status: status as SupportTicketStatus,
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
      message: "Ticket status updated successfully.",
    });
  } catch (error) {
    console.error("[Admin Support] Failed to update status:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to update ticket status.",
    });
  }
};

export { handler };
