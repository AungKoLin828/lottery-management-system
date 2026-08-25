import {
  pgTable,
  uuid,
  varchar,
  date,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const publicHolidays = pgTable(
  "public_holidays",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    date: date("date", {
      mode: "string",
    }).notNull(),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dateUniqueIndex: uniqueIndex("public_holidays_date_unique").on(table.date),
  }),
);
