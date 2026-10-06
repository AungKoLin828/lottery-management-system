/*
 * ============================================================
 * PLAYER SUPPORT CHAT
 * ============================================================
 *
 * POST /api/support/chat
 *
 * Flow:
 *
 * PLAYER
 *   ↓
 * this endpoint
 *   ↓
 * existing /ai/support handler
 *   ↓
 * OpenRouter
 *   ↓
 * training fallback
 *   ↓
 * human fallback
 *   ↓
 * persist conversation
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  handler as aiSupportHandler,
} from "../ai/support";

import {
  authenticate,
  getNumericUserId,
  json,
  parseJsonBody,
  requireMethod,
} from "./helpers";

import {
  getOrCreateConversation,
  addMessage,
  updateConversationStatus,
} from "./db";

/* ============================================================
   TYPES
============================================================ */

interface ChatBody {
  message?: unknown;
}

interface AIResult {
  success?: boolean;
  message?: string;
  source?:
    | "OPENROUTER"
    | "TRAINING"
    | "HUMAN";
  intent?: string | null;
  confidence?: number | null;
  error?: string;
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (
    event: HandlerEvent,
    context: HandlerContext,
  ) => {
    const methodError =
      requireMethod(
        event,
        "POST",
      );

    if (methodError) {
      return methodError;
    }

    try {
      /* ======================================================
         AUTH
      ====================================================== */

      const user =
        await authenticate(
          event,
        );

      const userId =
        getNumericUserId(user);

      /* ======================================================
         BODY
      ====================================================== */

      const body =
        parseJsonBody<ChatBody>(
          event,
        );

      const message =
        typeof body.message ===
        "string"
          ? body.message.trim()
          : "";

      if (!message) {
        return json(
          400,
          {
            success: false,
            error:
              "Support message is required.",
          },
        );
      }

      if (
        message.length > 2000
      ) {
        return json(
          400,
          {
            success: false,
            error:
              "Support message must not exceed 2000 characters.",
          },
        );
      }

      /* ======================================================
         CONVERSATION
      ====================================================== */

      const conversation =
        await getOrCreateConversation(
          userId,
          "en",
        );

      /* ======================================================
         PLAYER MESSAGE
      ====================================================== */

      const playerMessage =
        await addMessage(
          conversation.id,
          "PLAYER",
          userId,
          message,
        );

      /* ======================================================
         CALL EXISTING AI SUPPORT
      ======================================================
       *
       * We reuse your current AI support implementation.
       *
       * This means:
       *
       * OpenRouter
       *   ↓
       * dynamic models
       *   ↓
       * tools
       *   ↓
       * RAG
       *   ↓
       * training fallback
       *   ↓
       * HUMAN fallback
       *
       * remains unchanged.
       */

      const aiEvent: HandlerEvent =
        {
          ...event,

          httpMethod:
            "POST",

          body:
            JSON.stringify({
              message,
            }),

          path:
            "/api/ai/support",
        };

      const aiResponse =
        await aiSupportHandler(
          aiEvent,
          context,
        );

      /* ======================================================
         READ AI RESPONSE
      ====================================================== */

      let aiData: AIResult =
        {};

      try {
        if (
          aiResponse &&
          typeof aiResponse ===
            "object" &&
          "body" in aiResponse &&
          typeof aiResponse.body ===
            "string"
        ) {
          aiData =
            JSON.parse(
              aiResponse.body,
            ) as AIResult;
        }
      } catch (error) {
        console.error(
          "Failed to parse AI support response:",
          error,
        );
      }

      /* ======================================================
         AI HTTP FAILURE
      ====================================================== */

      if (
        !aiResponse ||
        aiResponse.statusCode >= 400
      ) {
        return json(
          aiResponse?.statusCode ||
            500,
          {
            success: false,
            error:
              aiData.message ||
              aiData.error ||
              "Support service is temporarily unavailable.",
          },
        );
      }

      const answer =
        String(
          aiData.message ??
            "",
        ).trim();

      if (!answer) {
        return json(
          500,
          {
            success: false,
            error:
              "Support service returned an empty response.",
          },
        );
      }

      /* ======================================================
         DETERMINE SOURCE
      ====================================================== */

      const source =
        aiData.source ??
        "OPENROUTER";

      const senderType =
        source === "HUMAN"
          ? "SYSTEM"
          : "AI";

      /* ======================================================
         HUMAN ESCALATION
      ====================================================== */

      const escalated =
        source === "HUMAN";

      if (escalated) {
        await updateConversationStatus(
          conversation.id,
          "HUMAN",
        );
      }

      /* ======================================================
         AI / SYSTEM MESSAGE
      ====================================================== */

      const supportMessage =
        await addMessage(
          conversation.id,
          senderType,
          null,
          answer,
          aiData.intent ??
            null,
          typeof aiData.confidence ===
            "number"
            ? aiData.confidence
            : null,
        );

      /* ======================================================
         RESPONSE
      ====================================================== */

      return json(
        200,
        {
          success: true,

          conversation: {
            ...conversation,

            status:
              escalated
                ? "HUMAN"
                : conversation.status,
          },

          message:
            supportMessage,

          escalated,

          intent:
            aiData.intent ??
            null,

          confidence:
            typeof aiData.confidence ===
            "number"
              ? aiData.confidence
              : 0,
        },
      );
    } catch (error) {
      console.error(
        "SUPPORT CHAT ERROR:",
        error,
      );

      const statusCode =
        error &&
        typeof error ===
          "object" &&
        "statusCode" in error
          ? Number(
              (
                error as {
                  statusCode?: unknown;
                }
              ).statusCode,
            )
          : 500;

      return json(
        Number.isInteger(
          statusCode,
        ) &&
          statusCode >= 400 &&
          statusCode <= 599
          ? statusCode
          : 500,
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Support service is temporarily unavailable.",
        },
      );
    }
  };