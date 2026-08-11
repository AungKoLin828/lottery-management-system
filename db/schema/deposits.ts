import {
  pgEnum,
  pgTable,
  uuid,
  numeric,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";
import { paymentMethods } from "./paymentMethods";

export const depositStatusEnum = pgEnum("deposit_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const deposits = pgTable("deposits", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  requestedAmount: numeric("requested_amount", {
    precision: 18,
    scale: 2,
  }).notNull(),

  approvedAmount: numeric("approved_amount", {
    precision: 18,
    scale: 2,
  }),

  paymentMethodId: uuid("payment_method_id")
    .notNull()
    .references(() => paymentMethods.id),

  transactionNumber: varchar("transaction_number", {
    length: 150,
  }),

  status: depositStatusEnum("status").notNull().default("PENDING"),

  note: text("note"),

  rejectionReason: text("rejection_reason"),

  approvedBy: uuid("approved_by").references(() => users.id),

  approvedAt: timestamp("approved_at", {
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
