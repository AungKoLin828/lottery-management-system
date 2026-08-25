import type { Handler } from "@netlify/functions";

import { asc, eq } from "drizzle-orm";

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

/* ============================================================
   RESPONSE
============================================================ */

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/* ============================================================
   HELPERS
============================================================ */

const response = <T>(statusCode: number, body: ApiResponse<T>) => {
  return jsonResponse(statusCode, body);
};

const getPathId = (event: Parameters<Handler>[0]) => {
  const path = event.path || "";

  const match = path.match(/\/api\/admin\/holidays\/([^/]+)$/);

  return match?.[1] || null;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
};

/* ============================================================
   GET
   GET /api/admin/holidays
============================================================ */

const handleGet = async () => {
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
   POST /api/admin/holidays
============================================================ */

const handlePost = async (event: Parameters<Handler>[0]) => {
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
      message: "Invalid holiday date.",
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
   PUT /api/admin/holidays/:id
============================================================ */

const handlePut = async (event: Parameters<Handler>[0], id: string) => {
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
      message: "Invalid holiday date.",
    });
  }

  if (!name) {
    return response(400, {
      success: false,
      message: "Holiday name is required.",
    });
  }

  const currentHoliday = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.id, id))
    .limit(1);

  if (currentHoliday.length === 0) {
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
    .where(eq(publicHolidays.date, date))
    .limit(1);

  if (duplicate.length > 0 && duplicate[0].id !== id) {
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
   PATCH /api/admin/holidays/:id
============================================================ */

const handlePatch = async (event: Parameters<Handler>[0], id: string) => {
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

  const updateData: {
    isActive?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  const [holiday] = await db
    .update(publicHolidays)
    .set(updateData)
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
   DELETE /api/admin/holidays/:id
============================================================ */

const handleDelete = async (event: Parameters<Handler>[0], id: string) => {
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

    const id = getPathId(event);

    if (method === "GET") {
      return await handleGet();
    }

    if (method === "POST") {
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
