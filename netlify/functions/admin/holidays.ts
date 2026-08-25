import type { Handler, HandlerEvent } from "@netlify/functions";

import { and, asc, eq, ne } from "drizzle-orm";

import { publicHolidays } from "../../../db/schema/publicHolidays";

import { db } from "../utils/db";

import { jsonResponse, parseBody } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type HolidayBody = {
  date?: string;
  name?: string;
  isActive?: boolean;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/* ============================================================
   RESPONSE
============================================================ */

const response = <T>(statusCode: number, body: ApiResponse<T>) => {
  return jsonResponse(statusCode, body);
};

/* ============================================================
   DATE VALIDATION
============================================================ */

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
};

/* ============================================================
   GET PATH ID
============================================================ */

const getHolidayId = (event: HandlerEvent): string | null => {
  const path = event.path || "";

  const parts = path.split("/").filter(Boolean);

  const holidaysIndex = parts.lastIndexOf("holidays");

  if (holidaysIndex === -1) {
    return null;
  }

  return parts[holidaysIndex + 1] || null;
};

/* ============================================================
   GET ALL / SINGLE
============================================================ */

const handleGet = async (event: HandlerEvent, id: string | null) => {
  if (id) {
    const rows = await db
      .select({
        id: publicHolidays.id,
        date: publicHolidays.date,
        name: publicHolidays.name,
        isActive: publicHolidays.isActive,
        createdAt: publicHolidays.createdAt,
        updatedAt: publicHolidays.updatedAt,
      })
      .from(publicHolidays)
      .where(eq(publicHolidays.id, id))
      .limit(1);

    if (rows.length === 0) {
      return response(404, {
        success: false,
        message: "Holiday not found.",
      });
    }

    return response(200, {
      success: true,
      data: {
        holiday: rows[0],
      },
    });
  }

  const holidays = await db
    .select({
      id: publicHolidays.id,
      date: publicHolidays.date,
      name: publicHolidays.name,
      isActive: publicHolidays.isActive,
      createdAt: publicHolidays.createdAt,
      updatedAt: publicHolidays.updatedAt,
    })
    .from(publicHolidays)
    .orderBy(asc(publicHolidays.date));

  return response(200, {
    success: true,
    data: {
      holidays,
    },
  });
};

/* ============================================================
   POST
============================================================ */

const handlePost = async (event: HandlerEvent) => {
  const body = await parseBody<HolidayBody>(event);

  const date = String(body.date || "").trim();

  const name = String(body.name || "").trim();

  if (!date) {
    return response(400, {
      success: false,
      message: "Holiday date is required.",
    });
  }

  if (!isValidDate(date)) {
    return response(400, {
      success: false,
      message: "Invalid holiday date. Use YYYY-MM-DD format.",
    });
  }

  if (!name) {
    return response(400, {
      success: false,
      message: "Holiday name is required.",
    });
  }

  if (name.length > 255) {
    return response(400, {
      success: false,
      message: "Holiday name is too long.",
    });
  }

  const existing = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.date, date))
    .limit(1);

  if (existing.length > 0) {
    return response(409, {
      success: false,
      message: "A holiday already exists for this date.",
    });
  }

  const [holiday] = await db
    .insert(publicHolidays)
    .values({
      date,
      name,
      isActive: body.isActive !== false,
    })
    .returning();

  return response(201, {
    success: true,
    message: "Holiday added successfully.",
    data: {
      holiday,
    },
  });
};

/* ============================================================
   PUT
============================================================ */

const handlePut = async (event: HandlerEvent, id: string) => {
  const body = await parseBody<HolidayBody>(event);

  const date = String(body.date || "").trim();

  const name = String(body.name || "").trim();

  if (!date) {
    return response(400, {
      success: false,
      message: "Holiday date is required.",
    });
  }

  if (!isValidDate(date)) {
    return response(400, {
      success: false,
      message: "Invalid holiday date. Use YYYY-MM-DD format.",
    });
  }

  if (!name) {
    return response(400, {
      success: false,
      message: "Holiday name is required.",
    });
  }

  if (name.length > 255) {
    return response(400, {
      success: false,
      message: "Holiday name is too long.",
    });
  }

  const current = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.id, id))
    .limit(1);

  if (current.length === 0) {
    return response(404, {
      success: false,
      message: "Holiday not found.",
    });
  }

  const duplicate = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(and(eq(publicHolidays.date, date), ne(publicHolidays.id, id)))
    .limit(1);

  if (duplicate.length > 0) {
    return response(409, {
      success: false,
      message: "A holiday already exists for this date.",
    });
  }

  const [holiday] = await db
    .update(publicHolidays)
    .set({
      date,
      name,
      isActive: body.isActive !== false,
      updatedAt: new Date(),
    })
    .where(eq(publicHolidays.id, id))
    .returning();

  return response(200, {
    success: true,
    message: "Holiday updated successfully.",
    data: {
      holiday,
    },
  });
};

/* ============================================================
   PATCH
============================================================ */

const handlePatch = async (event: HandlerEvent, id: string) => {
  const body = await parseBody<HolidayBody>(event);

  const existing = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.id, id))
    .limit(1);

  if (existing.length === 0) {
    return response(404, {
      success: false,
      message: "Holiday not found.",
    });
  }

  if (typeof body.isActive !== "boolean") {
    return response(400, {
      success: false,
      message: "isActive must be a boolean.",
    });
  }

  const [holiday] = await db
    .update(publicHolidays)
    .set({
      isActive: body.isActive,
      updatedAt: new Date(),
    })
    .where(eq(publicHolidays.id, id))
    .returning();

  return response(200, {
    success: true,
    message: "Holiday status updated successfully.",
    data: {
      holiday,
    },
  });
};

/* ============================================================
   DELETE
============================================================ */

const handleDelete = async (_event: HandlerEvent, id: string) => {
  const existing = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.id, id))
    .limit(1);

  if (existing.length === 0) {
    return response(404, {
      success: false,
      message: "Holiday not found.",
    });
  }

  await db.delete(publicHolidays).where(eq(publicHolidays.id, id));

  return response(200, {
    success: true,
    message: "Holiday deleted successfully.",
  });
};

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod.toUpperCase();

    const id = getHolidayId(event);

    console.log("Admin holidays API:", {
      method,
      path: event.path,
      id,
    });

    if (method === "GET") {
      return await handleGet(event, id);
    }

    if (method === "POST" && !id) {
      return await handlePost(event);
    }

    if (method === "PUT" && id) {
      return await handlePut(event, id);
    }

    if (method === "PATCH" && id) {
      return await handlePatch(event, id);
    }

    if (method === "DELETE" && id) {
      return await handleDelete(event, id);
    }

    return response(405, {
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Admin holidays API error:", error);

    return response(500, {
      success: false,
      message:
        error instanceof Error ? error.message : "Internal server error.",
    });
  }
};
