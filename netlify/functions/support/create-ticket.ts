// netlify/functions/support/create-ticket.ts

import type { Handler, HandlerEvent } from "@netlify/functions";

import {
  supportTickets,
  supportTicketMessages,
} from ".../../../db/schema/supportTickets";

import { db } from "../utils/db";

import {
  getAuthTokenFromCookie,
  verifyToken,
  jsonResponse,
} from "../utils/auth";

/* ============================================================
   REQUEST BODY
============================================================ */

interface CreateTicketRequest {
  subject?: unknown;
  message?: unknown;
}

/* ============================================================
   HANDLER
============================================================ */

const handler: Handler = async (event: HandlerEvent) => {
  /* ==========================================================
     METHOD
  ========================================================== */

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

  /* ==========================================================
     AUTHENTICATION
  ========================================================== */

  let userId: string;

  try {
    const token = getAuthTokenFromCookie(event);

    if (!token) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    const payload = await verifyToken(token);

    if (!payload.userId) {
      return jsonResponse(401, {
        success: false,
        message: "Authentication required",
      });
    }

    userId = payload.userId;
  } catch (error) {
    console.warn(
      "[Support] Authentication failed:",
      error instanceof Error ? error.message : error,
    );

    return jsonResponse(401, {
      success: false,
      message: "Authentication required",
    });
  }

  /* ==========================================================
     REQUEST BODY
  ========================================================== */

  let body: CreateTicketRequest;

  try {
    if (!event.body) {
      return jsonResponse(400, {
        success: false,
        message: "Request body is required",
      });
    }

    body = JSON.parse(event.body) as CreateTicketRequest;
  } catch {
    return jsonResponse(400, {
      success: false,
      message: "Invalid JSON request",
    });
  }

  /* ==========================================================
     SUBJECT
  ========================================================== */

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (subject.length > 200) {
    return jsonResponse(400, {
      success: false,
      message: "Subject must not exceed 200 characters",
    });
  }

  /* ==========================================================
     MESSAGE
  ========================================================== */

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
      message: "Message is too long",
    });
  }

  /* ==========================================================
     CREATE TICKET
  ========================================================== */

  try {
    const result = await db.transaction(async (tx) => {
      /* ------------------------------------------------------
           CREATE TICKET
        ------------------------------------------------------ */

      const insertedTickets = await tx
        .insert(supportTickets)
        .values({
          userId,
          subject: subject || "Customer Support Request",
          status: "OPEN",
          priority: "NORMAL",
        })
        .returning({
          id: supportTickets.id,
        });

      const ticket = insertedTickets[0];

      if (!ticket) {
        throw new Error("Failed to create support ticket");
      }

      /* ------------------------------------------------------
           CREATE FIRST MESSAGE
        ------------------------------------------------------ */

      await tx.insert(supportTicketMessages).values({
        ticketId: ticket.id,
        senderType: "PLAYER",
        message,
      });

      return ticket;
    });

    /* ========================================================
       SUCCESS
    ======================================================== */

    return jsonResponse(201, {
      success: true,
      ticketId: result.id,
      message: "Your support ticket has been created successfully.",
    });
  } catch (error) {
    console.error("[Support] Failed to create ticket:", error);

    return jsonResponse(500, {
      success: false,
      message: "Unable to create support ticket. Please try again later.",
    });
  }
};

/* ============================================================
   EXPORT
============================================================ */

export { handler };
