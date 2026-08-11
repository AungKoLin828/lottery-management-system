import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  date,
  time,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const lotteryTypeEnum = pgEnum("lottery_type", ["2D", "3D"]);

export const drawSessionEnum = pgEnum("draw_session", ["AM", "PM"]);

export const drawStatusEnum = pgEnum("draw_status", [
  "OPEN",
  "CLOSED",
  "DRAWN",
  "PUBLISHED",
]);

export const lotteryDraws = pgTable("lottery_draws", {
  id: uuid("id").defaultRandom().primaryKey(),

  lotteryType: lotteryTypeEnum("lottery_type").notNull(),

  drawDate: date("draw_date").notNull(),

  session: drawSessionEnum("session"),

  drawTime: time("draw_time"),

  status: drawStatusEnum("status").notNull().default("OPEN"),

  bettingOpen: boolean("betting_open").notNull().default(true),

  resultPublished: boolean("result_published").notNull().default(false),

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
