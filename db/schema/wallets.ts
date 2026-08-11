import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users";

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  balance: numeric("balance", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  totalDeposit: numeric("total_deposit", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  totalWithdraw: numeric("total_withdraw", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  totalBet: numeric("total_bet", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

  totalWin: numeric("total_win", {
    precision: 18,
    scale: 2,
  })
    .notNull()
    .default("0"),

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
