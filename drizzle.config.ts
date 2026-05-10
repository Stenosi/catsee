/**
 * Configurazione di drizzle-kit per generare/applicare migrazioni
 * e lanciare Drizzle Studio.
 *
 * Comandi npm utili (da definire in package.json):
 *   - npm run db:push       → sincronizza schema → DB (modalità MVP, semplice)
 *   - npm run db:generate   → genera file SQL di migrazione (per uso post-MVP)
 *   - npm run db:migrate    → applica migrazioni (per uso post-MVP)
 *   - npm run db:studio     → apre interfaccia visuale per esplorare il DB
 */

import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  schemaFilter: ['public'],
  tablesFilter: ['!spatial_ref_sys', '!geography_columns', '!geometry_columns'],
});
