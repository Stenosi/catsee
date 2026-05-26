'use server';

import { db } from '@/db';
import { follows } from '@/db/schema/follows';
import { users } from '@/db/schema/users';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { requireOnboardedSession } from '@/lib/session';

export type FollowUser = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
};

export async function fetchFollowers(): Promise<FollowUser[]> {
  const session = await requireOnboardedSession();

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(and(eq(follows.followedId, session.user.id), isNull(users.deletedAt)))
    .orderBy(desc(follows.createdAt));

  return rows;
}

export async function fetchFollowing(): Promise<FollowUser[]> {
  const session = await requireOnboardedSession();

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followedId, users.id))
    .where(and(eq(follows.followerId, session.user.id), isNull(users.deletedAt)))
    .orderBy(desc(follows.createdAt));

  return rows;
}
