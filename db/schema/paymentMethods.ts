import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "Deposit",
  "Withdraw",
  "Both",
]);

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  type: paymentMethodTypeEnum("type").notNull(),

  enabled: boolean("enabled").notNull().default(true),

  accountName: varchar("account_name", {
    length: 150,
  }).notNull(),

  accountNumber: varchar("account_number", {
    length: 100,
  }).notNull(),

  bankName: varchar("bank_name", {
    length: 150,
  }),

  branch: varchar("branch", {
    length: 150,
  }),

  displayOrder: integer("display_order").notNull().default(1),

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
