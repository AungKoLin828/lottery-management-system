import { Pool } from "pg";

export interface AISupportSettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

const SETTINGS_ID = 1;

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not configured");
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  return pool;
}

function getEnvironmentDefault(): boolean {
  const value = process.env.AI_SUPPORT_ENABLED;
  if (value == null) return true;
  const normalized = value.trim().toLowerCase();
  return !["false", "0", "off", "no"].includes(normalized);
}

async function ensureTable(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS ai_support_settings (
      id INTEGER PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NULL
    )
  `);
}

async function ensureDefaultRow(): Promise<void> {
  await getPool().query(
    `
      INSERT INTO ai_support_settings
        (id, enabled, updated_at, updated_by)
      VALUES ($1, $2, NOW(), NULL)
      ON CONFLICT (id) DO NOTHING
    `,
    [SETTINGS_ID, getEnvironmentDefault()],
  );
}

export async function getAISupportSettings(): Promise<AISupportSettings> {
  await ensureTable();
  await ensureDefaultRow();

  const result = await getPool().query(
    `
      SELECT enabled, updated_at, updated_by
      FROM ai_support_settings
      WHERE id = $1
      LIMIT 1
    `,
    [SETTINGS_ID],
  );

  const row = result.rows[0] as
    | { enabled: boolean | string; updated_at: string | Date | null; updated_by: string | null }
    | undefined;

  if (!row) {
    return {
      enabled: getEnvironmentDefault(),
      updatedAt: null,
      updatedBy: null,
    };
  }

  return {
    enabled:
      typeof row.enabled === "boolean"
        ? row.enabled
        : String(row.enabled).toLowerCase() === "true",
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : null,
    updatedBy: row.updated_by ?? null,
  };
}

export async function getAISupportEnabled(): Promise<boolean> {
  return (await getAISupportSettings()).enabled;
}

export async function setAISupportEnabled(
  enabled: boolean,
  updatedBy: string | null,
): Promise<AISupportSettings> {
  await ensureTable();

  await getPool().query(
    `
      INSERT INTO ai_support_settings
        (id, enabled, updated_at, updated_by)
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by
    `,
    [SETTINGS_ID, enabled, updatedBy],
  );

  return getAISupportSettings();
}
