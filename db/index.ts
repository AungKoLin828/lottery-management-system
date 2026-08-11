import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as users from "./schema/users";
import * as wallets from "./schema/wallets";
import * as transactions from "./schema/transactions";
import * as deposits from "./schema/deposits";
import * as withdrawals from "./schema/withdrawals";
import * as paymentMethods from "./schema/paymentMethods";
import * as lotteryDraws from "./schema/lotteryDraws";
import * as lotteryResults from "./schema/lotteryResults";
import * as tickets from "./schema/tickets";
import * as ticketItems from "./schema/ticketItems";
import * as settings from "./schema/settings";
import * as auditLogs from "./schema/auditLogs";

import * as relations from "./relations";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    ...relations,
  },
});

export { pool };
