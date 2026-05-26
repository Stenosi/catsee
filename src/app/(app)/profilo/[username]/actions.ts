'use server';

import { db } from '@/db';
import { follows } from '@/db/schema/follows';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function toggleFollow(targetUserId: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false };

  const followerId = session.user.id;
  if (followerId === targetUserId) return { success: false };

  const existing = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followedId, targetUserId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followedId, targetUserId)));
  } else {
    await db.insert(follows).values({ followerId, followedId: targetUserId });
  }

  revalidatePath(`/profilo/${targetUserId}`);
  return { success: true };
}
