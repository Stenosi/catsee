import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';


// ============================================================================
// ENUM
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// ============================================================================
// TIPI TYPESCRIPT PER CAMPI JSON
// ============================================================================

/**
 * Settings utente — JSONB flessibile per accomodare future preferenze
 * senza migrazioni.
 */
export type UserSettings = {
  /** Se `true`, le coordinate dei post sono pubblicate esatte. Default false. */
  preciseLocation: boolean;
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  preciseLocation: false,
};

// ============================================================================
// TABELLA users
// ============================================================================

export const users = pgTable(
  'users',
  {
    // ── Identificatore
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Auth.js
    emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),

    // ── Identità
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    /** Timestamp dell'ultima modifica username — enforce regola "1 cambio ogni 30g" */
    usernameUpdatedAt: timestamp('username_updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    nickname: text('nickname').notNull(),
    bio: varchar('bio', { length: 150 }),
    avatarUrl: text('avatar_url'),

    // ── Permessi
    role: userRoleEnum('role').default('user').notNull(),

    // ── Ban (gestito dall'admin)
    banned: boolean('banned').default(false).notNull(),
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    bannedReason: text('banned_reason'),

    // ── Onboarding
    onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),

    // ── Preferenze
    settings: jsonb('settings')
      .$type<UserSettings>()
      .default(DEFAULT_USER_SETTINGS)
      .notNull(),

    // ── Timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /**
     * Soft delete. Quando un utente elimina l'account:
     *   1. settiamo `deletedAt` = now()
     *   2. anonimizziamo email/username (es. "deleted_<uuid>@catsee.local")
     *   3. eliminiamo avatar e foto post (job di pulizia)
     *   4. dopo 30 giorni, cancellazione hard via job
     */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    // Indici per ricerca veloce (usato da search bar e listing admin)
    nicknameIdx: index('users_nickname_idx').on(table.nickname),
    // Indice parziale per filtrare via gli utenti soft-deleted
    activeUsersIdx: index('users_active_idx')
      .on(table.id)
      .where(sql`deleted_at IS NULL`),
  }),
);

// ============================================================================
// TIPI INFERITI (per uso nel resto del codice)
// ============================================================================

/** Tipo di una riga `users` come restituita dal SELECT */
export type User = typeof users.$inferSelect;

/** Tipo accettato in INSERT (campi auto-generati sono opzionali) */
export type NewUser = typeof users.$inferInsert;
