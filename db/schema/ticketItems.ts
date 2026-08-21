import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

import { tickets } from "./tickets";
import { lotteryDraws } from "./lotteryDraws";

export const ticketItemStatusEnum = pgEnum("ticket_item_status", [
  "ACTIVE",
  "WON",
  "LOST",
  "CANCELLED",
]);

export const ticketItems = pgTable("ticket_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, {
      onDelete: "cascade",
    }),

  drawId: uuid("draw_id")
    .notNull()
    .references(() => lotteryDraws.id, {
      onDelete: "cascade",
    }),

  number: varchar("number", {
    length: 10,
  }).notNull(),

  session: varchar("session", {
    length: 10,
  }),

  betAmount: numeric("bet_amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  winAmount: numeric("win_amount", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  status: ticketItemStatusEnum("status").notNull().default("ACTIVE"),

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
