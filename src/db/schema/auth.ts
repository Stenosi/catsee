/**
 * Tabelle richieste da Auth.js (NextAuth v5) con DrizzleAdapter.
 *
 * Riferimento ufficiale:
 * https://authjs.dev/getting-started/adapters/drizzle
 *
 * NOTA: la tabella `users` è la NOSTRA in `users.ts` (con id UUID),
 * quindi le foreign key qui devono essere uuid.
 */

import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ============================================================================
// accounts — collegamenti OAuth
// ============================================================================

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),

    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  }),
);

// ============================================================================
// sessions — sessioni attive
// ============================================================================

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

// ============================================================================
// verificationTokens — magic link e verifiche email
// ============================================================================

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

// ============================================================================
// authenticators — passkey / WebAuthn (non MVP, lasciato per futuro)
// ============================================================================

export const authenticators = pgTable(
  'authenticators',
  {
    credentialID: text('credential_id').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credential_device_type').notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: text('transports'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.credentialID] }),
  }),
);