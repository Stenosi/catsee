import {
  pgTable,
  uuid,
  timestamp,
  primaryKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Relazione "X segue Y".
 * Composite PK (followerId, followedId) garantisce che la relazione sia unica.
 *
 * Per ottenere "seguaci di Mario" → WHERE followedId = mario.id
 * Per ottenere "seguiti da Mario" → WHERE followerId = mario.id
 */
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    followedId: uuid('followed_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followedId] }),

    // Indici reverse per query da entrambi i lati
    followedIdx: index('follows_followed_idx').on(table.followedId),

    // Constraint: un utente non può seguire se stesso
    noSelfFollow: check(
      'no_self_follow',
      sql`${table.followerId} <> ${table.followedId}`,
    ),
  }),
);

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
