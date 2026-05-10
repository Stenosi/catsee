import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Categoria del badge — usata per filtraggi e visualizzazione raggruppata.
 */
export const badgeCategoryEnum = pgEnum('badge_category', [
  'milestone', // contatori di gatti avvistati
  'streak',    // serie consecutive
  'time',      // basato su orario (notturno, ecc.)
  'color',     // basato su tag colore
  'special',   // edizioni speciali, eventi
]);

/**
 * Catalogo dei badge esistenti.
 * NON una tabella runtime — viene popolata dal seed (scripts/seed.ts).
 * In v2 potremo aggiungere/modificare badge dal pannello admin.
 *
 * `id` è un slug umano-leggibile (es. "first_cat", "night_owl") perché
 * è più espressivo nei log e referenze rispetto a un UUID.
 */
export const badges = pgTable('badges', {
  id: text('id').primaryKey(),

  /** Nome user-facing — es. "Primo Gatto" */
  name: text('name').notNull(),

  /** Descrizione user-facing — es. "Hai pubblicato il tuo primo avvistamento" */
  description: text('description').notNull(),

  /** Emoji o nome icona (per ora emoji unicode, in futuro path a SVG) */
  icon: text('icon').notNull(),

  category: badgeCategoryEnum('category').notNull(),

  /**
   * Ordine di display — per fissare un ordinamento coerente sul profilo.
   * Più basso = mostrato prima.
   */
  displayOrder: text('display_order').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

/**
 * Assegnazione di un badge a un utente.
 * Composite PK (userId, badgeId) — un badge può essere ottenuto una sola volta.
 */
export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    badgeId: text('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),

    unlockedAt: timestamp('unlocked_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.badgeId] }),

    // "Tutti i badge di un utente" → ordinati per data unlock
    userUnlockedIdx: index('user_badges_user_unlocked_idx').on(
      table.userId,
      table.unlockedAt,
    ),
  }),
);

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
