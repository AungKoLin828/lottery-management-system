import type { Handler, HandlerEvent } from "@netlify/functions";

import { and, asc, eq, ne } from "drizzle-orm";

import { numberRestrictions } from "../../../db/schema/numberRestrictions";

import { db } from "../utils/db";

import { jsonResponse, parseBody } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type RestrictionType = "2D" | "3D";

type NumberRestrictionBody = {
  number?: string;
  type?: RestrictionType;
  reason?: string;
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
   PATH
============================================================ */

const getPathId = (event: HandlerEvent): string | null => {
  const path = event.path || "";

  const parts = path.split("/").filter(Boolean);

  const index = parts.lastIndexOf("number-restrictions");

  if (index === -1) {
    return null;
  }

  return parts[index + 1] || null;
};

/* ============================================================
   VALIDATE TYPE
============================================================ */

const isValidType = (value: unknown): value is RestrictionType => {
  return value === "2D" || value === "3D";
};

/* ============================================================
   VALIDATE NUMBER
============================================================ */

const validateNumber = (
  value: string,
  type: RestrictionType,
): string | null => {
  const expectedLength = type === "2D" ? 2 : 3;

  if (!value) {
    return "Number is required.";
  }

  if (!/^\d+$/.test(value)) {
    return "Only numbers are allowed.";
  }

  if (value.length !== expectedLength) {
    return `${type} number must contain ${expectedLength} digits.`;
  }

  return null;
};

/* ============================================================
   GET ALL
   GET /api/admin/number-restrictions
============================================================ */

const handleGetAll = async () => {
  const restrictions = await db
    .select({
      id: numberRestrictions.id,
      number: numberRestrictions.number,
      type: numberRestrictions.type,
      reason: numberRestrictions.reason,
      isActive: numberRestrictions.isActive,
      createdAt: numberRestrictions.createdAt,
      updatedAt: numberRestrictions.updatedAt,
    })
    .from(numberRestrictions)
    .orderBy(asc(numberRestrictions.type), asc(numberRestrictions.number));

  return response(200, {
    success: true,
    data: {
      restrictions,
    },
  });
};

/* ============================================================
   GET ACTIVE ONLY
   GET /api/admin/number-restrictions/active
============================================================ */

const handleGetActive = async () => {
  const restrictions = await db
    .select({
      id: numberRestrictions.id,
      number: numberRestrictions.number,
      type: numberRestrictions.type,
      reason: numberRestrictions.reason,
      isActive: numberRestrictions.isActive,
      createdAt: numberRestrictions.createdAt,
      updatedAt: numberRestrictions.updatedAt,
    })
    .from(numberRestrictions)
    .where(eq(numberRestrictions.isActive, true))
    .orderBy(asc(numberRestrictions.type), asc(numberRestrictions.number));

  return response(200, {
    success: true,
    data: {
      restrictions,
    },
  });
};

/* ============================================================
   GET SINGLE
============================================================ */

const handleGetOne = async (id: string) => {
  const rows = await db
    .select({
      id: numberRestrictions.id,
      number: numberRestrictions.number,
      type: numberRestrictions.type,
      reason: numberRestrictions.reason,
      isActive: numberRestrictions.isActive,
      createdAt: numberRestrictions.createdAt,
      updatedAt: numberRestrictions.updatedAt,
    })
    .from(numberRestrictions)
    .where(eq(numberRestrictions.id, id))
    .limit(1);

  if (rows.length === 0) {
    return response(404, {
      success: false,
      message: "Number restriction not found.",
    });
  }

  return response(200, {
    success: true,
    data: {
      restriction: rows[0],
    },
  });
};

/* ============================================================
   POST
   POST /api/admin/number-restrictions
============================================================ */

const handlePost = async (event: HandlerEvent) => {
  const body = await parseBody<NumberRestrictionBody>(event);

  const number = String(body.number || "").trim();

  const type = body.type;

  const reason = String(body.reason || "Admin restriction").trim();

  /* ----------------------------------------------------------
     TYPE
  ---------------------------------------------------------- */

  if (!isValidType(type)) {
    return response(400, {
      success: false,
      message: "Lottery type must be 2D or 3D.",
    });
  }

  /* ----------------------------------------------------------
     NUMBER
  ---------------------------------------------------------- */

  const numberError = validateNumber(number, type);

  if (numberError) {
    return response(400, {
      success: false,
      message: numberError,
    });
  }

  /* ----------------------------------------------------------
     REASON
  ---------------------------------------------------------- */

  if (reason.length > 255) {
    return response(400, {
      success: false,
      message: "Reason must not exceed 255 characters.",
    });
  }

  /* ----------------------------------------------------------
     DUPLICATE
  ---------------------------------------------------------- */

  const existing = await db
    .select({
      id: numberRestrictions.id,
    })
    .from(numberRestrictions)
    .where(
      and(
        eq(numberRestrictions.number, number),
        eq(numberRestrictions.type, type),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return response(409, {
      success: false,
      message: "This number is already restricted.",
    });
  }

  /* ----------------------------------------------------------
     INSERT
  ---------------------------------------------------------- */

  const [restriction] = await db
    .insert(numberRestrictions)
    .values({
      number,
      type,
      reason: reason || "Admin restriction",
      isActive: body.isActive !== false,
    })
    .returning();

  return response(201, {
    success: true,
    message: "Number restriction added successfully.",
    data: {
      restriction,
    },
  });
};

/* ============================================================
   PUT
   PUT /api/admin/number-restrictions/:id
============================================================ */

const handlePut = async (event: HandlerEvent, id: string) => {
  const body = await parseBody<NumberRestrictionBody>(event);

  const number = String(body.number || "").trim();

  const type = body.type;

  const reason = String(body.reason || "Admin restriction").trim();

  /* ----------------------------------------------------------
     TYPE
  ---------------------------------------------------------- */

  if (!isValidType(type)) {
    return response(400, {
      success: false,
      message: "Lottery type must be 2D or 3D.",
    });
  }

  /* ----------------------------------------------------------
     NUMBER
  ---------------------------------------------------------- */

  const numberError = validateNumber(number, type);

  if (numberError) {
    return response(400, {
      success: false,
      message: numberError,
    });
  }

  /* ----------------------------------------------------------
     REASON
  ---------------------------------------------------------- */

  if (reason.length > 255) {
    return response(400, {
      success: false,
      message: "Reason must not exceed 255 characters.",
    });
  }

  /* ----------------------------------------------------------
     CURRENT
  ---------------------------------------------------------- */

  const current = await db
    .select({
      id: numberRestrictions.id,
    })
    .from(numberRestrictions)
    .where(eq(numberRestrictions.id, id))
    .limit(1);

  if (current.length === 0) {
    return response(404, {
      success: false,
      message: "Number restriction not found.",
    });
  }

  /* ----------------------------------------------------------
     DUPLICATE
  ---------------------------------------------------------- */

  const duplicate = await db
    .select({
      id: numberRestrictions.id,
    })
    .from(numberRestrictions)
    .where(
      and(
        eq(numberRestrictions.number, number),
        eq(numberRestrictions.type, type),
        ne(numberRestrictions.id, id),
      ),
    )
    .limit(1);

  if (duplicate.length > 0) {
    return response(409, {
      success: false,
      message: "Another restriction already exists for this number and type.",
    });
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

  const [restriction] = await db
    .update(numberRestrictions)
    .set({
      number,
      type,
      reason: reason || "Admin restriction",
      isActive: body.isActive !== false,
      updatedAt: new Date(),
    })
    .where(eq(numberRestrictions.id, id))
    .returning();

  return response(200, {
    success: true,
    message: "Number restriction updated successfully.",
    data: {
      restriction,
    },
  });
};

/* ============================================================
   PATCH
   PATCH /api/admin/number-restrictions/:id
============================================================ */

const handlePatch = async (event: HandlerEvent, id: string) => {
  const body = await parseBody<NumberRestrictionBody>(event);

  const existing = await db
    .select({
      id: numberRestrictions.id,
    })
    .from(numberRestrictions)
    .where(eq(numberRestrictions.id, id))
    .limit(1);

  if (existing.length === 0) {
    return response(404, {
      success: false,
      message: "Number restriction not found.",
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

  const [restriction] = await db
    .update(numberRestrictions)
    .set(updateData)
    .where(eq(numberRestrictions.id, id))
    .returning();

  return response(200, {
    success: true,
    message: "Number restriction status updated successfully.",
    data: {
      restriction,
    },
  });
};

/* ============================================================
   DELETE
   DELETE /api/admin/number-restrictions/:id
============================================================ */

const handleDelete = async (id: string) => {
  const existing = await db
    .select({
      id: numberRestrictions.id,
    })
    .from(numberRestrictions)
    .where(eq(numberRestrictions.id, id))
    .limit(1);

  if (existing.length === 0) {
    return response(404, {
      success: false,
      message: "Number restriction not found.",
    });
  }

  await db.delete(numberRestrictions).where(eq(numberRestrictions.id, id));

  return response(200, {
    success: true,
    message: "Number restriction removed successfully.",
  });
};

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod.toUpperCase();

    const id = getPathId(event);

    console.log("Admin number restrictions API:", {
      method,
      path: event.path,
      id,
    });

    /* ------------------------------------------------------
         ACTIVE
      ------------------------------------------------------ */

    if (method === "GET" && event.path.endsWith("/active")) {
      return await handleGetActive();
    }

    /* ------------------------------------------------------
         GET
      ------------------------------------------------------ */

    if (method === "GET") {
      if (id) {
        return await handleGetOne(id);
      }

      return await handleGetAll();
    }

    /* ------------------------------------------------------
         POST
      ------------------------------------------------------ */

    if (method === "POST" && !id) {
      return await handlePost(event);
    }

    /* ------------------------------------------------------
         PUT
      ------------------------------------------------------ */

    if (method === "PUT" && id) {
      return await handlePut(event, id);
    }

    /* ------------------------------------------------------
         PATCH
      ------------------------------------------------------ */

    if (method === "PATCH" && id) {
      return await handlePatch(event, id);
    }

    /* ------------------------------------------------------
         DELETE
      ------------------------------------------------------ */

    if (method === "DELETE" && id) {
      return await handleDelete(id);
    }

    return response(405, {
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Admin number restrictions API error:", error);

    return response(500, {
      success: false,
      message:
        error instanceof Error ? error.message : "Internal server error.",
    });
  }
};
