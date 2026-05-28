'use server';

import { db } from '@/db';
import { sightings } from '@/db/schema/sightings';
import { users } from '@/db/schema/users';
import { follows } from '@/db/schema/follows';
import { reactions } from '@/db/schema/reactions';
import { R2_PUBLIC_URL } from '@/lib/r2';
import { eq, and, isNull, desc, inArray, sql, gt } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export type FeedPost = {
  id: string;
  photoUrl: string;
  thumbnailUrl: string;
  catNickname: string;
  tagColors: string[];
  note: string | null;
  createdAt: Date;
  totalReactions: number;
  user: {
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
};

const LIMIT = 40;

async function buildFeedPosts(
  rows: Array<{
    id: string;
    photoKey: string;
    photoThumbnailKey: string;
    catNickname: string;
    tagColors: string[];
    note: string | null;
    createdAt: Date;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  }>,
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const reactionRows = await db
    .select({
      sightingId: reactions.sightingId,
      count: sql<number>`count(*)::int`,
    })
    .from(reactions)
    .where(inArray(reactions.sightingId, ids))
    .groupBy(reactions.sightingId);

  const reactionMap = new Map<string, number>();
  for (const r of reactionRows) {
    reactionMap.set(r.sightingId, r.count);
  }

  return rows.map((r) => ({
    id: r.id,
    photoUrl: `${R2_PUBLIC_URL}/${r.photoKey}`,
    thumbnailUrl: `${R2_PUBLIC_URL}/${r.photoThumbnailKey}`,
    catNickname: r.catNickname,
    tagColors: r.tagColors,
    note: r.note,
    createdAt: r.createdAt,
    totalReactions: reactionMap.get(r.id) ?? 0,
    user: {
      username: r.username,
      nickname: r.nickname,
      avatarUrl: r.avatarUrl,
    },
  }));
}

const BASE_SELECT = {
  id: sightings.id,
  photoKey: sightings.photoKey,
  photoThumbnailKey: sightings.photoThumbnailKey,
  catNickname: sightings.catNickname,
  tagColors: sightings.tagColors,
  note: sightings.note,
  createdAt: sightings.createdAt,
  username: users.username,
  nickname: users.nickname,
  avatarUrl: users.avatarUrl,
} as const;

export async function fetchFollowingFeed(after?: Date): Promise<FeedPost[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  const followedIds = await db
    .select({ followedId: follows.followedId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  if (followedIds.length === 0) return [];

  const ids = followedIds.map((f) => f.followedId);

  const rows = await db
    .select(BASE_SELECT)
    .from(sightings)
    .innerJoin(users, eq(sightings.userId, users.id))
    .where(
      and(
        inArray(sightings.userId, ids),
        eq(sightings.moderationStatus, 'approved'),
        eq(sightings.visibility, 'public'),
        isNull(sightings.deletedAt),
        after ? gt(sightings.createdAt, after) : undefined,
      ),
    )
    .orderBy(desc(sightings.createdAt))
    .limit(after ? 20 : LIMIT);

  return buildFeedPosts(rows);
}

export async function fetchExploreFeed(): Promise<FeedPost[]> {
  const rows = await db
    .select(BASE_SELECT)
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

  return buildFeedPosts(rows);
}
