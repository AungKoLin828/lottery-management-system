import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "PLAYER"]);

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  username: varchar("username", {
    length: 50,
  })
    .notNull()
    .unique(),

  email: varchar("email", {
    length: 255,
  }).unique(),

  passwordHash: varchar("password_hash", {
    length: 255,
  }).notNull(),

  fullName: varchar("full_name", {
    length: 150,
  }),

  phone: varchar("phone", {
    length: 30,
  }).unique(),

  role: userRoleEnum("role").notNull().default("PLAYER"),

  status: userStatusEnum("status").notNull().default("ACTIVE"),

  isVerified: boolean("is_verified").notNull().default(false),

  lastLoginAt: timestamp("last_login_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
