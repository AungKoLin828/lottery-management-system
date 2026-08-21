import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from "@netlify/functions";

import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
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

function json(statusCode: number, body: unknown): HandlerResponse {
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

function getBody(event: HandlerEvent): Record<string, unknown> {
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
   INTEGER
============================================================ */

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

/* ============================================================
   ROLE
============================================================ */

function isRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "PLAYER";
}

/* ============================================================
   STATUS
============================================================ */

function isStatus(value: unknown): value is UserStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED";
}

/* ============================================================
   USER ID
============================================================ */

function getUserId(event: HandlerEvent): string | null {
  const queryId = event.queryStringParameters?.id;

  if (queryId) {
    return queryId;
  }

  const parts = event.path.split("/").filter(Boolean);

  if (parts.length > 0 && parts[parts.length - 1] !== "users") {
    return parts[parts.length - 1];
  }

  return null;
}

/* ============================================================
   FORMAT USER
============================================================ */

function formatUser(row: {
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
    id: row.id,

    username: row.username,

    fullName: row.fullName,

    phone: row.phone,

    email: row.email,

    role: row.role,

    status: row.status,

    isVerified: row.isVerified,

    balance: Number(row.balance ?? "0"),

    createdAt: row.createdAt.toISOString(),
  };
}

/* ============================================================
   GET USERS
============================================================ */

async function getUsers(event: HandlerEvent) {
  const params = event.queryStringParameters ?? {};

  const page = Math.min(positiveInteger(params.page, 1), 1000000);

  const requestedPageSize = positiveInteger(params.pageSize, 10);

  const pageSize = Math.min(requestedPageSize, 100);

  const search = stringValue(params.search);

  const roleParam = stringValue(params.role);

  const statusParam = stringValue(params.status);

  const offset = (page - 1) * pageSize;

  /* ----------------------------------------------------------
     CONDITIONS
  ---------------------------------------------------------- */

  const conditions = [];

  if (search) {
    const searchPattern = `%${search}%`;

    conditions.push(
      or(
        ilike(users.username, searchPattern),

        ilike(users.fullName, searchPattern),

        ilike(users.phone, searchPattern),

        ilike(users.email, searchPattern),
      ),
    );
  }

  if (isRole(roleParam)) {
    conditions.push(eq(users.role, roleParam));
  }

  if (isStatus(statusParam)) {
    conditions.push(eq(users.status, statusParam));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  /* ----------------------------------------------------------
     COUNT
  ---------------------------------------------------------- */

  const countResult = await db
    .select({
      count: count(),
    })
    .from(users)
    .where(whereCondition);

  const total = Number(countResult[0]?.count ?? 0);

  /* ----------------------------------------------------------
     USERS
  ---------------------------------------------------------- */

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
    .where(whereCondition)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  const formattedUsers = rows.map((row) =>
    formatUser({
      id: row.id,

      username: row.username,

      fullName: row.fullName,

      phone: row.phone,

      email: row.email,

      role: row.role,

      status: row.status,

      isVerified: row.isVerified,

      createdAt: row.createdAt,

      balance: row.balance,
    }),
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return json(200, {
    success: true,

    data: {
      users: formattedUsers,

      pagination: {
        page,

        pageSize,

        total,

        totalPages,

        hasPreviousPage: page > 1,

        hasNextPage: page < totalPages,
      },
    },
  });
}

/* ============================================================
   CREATE USER
============================================================ */

async function createUser(event: HandlerEvent) {
  const body = getBody(event);

  const username = stringValue(body.username);

  const fullName = stringValue(body.fullName);

  const phone = stringValue(body.phone);

  const email = stringValue(body.email);

  const password = stringValue(body.password);

  const role = body.role;

  if (!username) {
    return json(400, {
      success: false,
      message: "Username is required.",
    });
  }

  if (!phone) {
    return json(400, {
      success: false,
      message: "Phone number is required.",
    });
  }

  if (!password) {
    return json(400, {
      success: false,
      message: "Password is required.",
    });
  }

  if (password.length < 8) {
    return json(400, {
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  if (!isRole(role)) {
    return json(400, {
      success: false,
      message: "Invalid role.",
    });
  }

  /* ----------------------------------------------------------
     DUPLICATE USERNAME
  ---------------------------------------------------------- */

  const usernameExists = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (usernameExists.length) {
    return json(409, {
      success: false,
      message: "Username is already in use.",
    });
  }

  /* ----------------------------------------------------------
     DUPLICATE PHONE
  ---------------------------------------------------------- */

  const phoneExists = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (phoneExists.length) {
    return json(409, {
      success: false,
      message: "Phone number is already registered.",
    });
  }

  /* ----------------------------------------------------------
     DUPLICATE EMAIL
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

    if (emailExists.length) {
      return json(409, {
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
     INSERT
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

  const newUser = inserted[0];

  if (!newUser) {
    return json(500, {
      success: false,
      message: "Failed to create user.",
    });
  }

  /* ----------------------------------------------------------
     WALLET
  ---------------------------------------------------------- */

  await db.insert(wallets).values({
    userId: newUser.id,

    balance: "0",

    totalDeposit: "0",

    totalWithdraw: "0",

    totalBet: "0",

    totalWin: "0",
  });

  return json(201, {
    success: true,

    message: "User created successfully.",

    data: {
      user: {
        id: newUser.id,

        username: newUser.username,

        fullName: newUser.fullName,

        phone: newUser.phone,

        email: newUser.email,

        role: newUser.role,

        status: newUser.status,

        isVerified: newUser.isVerified,

        balance: 0,

        createdAt: newUser.createdAt.toISOString(),
      },
    },
  });
}

/* ============================================================
   UPDATE USER
============================================================ */

async function updateUser(event: HandlerEvent, userId: string) {
  const body = getBody(event);

  const username = stringValue(body.username);

  const fullName = stringValue(body.fullName);

  const phone = stringValue(body.phone);

  const email = stringValue(body.email);

  const password = stringValue(body.password);

  const role = body.role;

  if (!username) {
    return json(400, {
      success: false,
      message: "Username is required.",
    });
  }

  if (!phone) {
    return json(400, {
      success: false,
      message: "Phone number is required.",
    });
  }

  if (!isRole(role)) {
    return json(400, {
      success: false,
      message: "Invalid role.",
    });
  }

  const existing = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing.length) {
    return json(404, {
      success: false,
      message: "User not found.",
    });
  }

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
    return json(409, {
      success: false,
      message: "Username is already in use.",
    });
  }

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
    return json(409, {
      success: false,
      message: "Phone number is already registered.",
    });
  }

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
      return json(409, {
        success: false,
        message: "Email is already in use.",
      });
    }
  }

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

  if (password) {
    if (password.length < 8) {
      return json(400, {
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    updateValues.passwordHash = await hash(password, 12);
  }

  await db.update(users).set(updateValues).where(eq(users.id, userId));

  return json(200, {
    success: true,

    message: "User updated successfully.",
  });
}

/* ============================================================
   UPDATE STATUS
============================================================ */

async function updateStatus(event: HandlerEvent, userId: string) {
  const body = getBody(event);

  const status = body.status;

  if (!isStatus(status)) {
    return json(400, {
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

  if (!existing.length) {
    return json(404, {
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

  return json(200, {
    success: true,

    message: "User status updated successfully.",
  });
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler = async (event) => {
  try {
    console.log(`[admin-users] ${event.httpMethod} ${event.path}`);

    /* GET */

    if (event.httpMethod === "GET") {
      return await getUsers(event);
    }

    /* POST */

    if (event.httpMethod === "POST") {
      return await createUser(event);
    }

    /* USER ID */

    const userId = getUserId(event);

    if (!userId) {
      return json(400, {
        success: false,
        message: "User ID is required.",
      });
    }

    /* PUT */

    if (event.httpMethod === "PUT") {
      return await updateUser(event, userId);
    }

    /* PATCH */

    if (event.httpMethod === "PATCH") {
      return await updateStatus(event, userId);
    }

    return json(405, {
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("[admin-users] error:", error);

    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("duplicate key") ||
      message.includes("unique constraint")
    ) {
      return json(409, {
        success: false,
        message: "Username, phone, or email already exists.",
      });
    }

    return json(500, {
      success: false,
      message: "Internal server error.",
    });
  }
};
