import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const settingTypeEnum = pgEnum("setting_type", [
  "GENERAL",
  "LOTTERY",
  "DEPOSIT",
  "WITHDRAW",
  "SYSTEM",
]);

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  key: varchar("key", {
    length: 100,
  })
    .notNull()
    .unique(),

  type: settingTypeEnum("type").notNull(),

  value: jsonb("value").notNull(),

  description: text("description"),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
