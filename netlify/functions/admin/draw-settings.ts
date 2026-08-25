import type { Handler } from "@netlify/functions";

import { eq } from "drizzle-orm";

import { drawSettings } from "../../../db/schema/drawSettings";

import { db } from "../utils/db";

import { jsonResponse, parseBody } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type DrawStatus = "Open" | "Closed" | "Suspended";

type DrawSettingsBody = {
  enable2DDraw?: boolean;
  enable3DDraw?: boolean;

  twoDDrawTime?: string;
  threeDDrawTime?: string;

  ticketClosingTime2D?: string;
  ticketClosingTime3D?: string;

  manualResultEntry?: boolean;
  resultPublishing?: boolean;

  drawStatus?: DrawStatus;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_SETTINGS = {
  enable2DDraw: true,
  enable3DDraw: true,

  twoDDrawTime: "16:30",
  threeDDrawTime: "16:30",

  ticketClosingTime2D: "16:00",
  ticketClosingTime3D: "16:00",

  manualResultEntry: true,
  resultPublishing: true,

  drawStatus: "Open" as DrawStatus,
};

/* ============================================================
   RESPONSE
============================================================ */

const response = <T>(statusCode: number, body: ApiResponse<T>) => {
  return jsonResponse(statusCode, body);
};

/* ============================================================
   TIME VALIDATION
============================================================ */

const isValidTime = (value: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);

  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

/* ============================================================
   DRAW STATUS VALIDATION
============================================================ */

const isValidDrawStatus = (value: unknown): value is DrawStatus => {
  return value === "Open" || value === "Closed" || value === "Suspended";
};

/* ============================================================
   GET CURRENT SETTINGS
============================================================ */

const getCurrentSettings = async () => {
  const rows = await db.select().from(drawSettings).limit(1);

  return rows[0] ?? null;
};

/* ============================================================
   CREATE DEFAULT SETTINGS
============================================================ */

const createDefaultSettings = async () => {
  const [settings] = await db
    .insert(drawSettings)
    .values({
      enable2DDraw: DEFAULT_SETTINGS.enable2DDraw,

      enable3DDraw: DEFAULT_SETTINGS.enable3DDraw,

      twoDDrawTime: DEFAULT_SETTINGS.twoDDrawTime,

      threeDDrawTime: DEFAULT_SETTINGS.threeDDrawTime,

      ticketClosingTime2D: DEFAULT_SETTINGS.ticketClosingTime2D,

      ticketClosingTime3D: DEFAULT_SETTINGS.ticketClosingTime3D,

      manualResultEntry: DEFAULT_SETTINGS.manualResultEntry,

      resultPublishing: DEFAULT_SETTINGS.resultPublishing,

      drawStatus: DEFAULT_SETTINGS.drawStatus,
    })
    .returning();

  return settings;
};

/* ============================================================
   GET
   GET /api/admin/draw-settings
============================================================ */

const handleGet = async () => {
  let settings = await getCurrentSettings();

  /*
   * Automatically create the first settings record
   * if the table is empty.
   */

  if (!settings) {
    settings = await createDefaultSettings();
  }

  return response(200, {
    success: true,

    data: {
      settings,
    },
  });
};

/* ============================================================
   PUT
   PUT /api/admin/draw-settings
============================================================ */

const handlePut = async (event: Parameters<Handler>[0]) => {
  const body = await parseBody<DrawSettingsBody>(event);

  /* ----------------------------------------------------------
     BOOLEAN VALIDATION
  ---------------------------------------------------------- */

  const booleanFields: Array<keyof DrawSettingsBody> = [
    "enable2DDraw",
    "enable3DDraw",
    "manualResultEntry",
    "resultPublishing",
  ];

  for (const field of booleanFields) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
      return response(400, {
        success: false,
        message: `${field} must be a boolean.`,
      });
    }
  }

  /* ----------------------------------------------------------
     TIME VALIDATION
  ---------------------------------------------------------- */

  const timeFields: Array<keyof DrawSettingsBody> = [
    "twoDDrawTime",
    "threeDDrawTime",
    "ticketClosingTime2D",
    "ticketClosingTime3D",
  ];

  for (const field of timeFields) {
    const value = body[field];

    if (
      value !== undefined &&
      (typeof value !== "string" || !isValidTime(value))
    ) {
      return response(400, {
        success: false,
        message: `${field} must use HH:MM format.`,
      });
    }
  }

  /* ----------------------------------------------------------
     DRAW STATUS
  ---------------------------------------------------------- */

  if (body.drawStatus !== undefined && !isValidDrawStatus(body.drawStatus)) {
    return response(400, {
      success: false,
      message: "drawStatus must be Open, Closed, or Suspended.",
    });
  }

  /* ----------------------------------------------------------
     CURRENT SETTINGS
  ---------------------------------------------------------- */

  let current = await getCurrentSettings();

  if (!current) {
    current = await createDefaultSettings();
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

  const [updated] = await db
    .update(drawSettings)
    .set({
      enable2DDraw: body.enable2DDraw ?? current.enable2DDraw,

      enable3DDraw: body.enable3DDraw ?? current.enable3DDraw,

      twoDDrawTime: body.twoDDrawTime ?? current.twoDDrawTime,

      threeDDrawTime: body.threeDDrawTime ?? current.threeDDrawTime,

      ticketClosingTime2D:
        body.ticketClosingTime2D ?? current.ticketClosingTime2D,

      ticketClosingTime3D:
        body.ticketClosingTime3D ?? current.ticketClosingTime3D,

      manualResultEntry: body.manualResultEntry ?? current.manualResultEntry,

      resultPublishing: body.resultPublishing ?? current.resultPublishing,

      drawStatus: body.drawStatus ?? current.drawStatus,

      updatedAt: new Date(),
    })
    .where(eq(drawSettings.id, current.id))
    .returning();

  return response(200, {
    success: true,

    message: "Draw settings saved successfully.",

    data: {
      settings: updated,
    },
  });
};

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod.toUpperCase();

    console.log("Admin draw settings API:", {
      method,
      path: event.path,
    });

    /* --------------------------------------------------------
       GET
    -------------------------------------------------------- */

    if (method === "GET") {
      return await handleGet();
    }

    /* --------------------------------------------------------
       PUT
    -------------------------------------------------------- */

    if (method === "PUT") {
      return await handlePut(event);
    }

    /* --------------------------------------------------------
       POST
    -------------------------------------------------------- */

    /*
     * POST is also accepted so this endpoint is easier
     * to use during initial setup.
     */

    if (method === "POST") {
      return await handlePut(event);
    }

    /* --------------------------------------------------------
       METHOD NOT ALLOWED
    -------------------------------------------------------- */

    return response(405, {
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Admin draw settings API error:", error);

    return response(500, {
      success: false,

      message:
        error instanceof Error ? error.message : "Internal server error.",
    });
  }
};
