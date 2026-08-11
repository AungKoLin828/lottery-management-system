import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "DEPOSIT",
  "WITHDRAW",
  "BOTH",
]);

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  type: paymentMethodTypeEnum("type").notNull().default("BOTH"),

  accountName: varchar("account_name", {
    length: 150,
  }),

  accountNumber: varchar("account_number", {
    length: 100,
  }),

  bankName: varchar("bank_name", {
    length: 150,
  }),

  branch: varchar("branch", {
    length: 150,
  }),

  qrCode: varchar("qr_code", {
    length: 500,
  }),

  enabled: boolean("enabled").notNull().default(true),

  displayOrder: integer("display_order").notNull().default(0),

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
