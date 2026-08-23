import type { Handler, HandlerEvent } from "@netlify/functions";

import { and, desc, eq, isNull } from "drizzle-orm";

import { lotteryDraws } from "../../../db/schema/lotteryDraws";
import { lotteryResults } from "../../../db/schema/lotteryResults";
import { users } from "../../../db/schema/users";

import { db } from "../utils/db";

import { jsonResponse, getCookie, verifyToken } from "../utils/auth";

/* ============================================================
   TYPES
============================================================ */

type DrawType = "2D" | "3D";

type DrawSession = "AM" | "PM";

type ResultStatus = "Published" | "Draft";

interface ResultRequestBody {
  drawDate?: string;

  drawType?: DrawType;

  session?: DrawSession | null;

  winningNumber?: string;

  status?: ResultStatus;

  note?: string;
}

/* ============================================================
   COOKIE
============================================================ */

const COOKIE_NAME = "lottery_auth";

/* ============================================================
   PATH ID
============================================================ */

function getPathId(event: HandlerEvent): string | null {
  const path = event.path || "";

  const match = path.match(/\/admin\/results\/([^/]+)\/?$/);

  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

/* ============================================================
   BODY
============================================================ */

function parseRequestBody(event: HandlerEvent): ResultRequestBody {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body) as ResultRequestBody;
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

/* ============================================================
   DATE VALIDATION
============================================================ */

function validateDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/* ============================================================
   NUMBER VALIDATION
============================================================ */

function validateResultNumber(
  drawType: DrawType,
  winningNumber: string,
): boolean {
  if (drawType === "2D") {
    return /^\d{2}$/.test(winningNumber);
  }

  return /^\d{3}$/.test(winningNumber);
}

/* ============================================================
   DRAW STATUS
============================================================ */

function mapStatusToDrawStatus(status: ResultStatus): "PUBLISHED" | "DRAWN" {
  return status === "Published" ? "PUBLISHED" : "DRAWN";
}

/* ============================================================
   ADMIN AUTHENTICATION
============================================================ */

async function requireAdmin(event: HandlerEvent) {
  try {
    const token = getCookie(event, COOKIE_NAME);

    if (!token) {
      return {
        error: jsonResponse(401, {
          success: false,
          message: "Authentication required.",
        }),
      };
    }

    const payload = await verifyToken(token);

    if (!payload.userId) {
      return {
        error: jsonResponse(401, {
          success: false,
          message: "Invalid authentication token.",
        }),
      };
    }

    if (payload.role !== "ADMIN") {
      return {
        error: jsonResponse(403, {
          success: false,
          message: "Admin access required.",
        }),
      };
    }

    /*
     * Verify that the admin still exists and
     * is currently active.
     */
    const adminUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (adminUsers.length === 0) {
      return {
        error: jsonResponse(401, {
          success: false,
          message: "User account not found.",
        }),
      };
    }

    const admin = adminUsers[0];

    if (admin.role !== "ADMIN") {
      return {
        error: jsonResponse(403, {
          success: false,
          message: "Admin access required.",
        }),
      };
    }

    if (admin.status !== "ACTIVE") {
      return {
        error: jsonResponse(403, {
          success: false,
          message: "Admin account is not active.",
        }),
      };
    }

    return {
      user: admin,
    };
  } catch (error) {
    console.error("Admin authentication error:", error);

    return {
      error: jsonResponse(401, {
        success: false,
        message: "Invalid or expired authentication token.",
      }),
    };
  }
}

/* ============================================================
   GET RESULTS
============================================================ */

async function getResults() {
  const rows = await db
    .select({
      id: lotteryResults.id,

      drawId: lotteryResults.drawId,

      drawDate: lotteryDraws.drawDate,

      drawType: lotteryDraws.lotteryType,

      session: lotteryDraws.session,

      winningNumber: lotteryResults.result,

      note: lotteryResults.note,

      publishedAt: lotteryResults.publishedAt,

      createdAt: lotteryResults.createdAt,

      updatedAt: lotteryResults.updatedAt,

      createdBy: users.username,
    })
    .from(lotteryResults)
    .innerJoin(lotteryDraws, eq(lotteryResults.drawId, lotteryDraws.id))
    .innerJoin(users, eq(lotteryResults.createdBy, users.id))
    .orderBy(desc(lotteryDraws.drawDate), desc(lotteryResults.createdAt));

  return rows.map((row) => ({
    id: row.id,

    drawId: row.drawId,

    drawDate: row.drawDate,

    drawType: row.drawType,

    session: row.session,

    winningNumber: row.winningNumber,

    status: row.publishedAt ? "Published" : "Draft",

    createdBy: row.createdBy,

    note: row.note ?? "",

    publishedAt: row.publishedAt,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,
  }));
}

/* ============================================================
   CREATE RESULT
============================================================ */

async function createResult(event: HandlerEvent, adminUserId: string) {
  const body = parseRequestBody(event);

  const drawDate = body.drawDate?.trim();

  const drawType = body.drawType;

  const winningNumber = body.winningNumber?.trim();

  const status = body.status ?? "Draft";

  const note = body.note?.trim() || null;

  /* ----------------------------------------------------------
     DRAW DATE
  ---------------------------------------------------------- */

  if (!drawDate) {
    return jsonResponse(400, {
      success: false,
      message: "Draw date is required.",
    });
  }

  if (!validateDate(drawDate)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid draw date.",
    });
  }

  /* ----------------------------------------------------------
     DRAW TYPE
  ---------------------------------------------------------- */

  if (drawType !== "2D" && drawType !== "3D") {
    return jsonResponse(400, {
      success: false,
      message: "Draw type must be 2D or 3D.",
    });
  }

  /* ----------------------------------------------------------
     WINNING NUMBER
  ---------------------------------------------------------- */

  if (!winningNumber) {
    return jsonResponse(400, {
      success: false,
      message: "Winning number is required.",
    });
  }

  if (!validateResultNumber(drawType, winningNumber)) {
    return jsonResponse(400, {
      success: false,
      message:
        drawType === "2D"
          ? "2D winning number must contain exactly 2 digits."
          : "3D winning number must contain exactly 3 digits.",
    });
  }

  /* ----------------------------------------------------------
     STATUS
  ---------------------------------------------------------- */

  if (status !== "Published" && status !== "Draft") {
    return jsonResponse(400, {
      success: false,
      message: "Invalid result status.",
    });
  }

  /* ----------------------------------------------------------
     SESSION
  ---------------------------------------------------------- */

  let session: DrawSession | null = null;

  if (drawType === "2D") {
    if (body.session !== "AM" && body.session !== "PM") {
      return jsonResponse(400, {
        success: false,
        message: "2D result requires AM or PM session.",
      });
    }

    session = body.session;
  }

  /* ----------------------------------------------------------
     FIND EXISTING DRAW
  ---------------------------------------------------------- */

  const drawConditions = session
    ? and(
        eq(lotteryDraws.lotteryType, drawType),
        eq(lotteryDraws.drawDate, drawDate),
        eq(lotteryDraws.session, session),
      )
    : and(
        eq(lotteryDraws.lotteryType, drawType),
        eq(lotteryDraws.drawDate, drawDate),
        isNull(lotteryDraws.session),
      );

  const existingDraw = await db
    .select({
      id: lotteryDraws.id,
    })
    .from(lotteryDraws)
    .where(drawConditions)
    .limit(1);

  let drawId: string;

  /* ----------------------------------------------------------
     USE EXISTING DRAW
  ---------------------------------------------------------- */

  if (existingDraw.length > 0) {
    drawId = existingDraw[0].id;
  } else {
    /* --------------------------------------------------------
       CREATE DRAW
    -------------------------------------------------------- */

    const newDraw = await db
      .insert(lotteryDraws)
      .values({
        lotteryType: drawType,

        drawDate,

        session,

        status: mapStatusToDrawStatus(status),

        bettingOpen: false,

        resultPublished: status === "Published",

        updatedAt: new Date(),
      })
      .returning({
        id: lotteryDraws.id,
      });

    if (newDraw.length === 0) {
      return jsonResponse(500, {
        success: false,
        message: "Failed to create lottery draw.",
      });
    }

    drawId = newDraw[0].id;
  }

  /* ----------------------------------------------------------
     CHECK DUPLICATE RESULT
  ---------------------------------------------------------- */

  const existingResult = await db
    .select({
      id: lotteryResults.id,
    })
    .from(lotteryResults)
    .where(eq(lotteryResults.drawId, drawId))
    .limit(1);

  if (existingResult.length > 0) {
    return jsonResponse(409, {
      success: false,
      message: "A result already exists for this draw.",
    });
  }

  /* ----------------------------------------------------------
     PUBLISHED DATE
  ---------------------------------------------------------- */

  const publishedAt = status === "Published" ? new Date() : null;

  /* ----------------------------------------------------------
     CREATE RESULT
  ---------------------------------------------------------- */

  const newResults = await db
    .insert(lotteryResults)
    .values({
      drawId,

      result: winningNumber,

      note,

      createdBy: adminUserId,

      publishedAt,

      updatedAt: new Date(),
    })
    .returning({
      id: lotteryResults.id,

      drawId: lotteryResults.drawId,

      result: lotteryResults.result,
    });

  if (newResults.length === 0) {
    return jsonResponse(500, {
      success: false,
      message: "Failed to create lottery result.",
    });
  }

  /* ----------------------------------------------------------
     SYNCHRONIZE DRAW
  ---------------------------------------------------------- */

  await db
    .update(lotteryDraws)
    .set({
      status: mapStatusToDrawStatus(status),

      resultPublished: status === "Published",

      bettingOpen: false,

      updatedAt: new Date(),
    })
    .where(eq(lotteryDraws.id, drawId));

  /* ----------------------------------------------------------
     RESPONSE
  ---------------------------------------------------------- */

  return jsonResponse(201, {
    success: true,

    message: "Lottery result created successfully.",

    data: {
      result: newResults[0],
    },
  });
}

/* ============================================================
   UPDATE RESULT
============================================================ */

async function updateResult(event: HandlerEvent, resultId: string) {
  const body = parseRequestBody(event);

  const drawDate = body.drawDate?.trim();

  const drawType = body.drawType;

  const winningNumber = body.winningNumber?.trim();

  const status = body.status ?? "Draft";

  const note = body.note?.trim() || null;

  /* ----------------------------------------------------------
     DATE
  ---------------------------------------------------------- */

  if (!drawDate || !validateDate(drawDate)) {
    return jsonResponse(400, {
      success: false,
      message: "Valid draw date is required.",
    });
  }

  /* ----------------------------------------------------------
     TYPE
  ---------------------------------------------------------- */

  if (drawType !== "2D" && drawType !== "3D") {
    return jsonResponse(400, {
      success: false,
      message: "Draw type must be 2D or 3D.",
    });
  }

  /* ----------------------------------------------------------
     NUMBER
  ---------------------------------------------------------- */

  if (!winningNumber) {
    return jsonResponse(400, {
      success: false,
      message: "Winning number is required.",
    });
  }

  if (!validateResultNumber(drawType, winningNumber)) {
    return jsonResponse(400, {
      success: false,
      message:
        drawType === "2D"
          ? "2D winning number must contain exactly 2 digits."
          : "3D winning number must contain exactly 3 digits.",
    });
  }

  /* ----------------------------------------------------------
     STATUS
  ---------------------------------------------------------- */

  if (status !== "Published" && status !== "Draft") {
    return jsonResponse(400, {
      success: false,
      message: "Invalid result status.",
    });
  }

  /* ----------------------------------------------------------
     SESSION
  ---------------------------------------------------------- */

  let session: DrawSession | null = null;

  if (drawType === "2D") {
    if (body.session !== "AM" && body.session !== "PM") {
      return jsonResponse(400, {
        success: false,
        message: "2D result requires AM or PM session.",
      });
    }

    session = body.session;
  }

  /* ----------------------------------------------------------
     FIND RESULT
  ---------------------------------------------------------- */

  const existing = await db
    .select({
      id: lotteryResults.id,

      drawId: lotteryResults.drawId,
    })
    .from(lotteryResults)
    .where(eq(lotteryResults.id, resultId))
    .limit(1);

  if (existing.length === 0) {
    return jsonResponse(404, {
      success: false,
      message: "Lottery result not found.",
    });
  }

  const drawId = existing[0].drawId;

  /* ----------------------------------------------------------
     CHECK DUPLICATE DRAW
  ---------------------------------------------------------- */

  const duplicateDrawConditions = session
    ? and(
        eq(lotteryDraws.lotteryType, drawType),
        eq(lotteryDraws.drawDate, drawDate),
        eq(lotteryDraws.session, session),
      )
    : and(
        eq(lotteryDraws.lotteryType, drawType),
        eq(lotteryDraws.drawDate, drawDate),
        isNull(lotteryDraws.session),
      );

  const duplicateDraw = await db
    .select({
      id: lotteryDraws.id,
    })
    .from(lotteryDraws)
    .where(duplicateDrawConditions)
    .limit(1);

  if (duplicateDraw.length > 0 && duplicateDraw[0].id !== drawId) {
    const duplicateResult = await db
      .select({
        id: lotteryResults.id,
      })
      .from(lotteryResults)
      .where(eq(lotteryResults.drawId, duplicateDraw[0].id))
      .limit(1);

    if (duplicateResult.length > 0) {
      return jsonResponse(409, {
        success: false,
        message:
          "A result already exists for the selected draw date, type and session.",
      });
    }
  }

  /* ----------------------------------------------------------
     PUBLISHED DATE
  ---------------------------------------------------------- */

  const publishedAt = status === "Published" ? new Date() : null;

  /* ----------------------------------------------------------
     UPDATE RESULT
  ---------------------------------------------------------- */

  await db
    .update(lotteryResults)
    .set({
      result: winningNumber,

      note,

      publishedAt,

      updatedAt: new Date(),
    })
    .where(eq(lotteryResults.id, resultId));

  /* ----------------------------------------------------------
     UPDATE DRAW
  ---------------------------------------------------------- */

  await db
    .update(lotteryDraws)
    .set({
      lotteryType: drawType,

      drawDate,

      session,

      status: mapStatusToDrawStatus(status),

      resultPublished: status === "Published",

      bettingOpen: false,

      updatedAt: new Date(),
    })
    .where(eq(lotteryDraws.id, drawId));

  return jsonResponse(200, {
    success: true,
    message: "Lottery result updated successfully.",
  });
}

/* ============================================================
   DELETE RESULT
============================================================ */

async function deleteResult(resultId: string) {
  /* ----------------------------------------------------------
     FIND RESULT
  ---------------------------------------------------------- */

  const existing = await db
    .select({
      id: lotteryResults.id,

      drawId: lotteryResults.drawId,
    })
    .from(lotteryResults)
    .where(eq(lotteryResults.id, resultId))
    .limit(1);

  if (existing.length === 0) {
    return jsonResponse(404, {
      success: false,
      message: "Lottery result not found.",
    });
  }

  const drawId = existing[0].drawId;

  /* ----------------------------------------------------------
     DELETE RESULT
  ---------------------------------------------------------- */

  await db.delete(lotteryResults).where(eq(lotteryResults.id, resultId));

  /* ----------------------------------------------------------
     DELETE DRAW
  ---------------------------------------------------------- */

  try {
    await db.delete(lotteryDraws).where(eq(lotteryDraws.id, drawId));
  } catch (error) {
    console.error("Failed to delete lottery draw:", error);

    return jsonResponse(409, {
      success: false,
      message:
        "Result was deleted, but the related draw could not be deleted because it is referenced by other records.",
    });
  }

  return jsonResponse(200, {
    success: true,
    message: "Lottery result deleted successfully.",
  });
}

/* ============================================================
   MAIN HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    const method = event.httpMethod.toUpperCase();

    /* ------------------------------------------------------
         ADMIN AUTHENTICATION
      ------------------------------------------------------ */

    const auth = await requireAdmin(event);

    if (auth.error) {
      return auth.error;
    }

    const adminUserId = auth.user.id;

    const resultId = getPathId(event);

    /* ======================================================
         GET /api/admin/results
      ====================================================== */

    if (method === "GET" && !resultId) {
      const results = await getResults();

      return jsonResponse(200, {
        success: true,

        data: {
          results,
        },
      });
    }

    /* ======================================================
         POST /api/admin/results
      ====================================================== */

    if (method === "POST" && !resultId) {
      return await createResult(event, adminUserId);
    }

    /* ======================================================
         PUT /api/admin/results/:id
      ====================================================== */

    if (method === "PUT" && resultId) {
      return await updateResult(event, resultId);
    }

    /* ======================================================
         DELETE /api/admin/results/:id
      ====================================================== */

    if (method === "DELETE" && resultId) {
      return await deleteResult(resultId);
    }

    /* ======================================================
         INVALID ENDPOINT
      ====================================================== */

    return jsonResponse(404, {
      success: false,
      message: "Method or endpoint not found.",
    });
  } catch (error) {
    console.error("Admin results API error:", error);

    return jsonResponse(500, {
      success: false,
      message:
        error instanceof Error ? error.message : "Internal server error.",
    });
  }
};
