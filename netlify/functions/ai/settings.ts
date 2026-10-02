import { sql } from "drizzle-orm";

import { db } from "../utils/db";

/* ============================================================
   TYPES
============================================================ */

export interface AISupportSettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

/* ============================================================
   CONSTANTS
============================================================ */

const SETTINGS_ID = 1;

/* ============================================================
   ENVIRONMENT DEFAULT
============================================================ */

function getEnvironmentDefault(): boolean {
  const value =
    process.env.AI_SUPPORT_ENABLED;

  if (
    value === undefined ||
    value === null
  ) {
    return true;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "off" ||
    normalized === "no"
  ) {
    return false;
  }

  return true;
}

/* ============================================================
   ENSURE TABLE
============================================================ */

async function ensureTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_support_settings (
      id INTEGER PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NULL
    )
  `);
}

/* ============================================================
   ENSURE DEFAULT ROW
============================================================ */

async function ensureDefaultRow(): Promise<void> {
  const defaultEnabled =
    getEnvironmentDefault();

  await db.execute(sql`
    INSERT INTO ai_support_settings (
      id,
      enabled,
      updated_at,
      updated_by
    )
    VALUES (
      ${SETTINGS_ID},
      ${defaultEnabled},
      NOW(),
      NULL
    )
    ON CONFLICT (id)
    DO NOTHING
  `);
}

/* ============================================================
   GET SETTINGS
============================================================ */

export async function getAISupportSettings(): Promise<AISupportSettings> {
  await ensureTable();

  await ensureDefaultRow();

  const result =
    await db.execute(sql`
      SELECT
        enabled,
        updated_at,
        updated_by
      FROM ai_support_settings
      WHERE id = ${SETTINGS_ID}
      LIMIT 1
    `);

  const rows =
    result.rows as Array<{
      enabled:
        | boolean
        | string;

      updated_at:
        | string
        | Date
        | null;

      updated_by:
        | string
        | null;
    }>;

  const row =
    rows[0];

  if (!row) {
    return {
      enabled:
        getEnvironmentDefault(),

      updatedAt: null,

      updatedBy: null,
    };
  }

  const enabled =
    typeof row.enabled ===
    "boolean"
      ? row.enabled
      : String(row.enabled)
          .toLowerCase() ===
        "true";

  return {
    enabled,

    updatedAt:
      row.updated_at
        ? new Date(
            row.updated_at,
          ).toISOString()
        : null,

    updatedBy:
      row.updated_by ??
      null,
  };
}

/* ============================================================
   GET ONLY ENABLED
============================================================ */

export async function getAISupportEnabled(): Promise<boolean> {
  const settings =
    await getAISupportSettings();

  return settings.enabled;
}

/* ============================================================
   UPDATE
============================================================ */

export async function setAISupportEnabled(
  enabled: boolean,
  updatedBy: string | null,
): Promise<AISupportSettings> {
  await ensureTable();

  await db.execute(sql`
    INSERT INTO ai_support_settings (
      id,
      enabled,
      updated_at,
      updated_by
    )
    VALUES (
      ${SETTINGS_ID},
      ${enabled},
      NOW(),
      ${updatedBy}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      enabled = EXCLUDED.enabled,
      updated_at = NOW(),
      updated_by = EXCLUDED.updated_by
  `);

  return getAISupportSettings();
}