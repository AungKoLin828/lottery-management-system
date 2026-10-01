import {
  eq,
} from "drizzle-orm";

import {
  systemSettings,
} from "../../../db/schema/systemSettings";

import {
  db,
} from "../../../db";

const AI_SUPPORT_SETTING_KEY =
  "ai_support_enabled";

/* ============================================================
   ENVIRONMENT SWITCH
============================================================ */

function getEnvironmentAIEnabled(): boolean {
  const value =
    process.env.AI_SUPPORT_ENABLED;

  /*
   * Fail closed.
   *
   * If the environment variable does not
   * explicitly say true, AI generation is
   * considered disabled.
   */
  return (
    value?.trim().toLowerCase() ===
    "true"
  );
}

/* ============================================================
   DATABASE SWITCH
============================================================ */

export async function getDatabaseAIEnabled(): Promise<boolean> {
  const setting =
    await db
      .select({
        booleanValue:
          systemSettings.booleanValue,
      })
      .from(systemSettings)
      .where(
        eq(
          systemSettings.key,
          AI_SUPPORT_SETTING_KEY,
        ),
      )
      .limit(1);

  /*
   * If the setting does not exist,
   * default to false.
   */
  return (
    setting[0]?.booleanValue === true
  );
}

/* ============================================================
   EFFECTIVE AI STATUS
============================================================ */

export async function isAISupportEnabled(): Promise<boolean> {
  const environmentEnabled =
    getEnvironmentAIEnabled();

  if (!environmentEnabled) {
    return false;
  }

  const databaseEnabled =
    await getDatabaseAIEnabled();

  return databaseEnabled;
}

/* ============================================================
   STATUS DETAILS
============================================================ */

export async function getAIStatus() {
  const environmentEnabled =
    getEnvironmentAIEnabled();

  const databaseEnabled =
    await getDatabaseAIEnabled();

  return {
    environmentEnabled,

    databaseEnabled,

    enabled:
      environmentEnabled &&
      databaseEnabled,
  };
}