/**
 * Helper per query geografiche con PostGIS.
 *
 * PostGIS lavora con tipi proprietari (geography, geometry) che Drizzle non
 * mappa direttamente. Questi helper costruiscono frammenti SQL sicuri
 * (parametrizzati) per le operazioni più comuni.
 *
 * Pattern d'uso:
 *
 *   import { sql } from 'drizzle-orm';
 *   import { sightings } from '@/db/schema';
 *   import { withinRadiusMeters, makePoint } from '@/db/geo';
 *
 *   // Tutti i post entro 5km dalla mia posizione
 *   const nearby = await db
 *     .select()
 *     .from(sightings)
 *     .where(withinRadiusMeters(sightings.locationFuzzed, myLat, myLng, 5000));
 */

import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Costruisce un POINT PostGIS in WKT (lng, lat) da inserire nel DB.
 * Notare l'ordine: lng prima, lat dopo (standard PostGIS).
 *
 * Esempio:
 *   await db.insert(sightings).values({
 *     ...,
 *     locationReal: makePoint(myLng, myLat),
 *   });
 */
export function makePoint(lng: number, lat: number): SQL {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

/**
 * WHERE condition: punto entro X metri da (lat, lng).
 * Usa ST_DWithin che sfrutta l'indice GIST → veloce.
 */
export function withinRadiusMeters(
  column: PgColumn,
  lat: number,
  lng: number,
  radiusMeters: number,
): SQL {
  return sql`ST_DWithin(${column}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`;
}

/**
 * Estrae lat/lng da una colonna geography per usarli nella SELECT.
 * Esempio:
 *   const result = await db
 *     .select({
 *       id: sightings.id,
 *       lat: extractLat(sightings.locationFuzzed),
 *       lng: extractLng(sightings.locationFuzzed),
 *     })
 *     .from(sightings);
 */
export function extractLat(column: PgColumn): SQL<number> {
  return sql<number>`ST_Y(${column}::geometry)`;
}

export function extractLng(column: PgColumn): SQL<number> {
  return sql<number>`ST_X(${column}::geometry)`;
}

/**
 * Distanza in metri tra una colonna geography e un punto.
 * Utile per ordinare per "vicinanza" o per mostrare "X metri da te".
 */
export function distanceMeters(
  column: PgColumn,
  lat: number,
  lng: number,
): SQL<number> {
  return sql<number>`ST_Distance(${column}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`;
}

/**
 * Calcola coordinate fuzzed lato app (NON SQL).
 * Sposta il punto in una direzione random entro `radiusMeters`.
 *
 * Implementazione: offset gaussiano in metri convertito in delta lat/lng.
 * Approssimazione valida ovunque tranne ai poli (acceptable per CatSee).
 *
 * @returns nuovo {lat, lng} fuzzato
 */
export function fuzzCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number = 150,
): { lat: number; lng: number } {
  // Random angle 0-2π
  const angle = Math.random() * 2 * Math.PI;
  // Random distance 0-radius (uniforme nell'area, non sul perimetro)
  const distance = Math.sqrt(Math.random()) * radiusMeters;

  // Conversione metri → gradi (approssimazione)
  const earthRadiusMeters = 6_378_137;
  const deltaLat = (distance * Math.cos(angle)) / earthRadiusMeters * (180 / Math.PI);
  const deltaLng =
    (distance * Math.sin(angle)) /
    (earthRadiusMeters * Math.cos((lat * Math.PI) / 180)) *
    (180 / Math.PI);

  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
  };
}
