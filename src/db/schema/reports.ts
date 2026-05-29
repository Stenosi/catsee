import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { sightings } from './sightings';

export const reportResolutionEnum = pgEnum('report_resolution', [
  'pending',           // non ancora gestita
  'dismissed',         // segnalazione respinta (post OK)
  'post_removed',      // post rimosso
  'user_warned',       // utente ricevuto un warning
  'user_banned',       // utente bannato
]);

/** Motivi validi per una segnalazione (validati a livello app). */
export const REPORT_REASONS = [
  'not_a_cat',              // la foto non contiene un gatto (solo per post)
  'inappropriate',          // contenuto inappropriato
  'inappropriate_avatar',   // foto profilo inappropriata (solo per utenti)
  'spam',                   // contenuto ripetuto / commerciale
  'offensive_text',         // testo offensivo
  'other',                  // altro
] as const;

export type ReportReason = typeof REPORT_REASONS[number];

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** FK al post segnalato. NULL se è una segnalazione utente. */
    sightingId: uuid('sighting_id')
      .references(() => sightings.id, { onDelete: 'cascade' }),

    /** FK all'utente segnalato. NULL se è una segnalazione post. */
    reportedUserId: uuid('reported_user_id')
      .references(() => users.id, { onDelete: 'set null' }),

    /** Chi ha segnalato. NULL se l'autore è stato eliminato (anonymized). */
    reporterId: uuid('reporter_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    /** Motivi selezionati (multi-select, validato a livello app). */
    reasons: text('reasons').array().notNull(),

    /** Note libere opzionali. */
    note: text('note'),

    // ── Resolution
    resolution: reportResolutionEnum('resolution').default('pending').notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    resolutionNote: text('resolution_note'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pendingIdx: index('reports_pending_idx')
      .on(table.createdAt)
      .where(sql`resolution = 'pending'`),

    sightingIdx: index('reports_sighting_idx').on(table.sightingId),

    // Un utente non può segnalare lo stesso post due volte
    uniqueReporterPost: unique('unique_reporter_per_sighting').on(
      table.sightingId,
      table.reporterId,
    ),

    // Un utente non può segnalare lo stesso utente due volte
    uniqueReporterUser: unique('unique_reporter_per_user').on(
      table.reportedUserId,
      table.reporterId,
    ),
  }),
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
