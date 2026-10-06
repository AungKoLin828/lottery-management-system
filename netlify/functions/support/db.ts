/*
 * ============================================================
 * SUPPORT CONVERSATION DATABASE
 * ============================================================
 *
 * This file manages:
 *
 *   support_conversations
 *   support_messages
 *
 * It intentionally uses PostgreSQL directly so that the new
 * conversation API does not modify the existing Drizzle schema.
 *
 * Existing lottery tables are not changed.
 * ============================================================
 */

import { Pool, type PoolClient } from "pg";

/* ============================================================
   TYPES
============================================================ */

export type ConversationStatus =
  | "AI"
  | "HUMAN"
  | "CLOSED";

export type SenderType =
  | "PLAYER"
  | "AI"
  | "ADMIN"
  | "SYSTEM";

export interface SupportConversation {
  id: number;
  userId: number;
  status: ConversationStatus;
  language: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: number;
  conversationId: number;
  senderType: SenderType;
  senderId: number | null;
  message: string;
  intent: string | null;
  confidence: string | number | null;
  createdAt: string;
}

/* ============================================================
   POOL
============================================================ */

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl =
      process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not configured.",
      );
    }

    pool = new Pool({
      connectionString:
        databaseUrl,

      max: 5,

      idleTimeoutMillis:
        30_000,

      connectionTimeoutMillis:
        15_000,

      ssl:
        process.env.DATABASE_SSL ===
        "true"
          ? {
              rejectUnauthorized:
                false,
            }
          : undefined,
    });
  }

  return pool;
}

/* ============================================================
   TABLE INITIALIZATION
============================================================ */

let tablesReady:
  | Promise<void>
  | null = null;

export async function ensureSupportTables(): Promise<void> {
  if (tablesReady) {
    return tablesReady;
  }

  tablesReady =
    (async () => {
      const client =
        await getPool().connect();

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS support_conversations (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
              REFERENCES users(id)
              ON DELETE CASCADE,

            status VARCHAR(20) NOT NULL
              DEFAULT 'AI'
              CHECK (
                status IN (
                  'AI',
                  'HUMAN',
                  'CLOSED'
                )
              ),

            language VARCHAR(20) NOT NULL
              DEFAULT 'en',

            last_message_at TIMESTAMPTZ NOT NULL
              DEFAULT NOW(),

            created_at TIMESTAMPTZ NOT NULL
              DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
              DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS support_messages (
            id SERIAL PRIMARY KEY,

            conversation_id INTEGER NOT NULL
              REFERENCES support_conversations(id)
              ON DELETE CASCADE,

            sender_type VARCHAR(20) NOT NULL
              CHECK (
                sender_type IN (
                  'PLAYER',
                  'AI',
                  'ADMIN',
                  'SYSTEM'
                )
              ),

            sender_id INTEGER NULL,

            message TEXT NOT NULL,

            intent TEXT NULL,

            confidence NUMERIC NULL,

            created_at TIMESTAMPTZ NOT NULL
              DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_conversations_user
          ON support_conversations(user_id);
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_conversations_status
          ON support_conversations(status);
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_conversations_last_message
          ON support_conversations(last_message_at DESC);
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
          ON support_messages(conversation_id, created_at);
        `);
      } catch (error) {
        tablesReady = null;
        throw error;
      } finally {
        client.release();
      }
    })();

  return tablesReady;
}

/* ============================================================
   HELPERS
============================================================ */

function mapConversation(
  row: Record<string, unknown>,
): SupportConversation {
  return {
    id: Number(row.id),

    userId: Number(
      row.user_id,
    ),

    status:
      String(
        row.status,
      ) as ConversationStatus,

    language:
      String(
        row.language ?? "en",
      ),

    lastMessageAt:
      new Date(
        String(
          row.last_message_at,
        ),
      ).toISOString(),

    createdAt:
      new Date(
        String(
          row.created_at,
        ),
      ).toISOString(),

    updatedAt:
      new Date(
        String(
          row.updated_at,
        ),
      ).toISOString(),
  };
}

function mapMessage(
  row: Record<string, unknown>,
): SupportMessage {
  return {
    id: Number(row.id),

    conversationId:
      Number(
        row.conversation_id,
      ),

    senderType:
      String(
        row.sender_type,
      ) as SenderType,

    senderId:
      row.sender_id === null ||
      row.sender_id === undefined
        ? null
        : Number(row.sender_id),

    message:
      String(
        row.message ?? "",
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
        String(
          row.created_at,
        ),
      ).toISOString(),
  };
}

/* ============================================================
   FIND ACTIVE CONVERSATION
============================================================ */

export async function findActiveConversation(
  userId: number,
): Promise<SupportConversation | null> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return mapConversation(
    result.rows[0],
  );
}

/* ============================================================
   CREATE CONVERSATION
============================================================ */

export async function createConversation(
  userId: number,
  language = "en",
  status: ConversationStatus = "AI",
): Promise<SupportConversation> {
  await ensureSupportTables();

  const result =
    await getPool().query(
      `
        INSERT INTO support_conversations (
          user_id,
          status,
          language
        )
        VALUES (
          $1,
          $2,
          $3
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
        status,
        language,
      ],
    );

  return mapConversation(
    result.rows[0],
  );
}

/* ============================================================
   GET OR CREATE ACTIVE CONVERSATION
============================================================ */

export async function getOrCreateConversation(
  userId: number,
  language = "en",
): Promise<SupportConversation> {
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
    "AI",
  );
}

/* ============================================================
   GET CONVERSATION
============================================================ */

export async function getConversation(
  conversationId: number,
): Promise<SupportConversation | null> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return mapConversation(
    result.rows[0],
  );
}

/* ============================================================
   LIST ADMIN CONVERSATIONS
============================================================ */

export async function listConversations(): Promise<
  SupportConversation[]
> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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
      `,
    );

  return result.rows.map(
    mapConversation,
  );
}

/* ============================================================
   LIST MESSAGES
============================================================ */

export async function listMessages(
  conversationId: number,
): Promise<SupportMessage[]> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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

/* ============================================================
   ADD MESSAGE
============================================================ */

export async function addMessage(
  conversationId: number,
  senderType: SenderType,
  senderId: number | null,
  message: string,
  intent: string | null = null,
  confidence: number | null = null,
): Promise<SupportMessage> {
  await ensureSupportTables();

  const client =
    await getPool().connect();

  try {
    await client.query(
      "BEGIN",
    );

    const result =
      await client.query(
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
          conversationId,
          senderType,
          senderId,
          message,
          intent,
          confidence,
        ],
      );

    await client.query(
      `
        UPDATE support_conversations
        SET
          last_message_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId],
    );

    await client.query(
      "COMMIT",
    );

    return mapMessage(
      result.rows[0],
    );
  } catch (error) {
    await client.query(
      "ROLLBACK",
    );

    throw error;
  } finally {
    client.release();
  }
}

/* ============================================================
   UPDATE CONVERSATION STATUS
============================================================ */

export async function updateConversationStatus(
  conversationId: number,
  status: ConversationStatus,
): Promise<SupportConversation> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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

  if (
    result.rows.length === 0
  ) {
    throw new Error(
      "Support conversation not found.",
    );
  }

  return mapConversation(
    result.rows[0],
  );
}

/* ============================================================
   VERIFY PLAYER OWNERSHIP
============================================================ */

export async function conversationBelongsToUser(
  conversationId: number,
  userId: number,
): Promise<boolean> {
  await ensureSupportTables();

  const result =
    await getPool().query(
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

  return (
    result.rows.length > 0
  );
}