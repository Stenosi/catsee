'use server';

import { db } from '@/db';
import { sightings } from '@/db/schema/sightings';
import { users } from '@/db/schema/users';
import { extractLat, extractLng } from '@/db/geo';
import { R2_PUBLIC_URL } from '@/lib/r2';
import { eq, isNull, and, desc } from 'drizzle-orm';

const LIMIT = 500;

export type MapSighting = {
  id: string;
  lat: number;
  lng: number;
  thumbnailUrl: string;
  catNickname: string;
  tagColors: string[];
  createdAt: Date;
  username: string;
  avatarUrl: string | null;
};

export type FetchMapSightingsResult =
  | { success: true; sightings: MapSighting[] }
  | { success: false; error: string };

export async function fetchMapSightings(): Promise<FetchMapSightingsResult> {
  try {
    const rows = await db
      .select({
        id: sightings.id,
        lat: extractLat(sightings.locationFuzzed),
        lng: extractLng(sightings.locationFuzzed),
        photoThumbnailKey: sightings.photoThumbnailKey,
        catNickname: sightings.catNickname,
        tagColors: sightings.tagColors,
        createdAt: sightings.createdAt,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(sightings)
      .innerJoin(users, eq(sightings.userId, users.id))
      .where(
        and(
          eq(sightings.moderationStatus, 'approved'),
          eq(sightings.visibility, 'public'),
          isNull(sightings.deletedAt),
        ),
      )
      .orderBy(desc(sightings.createdAt))
      .limit(LIMIT);

    return {
      success: true,
      sightings: rows.map((r) => ({
        ...r,
        thumbnailUrl: `${R2_PUBLIC_URL}/${r.photoThumbnailKey}`,
      })),
    };
  } catch {
    return { success: false, error: 'Errore nel caricamento della mappa.' };
  }
}
