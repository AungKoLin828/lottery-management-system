import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { and, desc, eq, ne } from "drizzle-orm";
import { hash } from "bcryptjs";

import { db } from "../../../db";
import { users } from "../../../db/schema/users";
import { wallets } from "../../../db/schema/wallets";

/* ============================================================
   TYPES
============================================================ */

type UserRole = "ADMIN" | "PLAYER";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

/* ============================================================
   RESPONSE
============================================================ */

function jsonResponse(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

/* ============================================================
   BODY
============================================================ */

function parseBody(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

/* ============================================================
   STRING
============================================================ */

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/* ============================================================
   ROLE
============================================================ */

function isValidRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "PLAYER";
}

/* ============================================================
   STATUS
============================================================ */

function isValidStatus(value: unknown): value is UserStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED";
}

/* ============================================================
   USER ID
============================================================ */

function getUserId(event: HandlerEvent): string | null {
  /*
   * Supports:
   *
   * /api/admin/users/:id
   *
   * and:
   *
   * /api/admin/users?id=UUID
   */

  const queryId = event.queryStringParameters?.id;

  if (queryId) {
    return queryId;
  }

  const pathParts = event.path.split("/").filter(Boolean);

  /*
   * Netlify can expose the path as:
   *
   * /api/admin/users/UUID
   *
   * or:
   *
   * /.netlify/functions/admin-users/UUID
   *
   * We therefore use the last path segment.
   */

  if (pathParts.length > 3) {
    return pathParts[pathParts.length - 1];
  }

  return null;
}

/* ============================================================
   FORMAT USER
============================================================ */

function formatUser(user: {
  id: string;
  username: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  createdAt: Date;
  balance: string | null;
}) {
  return {
    id: user.id,

    username: user.username,

    fullName: user.fullName,

    phone: user.phone,

    email: user.email,

    role: user.role,

    status: user.status,

    isVerified: user.isVerified,

    balance: Number(user.balance ?? "0"),

    createdAt: user.createdAt.toISOString(),
  };
}

/* ============================================================
   GET USERS
============================================================ */

async function listUsers() {
  const rows = await db
    .select({
      id: users.id,

      username: users.username,

      fullName: users.fullName,

      phone: users.phone,

      email: users.email,

      role: users.role,

      status: users.status,

      isVerified: users.isVerified,

      createdAt: users.createdAt,

      balance: wallets.balance,
    })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .orderBy(desc(users.createdAt));

  return rows.map((user) =>
    formatUser({
      id: user.id,

      username: user.username,

      fullName: user.fullName,

      phone: user.phone,

      email: user.email,

      role: user.role,

      status: user.status,

      isVerified: user.isVerified,

      createdAt: user.createdAt,

      balance: user.balance,
    }),
  );
}

/* ============================================================
   CREATE USER
============================================================ */

async function createUser(event: HandlerEvent) {
  const body = parseBody(event);

  const username = stringValue(body.username);

  const fullName = stringValue(body.fullName);

  const phone = stringValue(body.phone);

  const email = stringValue(body.email);

  const password = stringValue(body.password);

  const role = body.role;

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */

  if (!username) {
    return jsonResponse(400, {
      success: false,
      message: "Username is required.",
    });
  }

  if (!phone) {
    return jsonResponse(400, {
      success: false,
      message: "Phone number is required.",
    });
  }

  if (!password) {
    return jsonResponse(400, {
      success: false,
      message: "Password is required.",
    });
  }

  if (password.length < 8) {
    return jsonResponse(400, {
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  if (!isValidRole(role)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid role.",
    });
  }

  /* ----------------------------------------------------------
     USERNAME DUPLICATE
  ---------------------------------------------------------- */

  const usernameExists = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (usernameExists.length > 0) {
    return jsonResponse(409, {
      success: false,
      message: "Username is already in use.",
    });
  }

  /* ----------------------------------------------------------
     PHONE DUPLICATE
  ---------------------------------------------------------- */

  const phoneExists = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (phoneExists.length > 0) {
    return jsonResponse(409, {
      success: false,
      message: "Phone number is already registered.",
    });
  }

  /* ----------------------------------------------------------
     EMAIL DUPLICATE
  ---------------------------------------------------------- */

  const normalizedEmail = email || null;

  if (normalizedEmail) {
    const emailExists = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (emailExists.length > 0) {
      return jsonResponse(409, {
        success: false,
        message: "Email is already in use.",
      });
    }
  }

  /* ----------------------------------------------------------
     PASSWORD
  ---------------------------------------------------------- */

  const passwordHash = await hash(password, 12);

  /* ----------------------------------------------------------
     INSERT USER
  ---------------------------------------------------------- */

  const inserted = await db
    .insert(users)
    .values({
      username,

      fullName: fullName || null,

      phone,

      email: normalizedEmail,

      passwordHash,

      role,

      status: "ACTIVE",

      /*
       * Admin-created accounts
       * are immediately verified.
       */
      isVerified: true,
    })
    .returning({
      id: users.id,

      username: users.username,

      fullName: users.fullName,

      phone: users.phone,

      email: users.email,

      role: users.role,

      status: users.status,

      isVerified: users.isVerified,

      createdAt: users.createdAt,
    });

  const createdUser = inserted[0];

  if (!createdUser) {
    return jsonResponse(500, {
      success: false,
      message: "Failed to create user.",
    });
  }

  /* ----------------------------------------------------------
     CREATE WALLET
  ---------------------------------------------------------- */

  await db.insert(wallets).values({
    userId: createdUser.id,

    balance: "0",

    totalDeposit: "0",

    totalWithdraw: "0",

    totalBet: "0",

    totalWin: "0",
  });

  return jsonResponse(201, {
    success: true,

    message: "User created successfully.",

    data: {
      user: {
        id: createdUser.id,

        username: createdUser.username,

        fullName: createdUser.fullName,

        phone: createdUser.phone,

        email: createdUser.email,

        role: createdUser.role,

        status: createdUser.status,

        isVerified: createdUser.isVerified,

        balance: 0,

        createdAt: createdUser.createdAt.toISOString(),
      },
    },
  });
}

/* ============================================================
   UPDATE USER
============================================================ */

async function updateUser(event: HandlerEvent, userId: string) {
  const body = parseBody(event);

  const username = stringValue(body.username);

  const fullName = stringValue(body.fullName);

  const phone = stringValue(body.phone);

  const email = stringValue(body.email);

  const password = stringValue(body.password);

  const role = body.role;

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */

  if (!username) {
    return jsonResponse(400, {
      success: false,
      message: "Username is required.",
    });
  }

  if (!phone) {
    return jsonResponse(400, {
      success: false,
      message: "Phone number is required.",
    });
  }

  if (!isValidRole(role)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid role.",
    });
  }

  /* ----------------------------------------------------------
     USER EXISTS
  ---------------------------------------------------------- */

  const existing = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    return jsonResponse(404, {
      success: false,
      message: "User not found.",
    });
  }

  /* ----------------------------------------------------------
     USERNAME DUPLICATE
  ---------------------------------------------------------- */

  const usernameConflict = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(
      and(
        eq(users.username, username),

        ne(users.id, userId),
      ),
    )
    .limit(1);

  if (usernameConflict.length) {
    return jsonResponse(409, {
      success: false,
      message: "Username is already in use.",
    });
  }

  /* ----------------------------------------------------------
     PHONE DUPLICATE
  ---------------------------------------------------------- */

  const phoneConflict = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(
      and(
        eq(users.phone, phone),

        ne(users.id, userId),
      ),
    )
    .limit(1);

  if (phoneConflict.length) {
    return jsonResponse(409, {
      success: false,
      message: "Phone number is already registered.",
    });
  }

  /* ----------------------------------------------------------
     EMAIL DUPLICATE
  ---------------------------------------------------------- */

  const normalizedEmail = email || null;

  if (normalizedEmail) {
    const emailConflict = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.email, normalizedEmail),

          ne(users.id, userId),
        ),
      )
      .limit(1);

    if (emailConflict.length) {
      return jsonResponse(409, {
        success: false,
        message: "Email is already in use.",
      });
    }
  }

  /* ----------------------------------------------------------
     UPDATE
  ---------------------------------------------------------- */

  const updateValues: {
    username: string;

    fullName: string | null;

    phone: string;

    email: string | null;

    role: UserRole;

    updatedAt: Date;

    passwordHash?: string;
  } = {
    username,

    fullName: fullName || null,

    phone,

    email: normalizedEmail,

    role,

    updatedAt: new Date(),
  };

  /* ----------------------------------------------------------
     PASSWORD
  ---------------------------------------------------------- */

  if (password) {
    if (password.length < 8) {
      return jsonResponse(400, {
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    updateValues.passwordHash = await hash(password, 12);
  }

  /* ----------------------------------------------------------
     UPDATE DATABASE
  ---------------------------------------------------------- */

  await db.update(users).set(updateValues).where(eq(users.id, userId));

  return jsonResponse(200, {
    success: true,

    message: "User updated successfully.",
  });
}

/* ============================================================
   UPDATE STATUS
============================================================ */

async function updateStatus(event: HandlerEvent, userId: string) {
  const body = parseBody(event);

  const status = body.status;

  if (!isValidStatus(status)) {
    return jsonResponse(400, {
      success: false,
      message: "Invalid status.",
    });
  }

  const existing = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    return jsonResponse(404, {
      success: false,
      message: "User not found.",
    });
  }

  await db
    .update(users)
    .set({
      status,

      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return jsonResponse(200, {
    success: true,

    message: "User status updated successfully.",
  });
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    /* ------------------------------------------------------
         GET
      ------------------------------------------------------ */

    if (event.httpMethod === "GET") {
      const usersData = await listUsers();

      return jsonResponse(200, {
        success: true,

        data: {
          users: usersData,
        },
      });
    }

    /* ------------------------------------------------------
         POST
      ------------------------------------------------------ */

    if (event.httpMethod === "POST") {
      return await createUser(event);
    }

    /* ------------------------------------------------------
         USER ID
      ------------------------------------------------------ */

    const userId = getUserId(event);

    if (!userId) {
      return jsonResponse(400, {
        success: false,
        message: "User ID is required.",
      });
    }

    /* ------------------------------------------------------
         PUT
      ------------------------------------------------------ */

    if (event.httpMethod === "PUT") {
      return await updateUser(event, userId);
    }

    /* ------------------------------------------------------
         PATCH
      ------------------------------------------------------ */

    if (event.httpMethod === "PATCH") {
      return await updateStatus(event, userId);
    }

    /* ------------------------------------------------------
         METHOD
      ------------------------------------------------------ */

    return jsonResponse(405, {
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Admin users function error:", error);

    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage.includes("duplicate key") ||
      errorMessage.includes("unique constraint")
    ) {
      return jsonResponse(409, {
        success: false,
        message: "Username, phone, or email already exists.",
      });
    }

    return jsonResponse(500, {
      success: false,
      message: "Internal server error.",
    });
  }
};
