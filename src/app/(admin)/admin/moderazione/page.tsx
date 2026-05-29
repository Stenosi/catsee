import { db } from '@/db';
import { sightings, users } from '@/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import PendingCard from '../_components/pending-card';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

export default async function ModerazionePage() {
  const pending = await db
    .select({
      id: sightings.id,
      photoThumbnailKey: sightings.photoThumbnailKey,
      catNickname: sightings.catNickname,
      note: sightings.note,
      tagColors: sightings.tagColors,
      tagFur: sightings.tagFur,
      aiVerified: sightings.aiVerified,
      createdAt: sightings.createdAt,
      userId: sightings.userId,
      authorNickname: users.nickname,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(sightings)
    .innerJoin(users, eq(sightings.userId, users.id))
    .where(and(eq(sightings.moderationStatus, 'pending'), isNull(sightings.deletedAt)))
    .orderBy(asc(sightings.createdAt))
    .limit(50);

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <span className="text-4xl mb-3">✅</span>
        <p className="text-base font-semibold text-foreground">Nessun post in coda</p>
        <p className="text-sm text-muted-foreground mt-1">Tutti gli avvistamenti sono stati moderati.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {pending.map((post) => (
        <PendingCard
          key={post.id}
          id={post.id}
          thumbnailUrl={`${R2_PUBLIC_URL}/${post.photoThumbnailKey}`}
          catNickname={post.catNickname ?? 'Senza nome'}
          note={post.note ?? null}
          tagColors={post.tagColors ?? []}
          tagFur={post.tagFur ?? null}
          aiVerified={post.aiVerified ?? false}
          createdAt={post.createdAt}
          authorNickname={post.authorNickname}
          authorUsername={post.authorUsername}
          authorAvatarUrl={post.authorAvatarUrl ?? null}
        />
      ))}
    </div>
  );
}
