import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Coda di file su Cloudflare R2 da eliminare.
 *
 * Strategia:
 * 1. Quando un file viene "orfanato" (avatar sostituito, post eliminato,
 *    account eliminato), inseriamo una riga in questa tabella.
 * 2. Un job notturno (cron Vercel) processa le righe in stato 'pending':
 *    - tenta DELETE su R2
 *    - successo → marca 'deleted', cancella row dopo 7 giorni
 *    - fallimento → incrementa attempts, retry next night fino a max 5
 * 3. Dopo 5 fallimenti → stato 'failed', alerting per intervento manuale.
 *
 * Vantaggi rispetto a delete sincrono:
 * - se R2 è giù, l'azione utente non si blocca
 * - retry automatici
 * - storia tracciabile per debug
 */

export const cleanupStatusEnum = pgEnum('cleanup_status', [
  'pending',
  'deleted',
  'failed',
]);

/**
 * Tipo di file — utile per logging e debug, non strettamente necessario
 * (la chiave R2 è auto-descrittiva grazie al path tipo "avatars/uuid.jpg").
 */
export const cleanupFileTypeEnum = pgEnum('cleanup_file_type', [
  'avatar',
  'sighting_photo',
  'sighting_thumbnail',
]);

export const r2CleanupQueue = pgTable(
  'r2_cleanup_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Path completo del file su R2 (es. "avatars/uuid.jpg") */
    r2Key: text('r2_key').notNull(),

    fileType: cleanupFileTypeEnum('file_type').notNull(),

    status: cleanupStatusEnum('status').default('pending').notNull(),

    /** Numero di tentativi falliti */
    attempts: text('attempts').default('0').notNull(),

    /** Ultimo errore — utile per debug */
    lastError: text('last_error'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /** Quando è stato deletato (o tentato l'ultima volta) */
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    // Per il job notturno: "trova tutto pending"
    pendingIdx: index('r2_cleanup_pending_idx')
      .on(table.createdAt)
      .where(sql`status = 'pending'`),
  }),
);

export type R2CleanupItem = typeof r2CleanupQueue.$inferSelect;
export type NewR2CleanupItem = typeof r2CleanupQueue.$inferInsert;
