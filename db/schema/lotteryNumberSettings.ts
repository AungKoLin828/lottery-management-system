import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const lotteryNumberSettings = pgTable("lottery_number_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  /*
   * 2D or 3D
   */
  lotteryType: varchar("lottery_type", {
    length: 10,
  }).notNull(),

  /*
   * Enable/disable this lottery type.
   */
  enabled: boolean("enabled").notNull().default(true),

  /*
   * Number length:
   *
   * 2D -> 2
   * 3D -> 3
   */
  numberLength: integer("number_length").notNull(),

  /*
   * Minimum bet amount in MMK.
   */
  minBet: integer("min_bet").notNull().default(100),

  /*
   * Maximum bet amount in MMK.
   */
  maxBet: integer("max_bet").notNull().default(100000),

  /*
   * Maximum number selections allowed
   * for one betting request.
   */
  maxNumberLimit: integer("max_number_limit").notNull().default(10),

  /*
   * Whether duplicate numbers can be selected.
   */
  allowDuplicateNumbers: boolean("allow_duplicate_numbers")
    .notNull()
    .default(false),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
