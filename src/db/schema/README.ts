/**
 * CatSee — Database Schema
 *
 * Drizzle ORM + PostgreSQL (Neon) + PostGIS extension
 *
 * Convenzioni:
 *   - TS: camelCase, DB: snake_case (Drizzle traduce automaticamente)
 *   - Tutte le PK sono UUID v4 generati lato DB
 *   - Tutti i timestamp sono `timestamp with time zone` (gestione TZ-safe)
 *   - Soft delete via `deletedAt` dove serve
 *
 * Layout file in `db/schema/`:
 *   - users.ts        → utenti
 *   - sightings.ts    → post di avvistamento
 *   - reactions.ts    → reazioni emoji ai post
 *   - follows.ts      → relazione segui/seguito
 *   - badges.ts       → catalogo badge + assegnazioni
 *   - reports.ts      → segnalazioni utenti
 *   - cleanup.ts      → coda di pulizia file su R2
 *   - auth.ts         → tabelle Auth.js (boilerplate)
 *   - index.ts        → re-export di tutto
 */

// Questo file è solo documentazione. Lo schema vero vive nei file separati.
// Importa da: import { users, sightings, ... } from '@/db/schema'
