/**
 * Re-export centralizzato dello schema.
 *
 * Uso nel resto dell'app:
 *   import { users, sightings, eq } from '@/db/schema';
 */

export * from './users';
export * from './sightings';
export * from './reactions';
export * from './follows';
export * from './badges';
export * from './reports';
export * from './cleanup';
export * from './auth';
