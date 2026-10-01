import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";

/* ============================================================
   SYSTEM SETTINGS
============================================================ */

export const systemSettings = pgTable(
  "system_settings",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    /*
     * Unique machine-readable setting key.
     *
     * Examples:
     *
     * ai_support_enabled
     * maintenance_mode
     * registration_enabled
     */
    key: varchar("key", {
      length: 100,
    })
      .notNull()
      .unique(),

    /*
     * Boolean settings are stored here.
     *
     * For AI support:
     *
     * true  = AI generation enabled
     * false = AI generation disabled
     */
    booleanValue: boolean(
      "boolean_value",
    ),

    /*
     * Optional string value for future
     * settings that are not boolean.
     */
    stringValue: text(
      "string_value",
    ),

    /*
     * Optional description for admin UI.
     */
    description: varchar(
      "description",
      {
        length: 500,
      },
    ),

    /*
     * Last admin/user who changed this setting.
     */
    updatedBy: uuid("updated_by").references(
      () => users.id,
      {
        onDelete: "set null",
      },
    ),

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