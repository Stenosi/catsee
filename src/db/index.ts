/**
 * Re-export pubblico del modulo db.
 *
 * Uso:
 *   import { db, users, sightings } from '@/db';
 */

export { db } from './client';
export type { DB } from './client';
export * from './schema';
