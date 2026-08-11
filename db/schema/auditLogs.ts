import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  inet,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "PUBLISH",
  "LOGIN",
  "LOGOUT",
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id),

  action: auditActionEnum("action").notNull(),

  entity: varchar("entity", {
    length: 100,
  }).notNull(),

  entityId: uuid("entity_id"),

  description: text("description"),

  oldData: jsonb("old_data"),

  newData: jsonb("new_data"),

  ipAddress: inet("ip_address"),

  userAgent: text("user_agent"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
