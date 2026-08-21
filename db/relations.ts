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
  /*
   * One user has one wallet
   */
  wallet: one(wallets),

  /*
   * One user can have many deposits
   */
  deposits: many(deposits),

  /*
   * One user can have many withdrawals
   */
  withdrawals: many(withdrawals),

  /*
   * One user can have many wallet transactions
   */
  transactions: many(transactions),

  /*
   * One user can have many lottery tickets
   */
  tickets: many(tickets),

  /*
   * One user can have many audit logs
   */
  auditLogs: many(auditLogs),
}));

/* ============================================================
   WALLETS
============================================================ */

export const walletsRelations = relations(wallets, ({ one }) => ({
  /*
   * Each wallet belongs to one user
   */
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

/* ============================================================
   DEPOSITS
============================================================ */

export const depositsRelations = relations(deposits, ({ one }) => ({
  /*
   * Deposit owner
   */
  user: one(users, {
    fields: [deposits.userId],
    references: [users.id],
  }),

  /*
   * Payment method used for deposit
   */
  paymentMethod: one(paymentMethods, {
    fields: [deposits.paymentMethodId],
    references: [paymentMethods.id],
  }),

  /*
   * Admin/user who approved the deposit
   */
  approvedByUser: one(users, {
    fields: [deposits.approvedBy],
    references: [users.id],
  }),
}));

/* ============================================================
   WITHDRAWALS
============================================================ */

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  /*
   * Withdrawal owner
   */
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),

  /*
   * Payment method used for withdrawal
   */
  paymentMethod: one(paymentMethods, {
    fields: [withdrawals.paymentMethodId],
    references: [paymentMethods.id],
  }),

  /*
   * Admin/user who approved the withdrawal
   */
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
    /*
     * One payment method can be used by many deposits
     */
    deposits: many(deposits),

    /*
     * One payment method can be used by many withdrawals
     */
    withdrawals: many(withdrawals),

    /*
     * One payment method can be used by many transactions
     */
    transactions: many(transactions),
  }),
);

/* ============================================================
   TRANSACTIONS
============================================================ */

export const transactionsRelations = relations(transactions, ({ one }) => ({
  /*
   * Transaction owner
   */
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),

  /*
   * Optional payment method
   */
  paymentMethod: one(paymentMethods, {
    fields: [transactions.paymentMethodId],
    references: [paymentMethods.id],
  }),

  /*
   * Admin/system user who created the transaction
   */
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
    /*
     * One draw has one result
     */
    result: one(lotteryResults),

    /*
     * One draw can have many ticket items
     */
    ticketItems: many(ticketItems),
  }),
);

/* ============================================================
   LOTTERY RESULTS
============================================================ */

export const lotteryResultsRelations = relations(lotteryResults, ({ one }) => ({
  /*
   * Result belongs to one draw
   */
  draw: one(lotteryDraws, {
    fields: [lotteryResults.drawId],
    references: [lotteryDraws.id],
  }),

  /*
   * User/admin who created the result
   */
  createdByUser: one(users, {
    fields: [lotteryResults.createdBy],
    references: [users.id],
  }),
}));

/* ============================================================
   TICKETS
============================================================ */

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  /*
   * Ticket belongs to one player
   */
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),

  /*
   * One ticket can contain many ticket items
   */
  items: many(ticketItems),
}));

/* ============================================================
   TICKET ITEMS
============================================================ */

export const ticketItemsRelations = relations(ticketItems, ({ one }) => ({
  /*
   * Ticket item belongs to one ticket
   */
  ticket: one(tickets, {
    fields: [ticketItems.ticketId],
    references: [tickets.id],
  }),

  /*
   * Ticket item belongs to one lottery draw
   */
  draw: one(lotteryDraws, {
    fields: [ticketItems.drawId],
    references: [lotteryDraws.id],
  }),
}));

/* ============================================================
   AUDIT LOGS
============================================================ */

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  /*
   * Audit log belongs to one user
   */
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
