// netlify/functions/utils/db.ts

import "dotenv/config";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as users from "../db/schema/users";
import * as wallets from "../db/schema/wallets";
import * as transactions from "../db/schema/transactions";
import * as deposits from "../db/schema/deposits";
import * as withdrawals from "../db/schema/withdrawals";
import * as paymentMethods from "../db/schema/paymentMethods";
import * as lotteryDraws from "../db/schema/lotteryDraws";
import * as lotteryResults from "../db/schema/lotteryResults";
import * as tickets from "../db/schema/tickets";
import * as ticketItems from "../db/schema/ticketItems";
import * as settings from "../db/schema/settings";
import * as auditLogs from "../db/schema/auditLogs";
import * as publicHolidays from "../db/schema/publicHolidays";
import * as numberRestrictions from "../db/schema/numberRestrictions";
import * as drawSettings from "../db/schema/drawSettings";
import * as lotteryNumberSettings from "../db/schema/lotteryNumberSettings";
import * as announcements from "../db/schema/announcements";

import * as relations from "../db/relations";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 5,

  idleTimeoutMillis: 30_000,

  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, {
  schema: {
    ...users,
    ...wallets,
    ...transactions,
    ...deposits,
    ...withdrawals,
    ...paymentMethods,
    ...lotteryDraws,
    ...lotteryResults,
    ...tickets,
    ...ticketItems,
    ...settings,
    ...auditLogs,
    ...announcements,

    ...drawSettings,
    ...publicHolidays,
    ...numberRestrictions,
    ...lotteryNumberSettings,

    ...relations,
  },
});

export { pool };

export {
  users,
  wallets,
  transactions,
  deposits,
  withdrawals,
  paymentMethods,
  lotteryDraws,
  lotteryResults,
  tickets,
  ticketItems,
  settings,
  auditLogs,
  publicHolidays,
  numberRestrictions,
  drawSettings,
  lotteryNumberSettings,
  announcements,
  relations,
};
