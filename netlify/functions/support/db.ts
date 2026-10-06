/*
 * ============================================================
 * SUPPORT CONVERSATION DATABASE
 * ============================================================
 *
 * IMPORTANT
 *
 * The application's users.id is UUID.
 *
 * Therefore:
 *
 *   support_conversations.user_id -> TEXT
 *   support_messages.sender_id    -> TEXT
 *
 * We intentionally do NOT create a foreign key to users.id.
 *
 * This keeps the support system independent from the exact
 * database type used by the application's users table.
 *
 * Support conversation IDs and message IDs remain INTEGER.
 *
 * ============================================================
 */

import { Pool, type QueryResultRow } from "pg";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

export type SupportConversationStatus =
  | "AI"
  | "HUMAN"
  | "CLOSED";

export type SupportSenderType =
  | "PLAYER"
  | "AI"
  | "ADMIN"
  | "SYSTEM";

export interface SupportConversationRow {
  id: number;
  userId: string;
  status: SupportConversationStatus;
  language: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageRow {
  id: number;
  conversationId: number;
  senderType: SupportSenderType;
  senderId: string | null;
  message: string;
  intent: string | null;
  confidence: string | number | null;
  createdAt: string;
}

/*
 * ============================================================
 * DATABASE POOL
 * ============================================================
 */

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl =
      process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not configured.",
      );
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

/*
 * ============================================================
 * QUERY HELPER
 * ============================================================
 */

async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(text, values);
}

/*
 * ============================================================
 * ENSURE SUPPORT TABLES
 * ============================================================
 *
 * This function is safe to call from every support endpoint.
 *
 * IMPORTANT:
 *
 * We first remove the old incompatible FK if it exists.
 *
 * Then we make sure user_id/sender_id are TEXT.
 *
 * This fixes existing installations where an earlier version
 * created these columns as INTEGER.
 *
 * ============================================================
 */

let ensurePromise: Promise<void> | null = null;

export async function ensureSupportTables(): Promise<void> {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    /*
     * --------------------------------------------------------
     * SUPPORT CONVERSATIONS
     * --------------------------------------------------------
     *
     * NO FOREIGN KEY TO users.
     *
     * user_id stores the authenticated user's UUID as text.
     */

    await query(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'AI',
        language VARCHAR(20) NOT NULL DEFAULT 'en',
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT support_conversations_status_check
          CHECK (status IN ('AI', 'HUMAN', 'CLOSED'))
      )
    `);

    /*
     * --------------------------------------------------------
     * REMOVE OLD FOREIGN KEY
     * --------------------------------------------------------
     *
     * Older versions attempted:
     *
     * user_id INTEGER REFERENCES users(id)
     *
     * But users.id is UUID.
     *
     * Remove the old FK if it exists.
     */

    await query(`
      ALTER TABLE support_conversations
      DROP CONSTRAINT IF EXISTS support_conversations_user_id_fkey
    `);

    /*
     * --------------------------------------------------------
     * MIGRATE user_id TO TEXT
     * --------------------------------------------------------
     *
     * This handles an existing support_conversations table
     * created by the older implementation.
     *
     * INTEGER -> TEXT is safe.
     */

    await query(`
      ALTER TABLE support_conversations
      ALTER COLUMN user_id TYPE TEXT
      USING user_id::TEXT
    `);

    /*
     * --------------------------------------------------------
     * SUPPORT MESSAGES
     * --------------------------------------------------------
     *
     * sender_id also uses TEXT because authenticated IDs are
     * UUID strings.
     */

    await query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,

        conversation_id INTEGER NOT NULL,

        sender_type VARCHAR(20) NOT NULL,

        sender_id TEXT NULL,

        message TEXT NOT NULL,

        intent TEXT NULL,

        confidence NUMERIC NULL,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT support_messages_sender_type_check
          CHECK (
            sender_type IN (
              'PLAYER',
              'AI',
              'ADMIN',
              'SYSTEM'
            )
          ),

        CONSTRAINT support_messages_conversation_fk
          FOREIGN KEY (conversation_id)
          REFERENCES support_conversations(id)
          ON DELETE CASCADE
      )
    `);

    /*
     * --------------------------------------------------------
     * MIGRATE sender_id
     * --------------------------------------------------------
     */

    await query(`
      ALTER TABLE support_messages
      ALTER COLUMN sender_id TYPE TEXT
      USING sender_id::TEXT
    `);

    /*
     * --------------------------------------------------------
     * INDEXES
     * --------------------------------------------------------
     */

    await query(`
      CREATE INDEX IF NOT EXISTS
        support_conversations_user_id_idx
      ON support_conversations(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS
        support_conversations_status_idx
      ON support_conversations(status)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS
        support_conversations_last_message_idx
      ON support_conversations(last_message_at DESC)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS
        support_messages_conversation_id_idx
      ON support_messages(conversation_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS
        support_messages_created_at_idx
      ON support_messages(created_at)
    `);
  })().catch((error) => {
    /*
     * Allow a later request to retry initialization if the
     * database was temporarily unavailable.
     */

    ensurePromise = null;

    throw error;
  });

  return ensurePromise;
}

/*
 * ============================================================
 * DB -> APPLICATION MAPPERS
 * ============================================================
 */

function mapConversation(
  row: QueryResultRow,
): SupportConversationRow {
  return {
    id: Number(row.id),

    userId: String(row.user_id),

    status:
      String(
        row.status,
      ) as SupportConversationStatus,

    language:
      String(
        row.language ?? "en",
      ),

    lastMessageAt:
      new Date(
        row.last_message_at,
      ).toISOString(),

    createdAt:
      new Date(
        row.created_at,
      ).toISOString(),

    updatedAt:
      new Date(
        row.updated_at,
      ).toISOString(),
  };
}

function mapMessage(
  row: QueryResultRow,
): SupportMessageRow {
  return {
    id: Number(row.id),

    conversationId:
      Number(
        row.conversation_id,
      ),

    senderType:
      String(
        row.sender_type,
      ) as SupportSenderType,

    senderId:
      row.sender_id === null ||
      row.sender_id === undefined
        ? null
        : String(row.sender_id),

    message:
      String(
        row.message,
      ),

    intent:
      row.intent === null ||
      row.intent === undefined
        ? null
        : String(row.intent),

    confidence:
      row.confidence === null ||
      row.confidence === undefined
        ? null
        : String(row.confidence),

    createdAt:
      new Date(
        row.created_at,
      ).toISOString(),
  };
}

/*
 * ============================================================
 * FIND ACTIVE USER CONVERSATION
 * ============================================================
 */

export async function findActiveConversation(
  userId: string,
): Promise<SupportConversationRow | null> {
  await ensureSupportTables();

  const result = await query(
    `
      SELECT
        id,
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
      FROM support_conversations
      WHERE user_id = $1
        AND status <> 'CLOSED'
      ORDER BY last_message_at DESC
      LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(
    result.rows[0],
  );
}

/*
 * ============================================================
 * CREATE CONVERSATION
 * ============================================================
 */

export async function createConversation(
  userId: string,
  language = "en",
): Promise<SupportConversationRow> {
  await ensureSupportTables();

  const result = await query(
    `
      INSERT INTO support_conversations (
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        'AI',
        $2,
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING
        id,
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
    `,
    [
      userId,
      language,
    ],
  );

  return mapConversation(
    result.rows[0],
  );
}

/*
 * ============================================================
 * GET OR CREATE CONVERSATION
 * ============================================================
 */

export async function getOrCreateConversation(
  userId: string,
  language = "en",
): Promise<SupportConversationRow> {
  const existing =
    await findActiveConversation(
      userId,
    );

  if (existing) {
    return existing;
  }

  return createConversation(
    userId,
    language,
  );
}

/*
 * ============================================================
 * GET CONVERSATION
 * ============================================================
 */

export async function getConversation(
  conversationId: number,
): Promise<SupportConversationRow | null> {
  await ensureSupportTables();

  const result = await query(
    `
      SELECT
        id,
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
      FROM support_conversations
      WHERE id = $1
      LIMIT 1
    `,
    [conversationId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(
    result.rows[0],
  );
}

/*
 * ============================================================
 * CONVERSATION BELONGS TO USER
 * ============================================================
 */

export async function conversationBelongsToUser(
  conversationId: number,
  userId: string,
): Promise<boolean> {
  await ensureSupportTables();

  const result = await query(
    `
      SELECT 1
      FROM support_conversations
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [
      conversationId,
      userId,
    ],
  );

  return result.rows.length > 0;
}

/*
 * ============================================================
 * LIST ADMIN CONVERSATIONS
 * ============================================================
 */

export async function listConversations(): Promise<
  SupportConversationRow[]
> {
  await ensureSupportTables();

  const result = await query(
    `
      SELECT
        id,
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
      FROM support_conversations
      ORDER BY
        CASE status
          WHEN 'HUMAN' THEN 1
          WHEN 'AI' THEN 2
          WHEN 'CLOSED' THEN 3
          ELSE 4
        END,
        last_message_at DESC
    `,
  );

  return result.rows.map(
    mapConversation,
  );
}

/*
 * ============================================================
 * LIST CONVERSATION MESSAGES
 * ============================================================
 */

export async function listMessages(
  conversationId: number,
): Promise<SupportMessageRow[]> {
  await ensureSupportTables();

  const result = await query(
    `
      SELECT
        id,
        conversation_id,
        sender_type,
        sender_id,
        message,
        intent,
        confidence,
        created_at
      FROM support_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [conversationId],
  );

  return result.rows.map(
    mapMessage,
  );
}

/*
 * ============================================================
 * ADD MESSAGE
 * ============================================================
 */

export async function addMessage(
  conversationId: number,
  senderType: SupportSenderType,
  senderId: string | null,
  message: string,
  intent: string | null = null,
  confidence: number | string | null = null,
): Promise<SupportMessageRow> {
  await ensureSupportTables();

  const result = await query(
    `
      INSERT INTO support_messages (
        conversation_id,
        sender_type,
        sender_id,
        message,
        intent,
        confidence,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW()
      )
      RETURNING
        id,
        conversation_id,
        sender_type,
        sender_id,
        message,
        intent,
        confidence,
        created_at
    `,
    [
      conversationId,
      senderType,
      senderId,
      message,
      intent,
      confidence,
    ],
  );

  await query(
    `
      UPDATE support_conversations
      SET
        last_message_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [conversationId],
  );

  return mapMessage(
    result.rows[0],
  );
}

/*
 * ============================================================
 * UPDATE CONVERSATION STATUS
 * ============================================================
 */

export async function updateConversationStatus(
  conversationId: number,
  status: SupportConversationStatus,
): Promise<SupportConversationRow | null> {
  await ensureSupportTables();

  const result = await query(
    `
      UPDATE support_conversations
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        user_id,
        status,
        language,
        last_message_at,
        created_at,
        updated_at
    `,
    [
      conversationId,
      status,
    ],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(
    result.rows[0],
  );
}

/*
 * ============================================================
 * GET USER CONVERSATION HISTORY
 * ============================================================
 */

export async function getUserConversationHistory(
  userId: string,
  limit = 10,
): Promise<SupportMessageRow[]> {
  await ensureSupportTables();

  const safeLimit = Math.min(
    Math.max(
      Number(limit) || 10,
      1,
    ),
    50,
  );

  const result = await query(
    `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_type,
        m.sender_id,
        m.message,
        m.intent,
        m.confidence,
        m.created_at
      FROM support_messages m
      INNER JOIN support_conversations c
        ON c.id = m.conversation_id
      WHERE c.user_id = $1
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $2
    `,
    [
      userId,
      safeLimit,
    ],
  );

  return result.rows
    .map(mapMessage)
    .reverse();
}