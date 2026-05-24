import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import { badges, userBadges, sightings } from '@/db/schema';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { BadgesClient, type BadgeRow } from './_components/badges-client';

const MILESTONE_IDS = ['first_cat', 'explorer_5', 'cat_hunter_10', 'cat_master_50'];

async function countApprovedSightings(userId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(sightings)
    .where(and(
      eq(sightings.userId, userId),
      eq(sightings.moderationStatus, 'approved'),
      isNull(sightings.deletedAt),
    ));
  return value;
}

async function countSightingsByColor(userId: string, color: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(sightings)
    .where(and(
      eq(sightings.userId, userId),
      eq(sightings.moderationStatus, 'approved'),
      isNull(sightings.deletedAt),
      sql`${color} = ANY(${sightings.tagColors})`,
    ));
  return value;
}

export default async function BadgePage() {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  const rows = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      category: badges.category,
      displayOrder: badges.displayOrder,
      target: badges.target,
      unlockedAt: userBadges.unlockedAt,
    })
    .from(badges)
    .leftJoin(
      userBadges,
      and(eq(userBadges.badgeId, badges.id), eq(userBadges.userId, userId)),
    )
    .orderBy(badges.displayOrder);

  const lockedWithTarget = rows.filter((r) => r.unlockedAt === null && r.target !== null);
  const needsMilestone = lockedWithTarget.some((r) => MILESTONE_IDS.includes(r.id));
  const needsBlack = lockedWithTarget.some((r) => r.id === 'panther_5');

  const [totalSightings, blackSightings] = await Promise.all([
    needsMilestone ? countApprovedSightings(userId) : Promise.resolve(0),
    needsBlack ? countSightingsByColor(userId, 'black') : Promise.resolve(0),
  ]);

  const progressMap: Record<string, number> = {};
  for (const r of lockedWithTarget) {
    if (MILESTONE_IDS.includes(r.id)) progressMap[r.id] = totalSightings;
    else if (r.id === 'panther_5') progressMap[r.id] = blackSightings;
  }

  const unlockedCount = rows.filter((r) => r.unlockedAt !== null).length;

  // Serialize for the Client Component (Dates → ISO strings)
  const items: BadgeRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    category: r.category,
    displayOrder: r.displayOrder,
    target: r.target,
    unlockedAt: r.unlockedAt ? r.unlockedAt.toISOString() : null,
    progress: progressMap[r.id] ?? null,
  }));

  return (
    <BadgesClient
      items={items}
      unlockedCount={unlockedCount}
      totalCount={rows.length}
    />
  );
}
