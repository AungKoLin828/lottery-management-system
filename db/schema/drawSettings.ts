import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const drawSettings = pgTable("draw_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  enable2DDraw: boolean("enable_2d_draw").notNull().default(true),

  enable3DDraw: boolean("enable_3d_draw").notNull().default(true),

  twoDDrawTime: varchar("two_d_draw_time", {
    length: 5,
  })
    .notNull()
    .default("16:30"),

  threeDDrawTime: varchar("three_d_draw_time", {
    length: 5,
  })
    .notNull()
    .default("16:30"),

  ticketClosingTime2D: varchar("ticket_closing_time_2d", {
    length: 5,
  })
    .notNull()
    .default("16:00"),

  ticketClosingTime3D: varchar("ticket_closing_time_3d", {
    length: 5,
  })
    .notNull()
    .default("16:00"),

  manualResultEntry: boolean("manual_result_entry").notNull().default(true),

  resultPublishing: boolean("result_publishing").notNull().default(true),

  drawStatus: varchar("draw_status", {
    length: 20,
  })
    .notNull()
    .default("Open"),

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
