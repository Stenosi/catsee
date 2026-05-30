import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import { badges, userBadges, sightings } from '@/db/schema';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { BadgesClient, type BadgeRow } from './_components/badges-client';

const MILESTONE_IDS = ['first_cat', 'explorer_5', 'cat_hunter_10', 'cat_master_50', 'cat_legend_100'];

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

async function getFurCounts(userId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ fur: sightings.tagFur, cnt: count() })
    .from(sightings)
    .where(and(
      eq(sightings.userId, userId),
      eq(sightings.moderationStatus, 'approved'),
      isNull(sightings.deletedAt),
    ))
    .groupBy(sightings.tagFur);
  return Object.fromEntries(rows.map((r) => [r.fur, r.cnt]));
}

async function getTypeCounts(userId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ catType: sightings.catType, cnt: count() })
    .from(sightings)
    .where(and(
      eq(sightings.userId, userId),
      eq(sightings.moderationStatus, 'approved'),
      isNull(sightings.deletedAt),
    ))
    .groupBy(sightings.catType);
  return Object.fromEntries(rows.map((r) => [r.catType, r.cnt]));
}

function colorFromBadgeId(badgeId: string): string | null {
  if (badgeId === 'panther_5') return 'black';
  if (!badgeId.startsWith('color_')) return null;
  return badgeId.replace(/^color_/, '').replace(/_\d+$/, '');
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

  const needsTotal = lockedWithTarget.some((r) => MILESTONE_IDS.includes(r.id));
  const colorBadgesLocked = lockedWithTarget.filter((r) => colorFromBadgeId(r.id) !== null);
  const furBadgesLocked = lockedWithTarget.filter((r) => r.id.startsWith('fur_'));
  const typeBadgesLocked = lockedWithTarget.filter((r) => r.id.startsWith('type_'));

  // Unique colors needed for progress bars
  const colorsNeeded = [...new Set(colorBadgesLocked.map((r) => colorFromBadgeId(r.id)!))] as string[];

  const [
    totalSightings,
    colorCountsArr,
    furCounts,
    typeCounts,
  ] = await Promise.all([
    needsTotal ? countApprovedSightings(userId) : Promise.resolve(0),
    colorsNeeded.length > 0
      ? Promise.all(colorsNeeded.map(async (c) => [c, await countSightingsByColor(userId, c)] as const))
      : Promise.resolve([] as Array<readonly [string, number]>),
    furBadgesLocked.length > 0 ? getFurCounts(userId) : Promise.resolve({} as Record<string, number>),
    typeBadgesLocked.length > 0 ? getTypeCounts(userId) : Promise.resolve({} as Record<string, number>),
  ]);

  const colorCounts = Object.fromEntries(colorCountsArr);

  const progressMap: Record<string, number> = {};
  for (const r of lockedWithTarget) {
    if (MILESTONE_IDS.includes(r.id)) {
      progressMap[r.id] = totalSightings;
    } else {
      const color = colorFromBadgeId(r.id);
      if (color !== null) {
        progressMap[r.id] = colorCounts[color] ?? 0;
      } else if (r.id.startsWith('fur_')) {
        const fur = r.id.startsWith('fur_short') ? 'short' : 'long';
        progressMap[r.id] = furCounts[fur] ?? 0;
      } else if (r.id.startsWith('type_stray')) {
        progressMap[r.id] = (typeCounts['stray'] ?? 0) + (typeCounts['community'] ?? 0);
      } else if (r.id.startsWith('type_domestic')) {
        progressMap[r.id] = typeCounts['domestic'] ?? 0;
      }
    }
  }

  const unlockedCount = rows.filter((r) => r.unlockedAt !== null).length;

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
