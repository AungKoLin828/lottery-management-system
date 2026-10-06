import { Pool, type PoolClient } from "pg";

/*
 * ============================================================
 * SUPPORT DATABASE
 * ============================================================
 *
 * IMPORTANT:
 *
 * users.id in this project is UUID.
 *
 * Therefore support user IDs are stored as TEXT.
 *
 * We intentionally do NOT create a foreign key to users(id).
 *
 * This keeps the support system independent from the core
 * users table type and avoids UUID/integer migration problems.
 * ============================================================
 */

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not configured",
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
 * TABLE INITIALIZATION
 * ============================================================
 */

let ensurePromise: Promise<void> | null = null;

async function initializeSupportTables(): Promise<void> {
  const client: PoolClient = await getPool().connect();

  try {
    await client.query("BEGIN");

    /*
     * --------------------------------------------------------
     * CONVERSATIONS
     * --------------------------------------------------------
     */

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id SERIAL PRIMARY KEY,

        user_id TEXT NOT NULL,

        status VARCHAR(20) NOT NULL DEFAULT 'AI',

        language VARCHAR(20) NOT NULL DEFAULT 'en',

        last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT support_conversations_status_check
          CHECK (
            status IN ('AI', 'HUMAN', 'CLOSED')
          )
      )
    `);

    /*
     * --------------------------------------------------------
     * MESSAGES
     * --------------------------------------------------------
     */

    await client.query(`
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
     * IMPORTANT MIGRATION
     *
     * Older version may have:
     *
     * user_id INTEGER REFERENCES users(id)
     *
     * That FK is incompatible with UUID users.id.
     *
     * Remove it first.
     * --------------------------------------------------------
     */

    await client.query(`
      ALTER TABLE support_conversations
      DROP CONSTRAINT IF EXISTS
        support_conversations_user_id_fkey
    `);

    /*
     * Convert old INTEGER user_id -> TEXT.
     *
     * If already TEXT, PostgreSQL handles this safely.
     */

    await client.query(`
      ALTER TABLE support_conversations
      ALTER COLUMN user_id TYPE TEXT
      USING user_id::text
    `);

    /*
     * Convert sender_id -> TEXT.
     */

    await client.query(`
      ALTER TABLE support_messages
      ALTER COLUMN sender_id TYPE TEXT
      USING sender_id::text
    `);

    /*
     * --------------------------------------------------------
     * INDEXES
     * --------------------------------------------------------
     */

    await client.query(`
      CREATE INDEX IF NOT EXISTS
        idx_support_conversations_user_status
      ON support_conversations (
        user_id,
        status,
        updated_at DESC
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
        idx_support_conversations_last_message
      ON support_conversations (
        last_message_at DESC
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
        idx_support_messages_conversation
      ON support_messages (
        conversation_id,
        created_at ASC
      )
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureSupportTables(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = initializeSupportTables().catch(
      (error) => {
        ensurePromise = null;
        throw error;
      },
    );
  }

  await ensurePromise;
}

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

export interface SupportConversation {
  id: number;
  userId: string;
  status: SupportConversationStatus;
  language: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
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
 * MAPPERS
 * ============================================================
 */

function mapConversation(
  row: Record<string, unknown>,
): SupportConversation {
  return {
    id: Number(row.id),

    userId: String(row.user_id),

    status:
      String(
        row.status ?? "AI",
      ) as SupportConversationStatus,

    language: String(
      row.language ?? "en",
    ),

    lastMessageAt:
      new Date(
        String(row.last_message_at),
      ).toISOString(),

    createdAt:
      new Date(
        String(row.created_at),
      ).toISOString(),

    updatedAt:
      new Date(
        String(row.updated_at),
      ).toISOString(),
  };
}

function mapMessage(
  row: Record<string, unknown>,
): SupportMessage {
  return {
    id: Number(row.id),

    conversationId:
      Number(row.conversation_id),

    senderType:
      String(
        row.sender_type,
      ) as SupportSenderType,

    senderId:
      row.sender_id == null
        ? null
        : String(row.sender_id),

    message:
      String(row.message ?? ""),

    intent:
      row.intent == null
        ? null
        : String(row.intent),

    confidence:
      row.confidence == null
        ? null
        : String(row.confidence),

    createdAt:
      new Date(
        String(row.created_at),
      ).toISOString(),
  };
}

/*
 * ============================================================
 * CONVERSATIONS
 * ============================================================
 */

export async function findActiveConversation(
  userId: string,
): Promise<SupportConversation | null> {
  await ensureSupportTables();

  const result = await getPool().query(
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
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(result.rows[0]);
}

export async function createConversation(
  userId: string,
  language = "en",
): Promise<SupportConversation> {
  await ensureSupportTables();

  const result = await getPool().query(
    `
      INSERT INTO support_conversations (
        user_id,
        status,
        language
      )
      VALUES (
        $1,
        'AI',
        $2
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
    [userId, language],
  );

  return mapConversation(result.rows[0]);
}

export async function getOrCreateConversation(
  userId: string,
  language = "en",
): Promise<SupportConversation> {
  const existing =
    await findActiveConversation(userId);

  if (existing) {
    return existing;
  }

  return createConversation(
    userId,
    language,
  );
}

export async function getConversation(
  conversationId: number,
): Promise<SupportConversation | null> {
  await ensureSupportTables();

  const result = await getPool().query(
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

  return mapConversation(result.rows[0]);
}

export async function listConversations(
  limit = 100,
): Promise<SupportConversation[]> {
  await ensureSupportTables();

  const safeLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    500,
  );

  const result = await getPool().query(
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
        last_message_at DESC
      LIMIT $1
    `,
    [safeLimit],
  );

  return result.rows.map(mapConversation);
}

/*
 * ============================================================
 * MESSAGES
 * ============================================================
 */

export async function listMessages(
  conversationId: number,
  limit = 200,
): Promise<SupportMessage[]> {
  await ensureSupportTables();

  const safeLimit = Math.min(
    Math.max(Number(limit) || 200, 1),
    500,
  );

  const result = await getPool().query(
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
      ORDER BY created_at ASC
      LIMIT $2
    `,
    [conversationId, safeLimit],
  );

  return result.rows.map(mapMessage);
}

export async function addMessage(params: {
  conversationId: number;
  senderType: SupportSenderType;
  senderId?: string | null;
  message: string;
  intent?: string | null;
  confidence?: number | string | null;
}): Promise<SupportMessage> {
  await ensureSupportTables();

  const result = await getPool().query(
    `
      INSERT INTO support_messages (
        conversation_id,
        sender_type,
        sender_id,
        message,
        intent,
        confidence
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
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
      params.conversationId,
      params.senderType,
      params.senderId ?? null,
      params.message,
      params.intent ?? null,
      params.confidence ?? null,
    ],
  );

  await getPool().query(
    `
      UPDATE support_conversations
      SET
        last_message_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [params.conversationId],
  );

  return mapMessage(result.rows[0]);
}

/*
 * ============================================================
 * STATUS
 * ============================================================
 */

export async function updateConversationStatus(
  conversationId: number,
  status: SupportConversationStatus,
): Promise<SupportConversation | null> {
  await ensureSupportTables();

  const result = await getPool().query(
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
    [conversationId, status],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(result.rows[0]);
}

export async function conversationBelongsToUser(
  conversationId: number,
  userId: string,
): Promise<boolean> {
  await ensureSupportTables();

  const result = await getPool().query(
    `
      SELECT 1
      FROM support_conversations
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [conversationId, userId],
  );

  return result.rows.length > 0;
}