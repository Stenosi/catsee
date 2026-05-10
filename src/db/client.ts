/**
 * Client Drizzle per Neon PostgreSQL.
 *
 * Usato in tutta l'app per fare query.
 * Esempio:
 *   import { db } from '@/db';
 *   import { users } from '@/db/schema';
 *   const result = await db.select().from(users);
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// Necessario per usare websockets in ambiente Node.js (es. job, scripts).
// Su edge runtime di Vercel non serve, ma non fa danno averlo.
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
