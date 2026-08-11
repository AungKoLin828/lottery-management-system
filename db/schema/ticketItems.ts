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

export const betTypeEnum = pgEnum("bet_type", ["2D", "3D"]);

export const ticketItemStatusEnum = pgEnum("ticket_item_status", [
  "PENDING",
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
    .references(() => lotteryDraws.id),

  betType: betTypeEnum("bet_type").notNull(),

  number: varchar("number", {
    length: 10,
  }).notNull(),

  amount: numeric("amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  multiplier: numeric("multiplier", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("1"),

  potentialWin: numeric("potential_win", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  winAmount: numeric("win_amount", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  status: ticketItemStatusEnum("status").notNull().default("PENDING"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
