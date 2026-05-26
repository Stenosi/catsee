import { notFound } from 'next/navigation';
import { db } from '@/db';
import { sightings } from '@/db/schema/sightings';
import { follows } from '@/db/schema/follows';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { extractLat, extractLng } from '@/db/geo';
import { getSession } from '@/lib/session';
import ProfiloPubblicoClient from './_components/profilo-pubblico-client';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

export default async function ProfiloPubblicoPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getSession();
  const currentUserId = session?.user?.id ?? null;

  const targetUser = await db.query.users.findFirst({
    where: (u, { eq, isNull, and, ilike }) =>
      and(ilike(u.username, username), isNull(u.deletedAt)),
    columns: {
      id: true,
      username: true,
      nickname: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!targetUser) notFound();

  // Own profile → redirect handled by middleware, but just in case
  const isOwn = currentUserId === targetUser.id;

  const [
    [{ catCount }],
    [{ followerCount }],
    [{ followingCount }],
    posts,
    mapSightings,
    followRow,
  ] = await Promise.all([
    db
      .select({ catCount: count() })
      .from(sightings)
      .where(
        and(
          eq(sightings.userId, targetUser.id),
          eq(sightings.moderationStatus, 'approved'),
          eq(sightings.visibility, 'public'),
          isNull(sightings.deletedAt),
        ),
      ),
    db.select({ followerCount: count() }).from(follows).where(eq(follows.followedId, targetUser.id)),
    db.select({ followingCount: count() }).from(follows).where(eq(follows.followerId, targetUser.id)),
    db
      .select({
        id: sightings.id,
        thumbnailKey: sightings.photoThumbnailKey,
        catNickname: sightings.catNickname,
      })
      .from(sightings)
      .where(
        and(
          eq(sightings.userId, targetUser.id),
          eq(sightings.moderationStatus, 'approved'),
          eq(sightings.visibility, 'public'),
          isNull(sightings.deletedAt),
        ),
      )
      .orderBy(desc(sightings.createdAt))
      .limit(60),
    db
      .select({
        id: sightings.id,
        lat: extractLat(sightings.locationFuzzed),
        lng: extractLng(sightings.locationFuzzed),
        thumbnailKey: sightings.photoThumbnailKey,
        catNickname: sightings.catNickname,
      })
      .from(sightings)
      .where(
        and(
          eq(sightings.userId, targetUser.id),
          eq(sightings.moderationStatus, 'approved'),
          eq(sightings.visibility, 'public'),
          isNull(sightings.deletedAt),
        ),
      )
      .orderBy(desc(sightings.createdAt))
      .limit(200),
    currentUserId && !isOwn
      ? db
          .select({ followerId: follows.followerId })
          .from(follows)
          .where(
            and(eq(follows.followerId, currentUserId), eq(follows.followedId, targetUser.id)),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

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
    pending: false,
  }));

  return (
    <ProfiloPubblicoClient
      userId={targetUser.id}
      nickname={targetUser.nickname}
      username={targetUser.username}
      bio={targetUser.bio ?? null}
      avatarUrl={targetUser.avatarUrl ?? null}
      catCount={catCount}
      followerCount={followerCount}
      followingCount={followingCount}
      posts={postPreviews}
      mapSightings={mapSightingsMapped}
      isOwn={isOwn}
      isFollowing={followRow.length > 0}
      isLoggedIn={!!currentUserId}
    />
  );
}
