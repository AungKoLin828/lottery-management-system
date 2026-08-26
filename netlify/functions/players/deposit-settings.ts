import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

import { asc, eq } from "drizzle-orm";

import { db } from "../utils/db";
import { paymentMethods } from "../../../db/schema/paymentMethods";

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_DEPOSIT_SETTINGS = {
  minimumDeposit: 1000,

  maximumDeposit: 1000000,

  processingTime: "5-15 minutes",

  depositNote: "Please make sure your transaction number is correct.",

  allowedPaymentMethods: [] as string[],
};

/* ============================================================
   JSON RESPONSE
============================================================ */

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,

    headers: {
      "Content-Type": "application/json; charset=utf-8",

      "Cache-Control": "no-store, no-cache, must-revalidate",

      Pragma: "no-cache",
    },

    body: JSON.stringify(body),
  };
}

/* ============================================================
   MAIN HANDLER
============================================================ */

const handler: Handler = async (
  _event: HandlerEvent,
  _context: HandlerContext,
) => {
  try {
    /* ========================================================
       LOAD ENABLED PAYMENT METHODS
    ======================================================== */

    const rows = await db
      .select({
        id: paymentMethods.id,

        type: paymentMethods.type,

        enabled: paymentMethods.enabled,

        displayOrder: paymentMethods.displayOrder,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.enabled, true))
      .orderBy(asc(paymentMethods.displayOrder));

    /* ========================================================
       DETERMINE DEPOSIT PAYMENT METHODS
    ======================================================== */

    const allowedPaymentMethods = rows
      .filter((method) => {
        /*
         * Convert the database enum value to string before
         * comparing it with the application values.
         *
         * This avoids the TypeScript enum incompatibility
         * caused by the Drizzle schema type.
         */

        const methodType = String(method.type);

        return (
          method.enabled === true &&
          (methodType === "Deposit" || methodType === "Both")
        );
      })
      .map((method) => String(method.id));

    /* ========================================================
       BUILD SETTINGS
    ======================================================== */

    const settings = {
      minimumDeposit: DEFAULT_DEPOSIT_SETTINGS.minimumDeposit,

      maximumDeposit: DEFAULT_DEPOSIT_SETTINGS.maximumDeposit,

      processingTime: DEFAULT_DEPOSIT_SETTINGS.processingTime,

      depositNote: DEFAULT_DEPOSIT_SETTINGS.depositNote,

      allowedPaymentMethods,
    };

    /* ========================================================
       SUCCESS
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Player deposit settings API error:", error);

    /* ========================================================
       FALLBACK
    ======================================================== */

    return jsonResponse(200, {
      success: true,

      data: {
        settings: {
          ...DEFAULT_DEPOSIT_SETTINGS,
        },
      },
    });
  }
};

/* ============================================================
   EXPORT
============================================================ */

export { handler };
