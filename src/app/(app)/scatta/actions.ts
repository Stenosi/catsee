'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '@/db';
import { sightings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { makePoint, fuzzCoordinates } from '@/db/geo';
import { requireOnboardedSession } from '@/lib/session';
import { containsProfanity } from '@/lib/obscenity';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// ── Presigned upload URLs ─────────────────────────────────────────────────────

export type GetUploadUrlsResult =
  | { success: true; photoKey: string; photoUploadUrl: string; thumbnailKey: string; thumbnailUploadUrl: string }
  | { success: false; error: string };

export async function getUploadUrls(): Promise<GetUploadUrlsResult> {
  await requireOnboardedSession();

  const id = randomUUID();
  const now = new Date();
  const prefix = `sightings/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const photoKey = `${prefix}/${id}.jpg`;
  const thumbnailKey = `${prefix}/${id}_thumb.jpg`;

  try {
    const [photoUploadUrl, thumbnailUploadUrl] = await Promise.all([
      getSignedUrl(r2, new PutObjectCommand({ Bucket: R2_BUCKET, Key: photoKey, ContentType: 'image/jpeg' }), { expiresIn: 300 }),
      getSignedUrl(r2, new PutObjectCommand({ Bucket: R2_BUCKET, Key: thumbnailKey, ContentType: 'image/jpeg' }), { expiresIn: 300 }),
    ]);
    return { success: true, photoKey, photoUploadUrl, thumbnailKey, thumbnailUploadUrl };
  } catch {
    return { success: false, error: 'Errore nella generazione del link di upload.' };
  }
}

// ── Publish sighting ──────────────────────────────────────────────────────────

const paletteColorSchema = z.object({ hex: z.string(), percentage: z.number() });

const publishSchema = z.object({
  photoKey: z.string().min(1),
  thumbnailKey: z.string().min(1),
  catName: z.string().min(1).max(30),
  colors: z.array(z.string()).min(1).max(3),
  furLength: z.enum(['short', 'long']),
  notes: z.string().max(200).optional(),
  pinLat: z.number(),
  pinLng: z.number(),
  extractedPalette: z.array(paletteColorSchema).optional(),
  aiVerified: z.boolean().optional(),
});

export type PublishSightingResult =
  | { success: true; photoUrl: string }
  | { success: false; error: string };

export async function publishSighting(data: z.infer<typeof publishSchema>): Promise<PublishSightingResult> {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  const parsed = publishSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Dati non validi.' };

  const { photoKey, thumbnailKey, catName, colors, furLength, notes, pinLat, pinLng, extractedPalette, aiVerified } = parsed.data;

  if (containsProfanity(catName)) return { success: false, error: 'Il nome contiene parole non ammesse.' };
  if (notes && containsProfanity(notes)) return { success: false, error: 'Le note contengono parole non ammesse.' };

  const userRow = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, userId))
    .then((r) => r[0]);

  const settings = userRow?.settings;
  const fuzzRadius = settings?.preciseLocation ? 0 : settings?.highPrivacy ? 300 : 150;
  const fuzzed = fuzzCoordinates(pinLat, pinLng, fuzzRadius);
  const verified = aiVerified === true;

  await db.insert(sightings).values({
    userId,
    photoKey,
    photoThumbnailKey: thumbnailKey,
    catNickname: catName.trim(),
    tagColors: colors,
    tagFur: furLength,
    note: notes?.trim() ?? null,
    extractedPalette: extractedPalette ?? [],
    locationReal: makePoint(pinLng, pinLat) as unknown as { lat: number; lng: number },
    locationFuzzed: makePoint(fuzzed.lng, fuzzed.lat) as unknown as { lat: number; lng: number },
    aiVerified: verified,
    moderationStatus: verified ? 'approved' : 'pending',
    visibility: 'public',
  });

  return { success: true, photoUrl: `${R2_PUBLIC_URL}/${photoKey}` };
}
