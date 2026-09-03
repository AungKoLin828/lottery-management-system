import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ============================================================
   ANNOUNCEMENT TYPE
============================================================ */

export const announcementTypeEnum = pgEnum("announcement_type", [
  "INFO",
  "SUCCESS",
  "WARNING",
  "ERROR",
]);

/* ============================================================
   ANNOUNCEMENTS
============================================================ */

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  message: text("message").notNull(),

  type: announcementTypeEnum("type").notNull().default("INFO"),

  startAt: timestamp("start_at", {
    withTimezone: true,
  }).notNull(),

  endAt: timestamp("end_at", {
    withTimezone: true,
  }),

  isActive: boolean("is_active").notNull().default(true),
});
