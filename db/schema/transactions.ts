import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  numeric,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { paymentMethods } from "./paymentMethods";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "DEPOSIT",
  "WITHDRAW",
  "BET",
  "WIN",
  "ADJUSTMENT",
  "REFUND",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  type: transactionTypeEnum("type").notNull(),

  status: transactionStatusEnum("status").notNull().default("COMPLETED"),

  amount: numeric("amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  balanceBefore: numeric("balance_before", {
    precision: 18,
    scale: 2,
  }),

  balanceAfter: numeric("balance_after", {
    precision: 18,
    scale: 2,
  }),

  paymentMethodId: uuid("payment_method_id").references(
    () => paymentMethods.id,
  ),

  transactionNumber: varchar("transaction_number", {
    length: 150,
  }),

  referenceNumber: varchar("reference_number", {
    length: 150,
  }),

  note: text("note"),

  createdBy: uuid("created_by").references(() => users.id),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
