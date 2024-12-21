// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgTableCreator,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { env } from "~/env";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name: string) => `price_history_${name}`,
);

export const priceHistory = createTable(
  env.NEXT_PUBLIC_PROJECT_NAME,
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    collectionAddress: varchar("collection_address", { length: 42 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    timestamp: integer("timestamp").notNull(),
    priceNative: numeric("price_native"),
    priceUsd: numeric("price_usd", { scale: 2 }),
    nativeToken: varchar("native_token"),
    holders: integer("holders"),
    listingQty: integer("listing_qty"),
    volumeNativeToken: numeric("volume_native_token"),
    volumeUsd: numeric("volume_usd", { scale: 2 }),
  },
  (table) => ({
    collectionAddressIndex: index("collection_address_idx").on(
      table.collectionAddress,
    ),
  }),
);
