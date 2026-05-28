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

/**
 * Motivo della segnalazione - selezionato dall'utente al momento del report.
 */
export const reportReasonEnum = pgEnum('report_reason', [
  'not_a_cat',         // la foto non contiene un gatto
  'inappropriate',     // contenuto inappropriato (umani, nudità, violenza)
  'spam',              // contenuto ripetuto / commerciale
  'offensive_text',    // testo nelle note offensivo
  'other',             // altro (richiede note di chi segnala)
]);

/**
 * Stato della risoluzione admin.
 */
export const reportResolutionEnum = pgEnum('report_resolution', [
  'pending',           // non ancora gestita
  'dismissed',         // segnalazione respinta (post OK)
  'post_removed',      // post rimosso
  'user_warned',       // utente ricevuto un warning
  'user_banned',       // utente bannato
]);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    sightingId: uuid('sighting_id')
      .notNull()
      .references(() => sightings.id, { onDelete: 'cascade' }),

    /** Chi ha segnalato. NULL se l'autore è stato eliminato (anonymized). */
    reporterId: uuid('reporter_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    reason: reportReasonEnum('reason').notNull(),

    /** Note libere opzionali, max 500 char (più del normale per dettagli). */
    note: text('note'),

    // ── Resolution
    resolution: reportResolutionEnum('resolution').default('pending').notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    /** Quale admin ha risolto */
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Note interne dell'admin sulla risoluzione */
    resolutionNote: text('resolution_note'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Coda admin "report da risolvere"
    pendingIdx: index('reports_pending_idx')
      .on(table.createdAt)
      .where(sql`resolution = 'pending'`),

    // "Quanti report ha questo post" - usato per auto-hide a 5+
    sightingIdx: index('reports_sighting_idx').on(table.sightingId),

    // Un utente non può segnalare lo stesso post due volte
    uniqueReporterPost: unique('unique_reporter_per_sighting').on(
      table.sightingId,
      table.reporterId,
    ),
  }),
);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
