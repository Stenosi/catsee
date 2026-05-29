/**
 * One-time migration: aggiorna la tabella reports
 * - rinomina reason (enum) → reasons (text[])
 * - rende sighting_id nullable
 * - aggiunge reported_user_id
 * - aggiunge unique constraint per user reports
 * - rimuove il vecchio enum report_reason
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Avvio migrazione reports...');

  // 1. Aggiungi colonna reasons (text[]) temporaneamente
  await sql`
    ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reasons text[] NOT NULL DEFAULT '{}'
  `;
  console.log('✓ Aggiunta colonna reasons');

  // 2. Copia i dati dalla vecchia colonna reason (enum) alla nuova reasons (text[])
  await sql`
    UPDATE reports SET reasons = ARRAY[reason::text] WHERE reasons = '{}'
  `;
  console.log('✓ Migrati dati da reason a reasons');

  // 3. Rimuovi la vecchia colonna reason
  await sql`
    ALTER TABLE reports DROP COLUMN IF EXISTS reason
  `;
  console.log('✓ Rimossa colonna reason');

  // 4. Rimuovi il DEFAULT dalla colonna reasons
  await sql`
    ALTER TABLE reports ALTER COLUMN reasons DROP DEFAULT
  `;
  console.log('✓ Rimosso default da reasons');

  // 5. Rendi sighting_id nullable (era NOT NULL)
  await sql`
    ALTER TABLE reports ALTER COLUMN sighting_id DROP NOT NULL
  `;
  console.log('✓ sighting_id ora nullable');

  // 6. Aggiungi colonna reported_user_id
  await sql`
    ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL
  `;
  console.log('✓ Aggiunta colonna reported_user_id');

  // 7. Aggiungi unique constraint per segnalazioni utenti
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_reporter_per_user'
      ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT unique_reporter_per_user UNIQUE (reported_user_id, reporter_id);
      END IF;
    END $$
  `;
  console.log('✓ Aggiunto unique constraint per user reports');

  // 8. Rimuovi il vecchio enum (opzionale, non è usato da nessuna colonna ora)
  await sql`
    DROP TYPE IF EXISTS report_reason
  `;
  console.log('✓ Rimosso enum report_reason');

  console.log('\n✅ Migrazione completata con successo!');
}

main().catch((err) => {
  console.error('❌ Errore durante la migrazione:', err);
  process.exit(1);
});
