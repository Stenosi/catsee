import { db } from "@/db";
import { sightings, follows } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { requireOnboardedSession } from "@/lib/session";
import ProfiloClient from "./_components/profilo-client";

export default async function ProfiloPage() {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  const [user, [{ catCount }], [{ followerCount }], [{ followingCount }]] =
    await Promise.all([
      db.query.users.findFirst({
        where: (u, { eq, isNull, and }) =>
          and(
            eq(u.id, userId),
            isNull(u.deletedAt)
          ),
        columns: {
          id: true,
          nickname: true,
          username: true,
          bio: true,
          avatarUrl: true,
        },
      }),
      db
        .select({ catCount: count() })
        .from(sightings)
        .where(
          and(
            eq(sightings.userId, userId),
            eq(sightings.moderationStatus, "approved"),
            isNull(sightings.deletedAt),
          ),
        ),
      db
        .select({ followerCount: count() })
        .from(follows)
        .where(eq(follows.followedId, userId)),
      db
        .select({ followingCount: count() })
        .from(follows)
        .where(eq(follows.followerId, userId)),
    ])

  if (!user) { return null };

  return (
    <ProfiloClient
      nickname={user.nickname}
      username={user.username}
      bio={user.bio ?? null}
      avatarUrl={user.avatarUrl ?? null}
      catCount={catCount}
      followerCount={followerCount}
      followingCount={followingCount}
    />
  );
}
