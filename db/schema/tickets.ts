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

  /*
   * Unique ticket identifier
   */
  ticketNumber: uuid("ticket_number").defaultRandom().notNull().unique(),

  /*
   * Player who purchased the ticket
   */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  /*
   * Sum of all ticket item bet amounts
   */
  totalAmount: numeric("total_amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  /*
   * Sum of all ticket item win amounts
   */
  totalWinAmount: numeric("total_win_amount", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  /*
   * Overall ticket status
   */
  status: ticketStatusEnum("status").notNull().default("ACTIVE"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
