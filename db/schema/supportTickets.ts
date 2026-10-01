import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

import { users } from "./users";

/* ============================================================
   SUPPORT TICKET STATUS
============================================================ */

export const supportTicketStatusEnum = pgEnum(
  "support_ticket_status",
  [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
  ],
);

/* ============================================================
   SUPPORT TICKET PRIORITY
============================================================ */

export const supportTicketPriorityEnum = pgEnum(
  "support_ticket_priority",
  [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ],
);

/* ============================================================
   SUPPORT MESSAGE SENDER
============================================================ */

export const supportMessageSenderEnum = pgEnum(
  "support_message_sender",
  [
    "PLAYER",
    "ADMIN",
    "AI",
  ],
);

/* ============================================================
   SUPPORT TICKETS
============================================================ */

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    subject: varchar("subject", {
      length: 200,
    }).notNull(),

    status: supportTicketStatusEnum(
      "status",
    )
      .notNull()
      .default("OPEN"),

    priority: supportTicketPriorityEnum(
      "priority",
    )
      .notNull()
      .default("NORMAL"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
);

/* ============================================================
   SUPPORT TICKET MESSAGES
============================================================ */

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    ticketId: uuid("ticket_id")
      .notNull()
      .references(
        () => supportTickets.id,
        {
          onDelete: "cascade",
        },
      ),

    senderType: supportMessageSenderEnum(
      "sender_type",
    ).notNull(),

    message: text("message").notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .defaultNow()
      .notNull(),
  },
);