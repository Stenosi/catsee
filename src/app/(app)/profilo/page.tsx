import { db } from "@/db";
import { sightings, follows } from "@/db/schema";
import { eq, and, isNull, count, desc, inArray } from "drizzle-orm";
import { extractLat, extractLng } from "@/db/geo";
import { requireOnboardedSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ProfiloClient from "./_components/profilo-client";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

export default async function ProfiloPage() {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  const [user, [{ catCount }], [{ followerCount }], [{ followingCount }], posts, mapSightings] =
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
      db
        .select({ id: sightings.id, thumbnailKey: sightings.photoThumbnailKey, catNickname: sightings.catNickname })
        .from(sightings)
        .where(and(eq(sightings.userId, userId), eq(sightings.moderationStatus, 'approved'), isNull(sightings.deletedAt)))
        .orderBy(desc(sightings.createdAt))
        .limit(60),
      db
        .select({
          id: sightings.id,
          lat: extractLat(sightings.locationReal),
          lng: extractLng(sightings.locationReal),
          thumbnailKey: sightings.photoThumbnailKey,
          catNickname: sightings.catNickname,
          moderationStatus: sightings.moderationStatus,
        })
        .from(sightings)
        .where(and(
          eq(sightings.userId, userId),
          inArray(sightings.moderationStatus, ['approved', 'pending']),
          isNull(sightings.deletedAt),
        ))
        .orderBy(desc(sightings.createdAt))
        .limit(200),
    ])

  if (!user) redirect('/mappa');

  const postPreviews = posts.map((p) => ({
    id: p.id,
    thumbnailUrl: `${R2_PUBLIC_URL}/${p.thumbnailKey}`,
    catNickname: p.catNickname,
  }));

  const mapSightingsMapped = mapSightings.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    thumbnailUrl: `${R2_PUBLIC_URL}/${s.thumbnailKey}`,
    catNickname: s.catNickname,
    pending: s.moderationStatus === 'pending',
  }));

  return (
    <ProfiloClient
      nickname={user.nickname}
      username={user.username}
      bio={user.bio ?? null}
      avatarUrl={user.avatarUrl ?? null}
      catCount={catCount}
      followerCount={followerCount}
      followingCount={followingCount}
      posts={postPreviews}
      mapSightings={mapSightingsMapped}
    />
  );
}
