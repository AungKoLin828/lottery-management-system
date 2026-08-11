import { pgEnum, pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "ACTIVE",
  "WON",
  "LOST",
  "CANCELLED",
]);

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),

  ticketNumber: uuid("ticket_number").defaultRandom().notNull().unique(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  totalAmount: numeric("total_amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  totalWinAmount: numeric("total_win_amount", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  status: ticketStatusEnum("status").notNull().default("ACTIVE"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
