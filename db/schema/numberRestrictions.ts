import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ============================================================
   ENUM
============================================================ */

export const numberRestrictionTypeEnum = pgEnum("number_restriction_type", [
  "2D",
  "3D",
]);

/* ============================================================
   TABLE
============================================================ */

export const numberRestrictions = pgTable(
  "number_restrictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /*
     * Stored as text/varchar because leading zeros are important.
     *
     * Examples:
     * 2D -> "00", "01", "13", "99"
     * 3D -> "000", "001", "123", "999"
     */
    number: varchar("number", {
      length: 3,
    }).notNull(),

    type: numberRestrictionTypeEnum("type").notNull(),

    reason: varchar("reason", {
      length: 255,
    })
      .notNull()
      .default("Admin restriction"),

    isActive: boolean("is_active").notNull().default(true),

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
  },

  (table) => ({
    numberTypeUnique: unique("number_restrictions_number_type_unique").on(
      table.number,
      table.type,
    ),
  }),
);
