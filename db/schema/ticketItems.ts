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

  /*
   * Parent ticket
   */
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, {
      onDelete: "cascade",
    }),

  /*
   * Lottery draw that this bet belongs to
   */
  drawId: uuid("draw_id")
    .notNull()
    .references(() => lotteryDraws.id, {
      onDelete: "restrict",
    }),

  /*
   * Betting number
   *
   * 2D example:
   * 25
   * 08
   * 99
   *
   * 3D example:
   * 125
   * 789
   */
  number: varchar("number", {
    length: 10,
  }).notNull(),

  /*
   * Session
   *
   * 2D:
   * AM / PM
   *
   * 3D:
   * NULL
   */
  session: varchar("session", {
    length: 10,
  }),

  /*
   * Amount bet on this number
   */
  betAmount: numeric("bet_amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  /*
   * Winning amount for this item
   */
  winAmount: numeric("win_amount", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  /*
   * Item result status
   */
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
