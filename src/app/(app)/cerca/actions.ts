'use server';

import { db } from '@/db';
import { sightings } from '@/db/schema/sightings';
import { users } from '@/db/schema/users';
import { follows } from '@/db/schema/follows';
import { R2_PUBLIC_URL } from '@/lib/r2';
import { eq, and, isNull, count, sql, or, ilike, desc } from 'drizzle-orm';
import { reactions } from '@/db/schema/reactions';
import { getSession } from '@/lib/session';

export type ExploreThumb = {
  id: string;
  thumbnailUrl: string;
  catNickname: string;
};

export type UserResult = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  catCount: number;
  isFollowing: boolean;
};

export type SightingResult = {
  id: string;
  thumbnailUrl: string;
  catNickname: string;
  createdAt: Date;
  username: string;
  avatarUrl: string | null;
};

export type SearchResults = {
  users: UserResult[];
  sightings: SightingResult[];
};

export async function fetchExploreGrid(): Promise<ExploreThumb[]> {
  const rows = await db
    .select({
      id: sightings.id,
      photoThumbnailKey: sightings.photoThumbnailKey,
      catNickname: sightings.catNickname,
    })
    .from(sightings)
    .where(
      and(
        eq(sightings.moderationStatus, 'approved'),
        eq(sightings.visibility, 'public'),
        isNull(sightings.deletedAt),
      ),
    )
    .orderBy(sql`random()`)
    .limit(90);

  return rows.map((r) => ({
    id: r.id,
    thumbnailUrl: `${R2_PUBLIC_URL}/${r.photoThumbnailKey}`,
    catNickname: r.catNickname,
  }));
}

export async function search(query: string): Promise<SearchResults> {
  const term = query.trim();
  if (term.length < 1) return { users: [], sightings: [] };

  const session = await getSession();
  const currentUserId = session?.user?.id ?? null;

  const followerCountExpr = sql<number>`(SELECT COUNT(*) FROM follows f WHERE f.followed_id = ${users.id})::int`;
  const reactionCountExpr = sql<number>`(SELECT COUNT(*) FROM reactions r WHERE r.sighting_id = ${sightings.id})::int`;

  const [matchedUsers, matchedSightings] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        followerCount: followerCountExpr,
      })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(ilike(users.username, `%${term}%`), ilike(users.nickname, `%${term}%`)),
        ),
      )
      .orderBy(desc(followerCountExpr))
      .limit(10),

    db
      .select({
        id: sightings.id,
        photoThumbnailKey: sightings.photoThumbnailKey,
        catNickname: sightings.catNickname,
        createdAt: sightings.createdAt,
        username: users.username,
        avatarUrl: users.avatarUrl,
        reactionCount: reactionCountExpr,
      })
      .from(sightings)
      .innerJoin(users, eq(sightings.userId, users.id))
      .where(
        and(
          ilike(sightings.catNickname, `%${term}%`),
          eq(sightings.moderationStatus, 'approved'),
          eq(sightings.visibility, 'public'),
          isNull(sightings.deletedAt),
        ),
      )
      .orderBy(desc(reactionCountExpr))
      .limit(15),
  ]);

  // Arricchisci utenti con contatori e stato follow
  const userIds = matchedUsers.map((u) => u.id);
  const [catCounts, followingRows] = await Promise.all([
    userIds.length > 0
      ? db
          .select({ userId: sightings.userId, count: count() })
          .from(sightings)
          .where(
            and(
              eq(sightings.moderationStatus, 'approved'),
              isNull(sightings.deletedAt),
            ),
          )
          .groupBy(sightings.userId)
      : Promise.resolve([]),
    currentUserId
      ? db
          .select({ followedId: follows.followedId })
          .from(follows)
          .where(eq(follows.followerId, currentUserId))
      : Promise.resolve([]),
  ]);

  const catCountMap = new Map(catCounts.map((r) => [r.userId, r.count]));
  const followingSet = new Set(followingRows.map((r) => r.followedId));

  return {
    users: matchedUsers
      .filter((u) => u.id !== currentUserId)
      .map((u) => ({
        id: u.id,
        username: u.username,
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        catCount: catCountMap.get(u.id) ?? 0,
        isFollowing: followingSet.has(u.id),
      })),
    sightings: matchedSightings.map((s) => ({
      id: s.id,
      thumbnailUrl: `${R2_PUBLIC_URL}/${s.photoThumbnailKey}`,
      catNickname: s.catNickname,
      createdAt: s.createdAt,
      username: s.username,
      avatarUrl: s.avatarUrl,
    })),
  };
}
