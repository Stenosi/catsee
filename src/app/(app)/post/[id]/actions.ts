'use server';

import { db } from '@/db';
import { sightings } from '@/db/schema/sightings';
import { users } from '@/db/schema/users';
import { reactions, REACTION_EMOJIS, type ReactionEmoji } from '@/db/schema/reactions';
import { extractLat, extractLng } from '@/db/geo';
import { R2_PUBLIC_URL } from '@/lib/r2';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export type PostDetail = {
  id: string;
  photoUrl: string;
  thumbnailUrl: string;
  catNickname: string;
  note: string | null;
  tagColors: string[];
  tagFur: 'short' | 'long';
  catType: 'stray' | 'domestic' | 'community';
  createdAt: Date;
  aiVerified: boolean;
  lat: number;
  lng: number;
  user: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  isOwner: boolean;
};

export async function fetchPostCatName(id: string): Promise<string | null> {
  const rows = await db
    .select({ catNickname: sightings.catNickname })
    .from(sightings)
    .where(and(eq(sightings.id, id), isNull(sightings.deletedAt)))
    .limit(1);
  return rows[0]?.catNickname ?? null;
}

export async function fetchPostDetail(id: string): Promise<PostDetail | null> {
  const session = await getSession();
  const currentUserId = session?.user?.id ?? null;

  const rows = await db
    .select({
      id: sightings.id,
      photoKey: sightings.photoKey,
      photoThumbnailKey: sightings.photoThumbnailKey,
      catNickname: sightings.catNickname,
      note: sightings.note,
      tagColors: sightings.tagColors,
      tagFur: sightings.tagFur,
      catType: sightings.catType,
      createdAt: sightings.createdAt,
      aiVerified: sightings.aiVerified,
      lat: extractLat(sightings.locationFuzzed),
      lng: extractLng(sightings.locationFuzzed),
      userId: sightings.userId,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
    })
    .from(sightings)
    .innerJoin(users, eq(sightings.userId, users.id))
    .where(
      and(
        eq(sightings.id, id),
        eq(sightings.moderationStatus, 'approved'),
        eq(sightings.visibility, 'public'),
        isNull(sightings.deletedAt),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];

  const [reactionRows, myReactionRows] = await Promise.all([
    db
      .select({
        emoji: reactions.emoji,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(eq(reactions.sightingId, id))
      .groupBy(reactions.emoji),

    currentUserId
      ? db
          .select({ emoji: reactions.emoji })
          .from(reactions)
          .where(and(eq(reactions.sightingId, id), eq(reactions.userId, currentUserId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactionRows) {
    reactionCounts[r.emoji] = r.count;
  }

  return {
    id: row.id,
    photoUrl: `${R2_PUBLIC_URL}/${row.photoKey}`,
    thumbnailUrl: `${R2_PUBLIC_URL}/${row.photoThumbnailKey}`,
    catNickname: row.catNickname,
    note: row.note,
    tagColors: row.tagColors,
    tagFur: row.tagFur as 'short' | 'long',
    catType: row.catType as 'stray' | 'domestic' | 'community',
    createdAt: row.createdAt,
    aiVerified: row.aiVerified,
    lat: row.lat,
    lng: row.lng,
    user: {
      id: row.userId,
      username: row.username,
      nickname: row.nickname,
      avatarUrl: row.avatarUrl,
    },
    reactionCounts,
    myReaction: myReactionRows[0]?.emoji ?? null,
    isOwner: currentUserId === row.userId,
  };
}

export async function toggleReaction(
  sightingId: string,
  emoji: string,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false };

  if (!REACTION_EMOJIS.includes(emoji as ReactionEmoji)) return { success: false };

  const userId = session.user.id;

  const existing = await db
    .select({ emoji: reactions.emoji })
    .from(reactions)
    .where(and(eq(reactions.sightingId, sightingId), eq(reactions.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].emoji === emoji) {
      await db
        .delete(reactions)
        .where(and(eq(reactions.sightingId, sightingId), eq(reactions.userId, userId)));
    } else {
      await db
        .update(reactions)
        .set({ emoji })
        .where(and(eq(reactions.sightingId, sightingId), eq(reactions.userId, userId)));
    }
  } else {
    await db.insert(reactions).values({ userId, sightingId, emoji });
  }

  revalidatePath(`/post/${sightingId}`);
  return { success: true };
}
