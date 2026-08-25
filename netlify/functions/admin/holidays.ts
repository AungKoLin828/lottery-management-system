import type { Handler, HandlerEvent } from "@netlify/functions";

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
   PATH HELPERS
============================================================ */

/**
 * Supported paths:
 *
 * /api/admin/holidays
 * /api/admin/holidays/:id
 *
 * Netlify function path:
 *
 * /.netlify/functions/admin/holidays
 * /.netlify/functions/admin/holidays/:id
 *
 * Because the request may arrive through the redirect,
 * we intentionally do not depend on one specific prefix.
 */
const getPathId = (event: HandlerEvent): string | null => {
  const path = event.path || "";

  const parts = path.split("/").filter(Boolean);

  const holidaysIndex = parts.lastIndexOf("holidays");

  if (holidaysIndex === -1) {
    return null;
  }

  const possibleId = parts[holidaysIndex + 1];

  return possibleId || null;
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
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/* ============================================================
   GET ALL / SINGLE HOLIDAY
============================================================ */

const handleGet = async (id: string | null) => {
  /* ----------------------------------------------------------
     GET SINGLE HOLIDAY
  ---------------------------------------------------------- */

  if (id) {
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
      .where(eq(publicHolidays.id, id))
      .limit(1);

    if (holidays.length === 0) {
      return response(404, {
        success: false,
        message: "Holiday not found.",
      });
    }

    return response(200, {
      success: true,
      data: {
        holiday: holidays[0],
      },
    });
  }

  /* ----------------------------------------------------------
     GET ALL HOLIDAYS
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     DATE
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     NAME
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     DUPLICATE DATE
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     INSERT
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     VALIDATE DATE
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     VALIDATE NAME
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     CHECK CURRENT HOLIDAY
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     CHECK DUPLICATE DATE
  ---------------------------------------------------------- */

  const holidaysWithSameDate = await db
    .select({
      id: publicHolidays.id,
    })
    .from(publicHolidays)
    .where(eq(publicHolidays.date, date));

  const duplicateExists = holidaysWithSameDate.some(
    (holiday) => holiday.id !== id,
  );

  if (duplicateExists) {
    return response(409, {
      success: false,
      message: "A holiday already exists for this date.",
    });
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     CHECK HOLIDAY
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     UPDATE DATA
  ---------------------------------------------------------- */

  const updateData: {
    isActive?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

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
============================================================ */

const handleDelete = async (id: string) => {
  /* ----------------------------------------------------------
     CHECK HOLIDAY
  ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
     DELETE
  ---------------------------------------------------------- */

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

    console.log("Admin holidays API request:", {
      method,
      path: event.path,
      id,
    });

    /* --------------------------------------------------------
       GET
    -------------------------------------------------------- */

    if (method === "GET") {
      return await handleGet(id);
    }

    /* --------------------------------------------------------
       POST
    -------------------------------------------------------- */

    if (method === "POST") {
      if (id) {
        return response(400, {
          success: false,
          message: "POST does not accept a holiday ID.",
        });
      }

      return await handlePost(event);
    }

    /* --------------------------------------------------------
       PUT
    -------------------------------------------------------- */

    if (method === "PUT") {
      if (!id) {
        return response(400, {
          success: false,
          message: "Holiday ID is required.",
        });
      }

      return await handlePut(event, id);
    }

    /* --------------------------------------------------------
       PATCH
    -------------------------------------------------------- */

    if (method === "PATCH") {
      if (!id) {
        return response(400, {
          success: false,
          message: "Holiday ID is required.",
        });
      }

      return await handlePatch(event, id);
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    if (method === "DELETE") {
      if (!id) {
        return response(400, {
          success: false,
          message: "Holiday ID is required.",
        });
      }

      return await handleDelete(id);
    }

    /* --------------------------------------------------------
       METHOD NOT ALLOWED
    -------------------------------------------------------- */

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
