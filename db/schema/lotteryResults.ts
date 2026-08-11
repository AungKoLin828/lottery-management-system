import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

import { lotteryDraws } from "./lotteryDraws";
import { users } from "./users";

export const lotteryResults = pgTable("lottery_results", {
  id: uuid("id").defaultRandom().primaryKey(),

  drawId: uuid("draw_id")
    .notNull()
    .unique()
    .references(() => lotteryDraws.id, {
      onDelete: "cascade",
    }),

  result: varchar("result", {
    length: 10,
  }).notNull(),

  setValue: varchar("set_value", {
    length: 20,
  }),

  value: varchar("value", {
    length: 20,
  }),

  note: text("note"),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),

  publishedAt: timestamp("published_at", {
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
