import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../../../db/schema/users";

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not configured");
    }

    pool = new Pool({
      connectionString: databaseUrl,

      max: 5,

      idleTimeoutMillis: 30_000,

      connectionTimeoutMillis: 15_000,

      ssl:
        process.env.DATABASE_SSL === "true"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });
  }

  return pool;
}

export const db = drizzle(getPool(), {
  schema,
});
