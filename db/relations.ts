import { relations } from "drizzle-orm";

import { users } from "./schema/users";
import { wallets } from "./schema/wallets";
import { deposits } from "./schema/deposits";
import { withdrawals } from "./schema/withdrawals";
import { transactions } from "./schema/transactions";
import { paymentMethods } from "./schema/paymentMethods";
import { lotteryDraws } from "./schema/lotteryDraws";
import { lotteryResults } from "./schema/lotteryResults";
import { tickets } from "./schema/tickets";
import { ticketItems } from "./schema/ticketItems";
import { auditLogs } from "./schema/auditLogs";

/* ============================================================
   USERS
============================================================ */

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets),
  deposits: many(deposits),
  withdrawals: many(withdrawals),
  transactions: many(transactions),
  tickets: many(tickets),
  auditLogs: many(auditLogs),
}));

/* ============================================================
   WALLETS
============================================================ */

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

/* ============================================================
   DEPOSITS
============================================================ */

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, {
    fields: [deposits.userId],
    references: [users.id],
  }),

  paymentMethod: one(paymentMethods, {
    fields: [deposits.paymentMethodId],
    references: [paymentMethods.id],
  }),

  approvedByUser: one(users, {
    fields: [deposits.approvedBy],
    references: [users.id],
  }),
}));

/* ============================================================
   WITHDRAWALS
============================================================ */

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),

  paymentMethod: one(paymentMethods, {
    fields: [withdrawals.paymentMethodId],
    references: [paymentMethods.id],
  }),

  approvedByUser: one(users, {
    fields: [withdrawals.approvedBy],
    references: [users.id],
  }),
}));

/* ============================================================
   PAYMENT METHODS
============================================================ */

export const paymentMethodsRelations = relations(
  paymentMethods,
  ({ many }) => ({
    deposits: many(deposits),
    withdrawals: many(withdrawals),
    transactions: many(transactions),
  }),
);

/* ============================================================
   TRANSACTIONS
============================================================ */

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),

  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),

  createdByUser: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
}));

/* ============================================================
   LOTTERY DRAWS
============================================================ */

export const lotteryDrawsRelations = relations(
  lotteryDraws,
  ({ one, many }) => ({
    result: one(lotteryResults),
    ticketItems: many(ticketItems),
  }),
);

/* ============================================================
   LOTTERY RESULTS
============================================================ */

export const lotteryResultsRelations = relations(lotteryResults, ({ one }) => ({
  draw: one(lotteryDraws, {
    fields: [lotteryResults.drawId],
    references: [lotteryDraws.id],
  }),

  createdByUser: one(users, {
    fields: [lotteryResults.createdBy],
    references: [users.id],
  }),
}));

/* ============================================================
   TICKETS
============================================================ */

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),

  items: many(ticketItems),
}));

/* ============================================================
   TICKET ITEMS
============================================================ */

export const ticketItemsRelations = relations(ticketItems, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketItems.ticketId],
    references: [tickets.id],
  }),

  draw: one(lotteryDraws, {
    fields: [ticketItems.drawId],
    references: [lotteryDraws.id],
  }),
}));

/* ============================================================
   AUDIT LOGS
============================================================ */

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
