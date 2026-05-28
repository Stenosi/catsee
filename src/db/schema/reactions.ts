import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { sightings } from './sightings';

/**
 * Set fisso di emoji per le reazioni MVP.
 * Salvato come stringa text e validato a livello applicazione,
 * così è banale aggiungere nuove emoji in v2 senza migrazioni.
 */
export const REACTION_EMOJIS = ['❤️', '😍', '😺', '🤩', '😂'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/**
 * Una reazione di un utente a un post.
 * Composite primary key (userId, sightingId) → un utente può avere
 * UNA sola reazione per post (UPDATE per cambiarla).
 */
export const reactions = pgTable(
  'reactions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    sightingId: uuid('sighting_id')
      .notNull()
      .references(() => sightings.id, { onDelete: 'cascade' }),

    emoji: text('emoji').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.sightingId] }),

    // Per "vedi tutte le reazioni di un post" - count + raggruppamento per emoji
    sightingIdx: index('reactions_sighting_idx').on(table.sightingId),
  }),
);

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
