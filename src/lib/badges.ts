import { db } from '@/db';
import { sightings, userBadges } from '@/db/schema';
import { eq, and, isNull, sql, count } from 'drizzle-orm';

export type BadgeTrigger = 'publish';

interface PublishContext {
  timestamp?: Date;
}

const COLORS_LIST = ['black', 'gray', 'white', 'cream', 'orange', 'cinnamon', 'brown', 'siamese', 'tabby', 'other'] as const;

const COLOR_BADGE_MAP: Record<string, string> = {
  black: 'color_black_5',
  gray: 'color_gray_5',
  white: 'color_white_5',
  cream: 'color_cream_5',
  orange: 'color_orange_5',
  cinnamon: 'color_cinnamon_5',
  brown: 'color_brown_5',
  siamese: 'color_siamese_5',
  tabby: 'color_tabby_5',
  other: 'color_other_5',
};

function computeStreak(daysDesc: string[]): number {
  if (daysDesc.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < daysDesc.length; i++) {
    const d1 = new Date(daysDesc[i - 1] + 'T00:00:00Z');
    const d2 = new Date(daysDesc[i] + 'T00:00:00Z');
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function checkAndAwardBadges(
  userId: string,
  trigger: BadgeTrigger,
  context: PublishContext = {},
): Promise<string[]> {
  if (trigger !== 'publish') return [];

  const ts = context.timestamp ?? new Date();
  const awarded: string[] = [];

  const baseFilter = and(
    eq(sightings.userId, userId),
    eq(sightings.moderationStatus, 'approved'),
    isNull(sightings.deletedAt),
  );

  // Run all data queries in parallel
  const [
    existingBadgeRows,
    totalResult,
    streakRows,
    colorEntriesArr,
    furRows,
    typeRows,
  ] = await Promise.all([
    db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId)),
    db.select({ total: count() }).from(sightings).where(baseFilter),
    db.selectDistinct({ day: sql<string>`(${sightings.createdAt} AT TIME ZONE 'UTC')::date::text` })
      .from(sightings)
      .where(baseFilter)
      .orderBy(sql`(${sightings.createdAt} AT TIME ZONE 'UTC')::date::text DESC`),
    Promise.all(COLORS_LIST.map(async (color) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(sightings)
        .where(and(baseFilter, sql`${color} = ANY(${sightings.tagColors})`));
      return [color, value] as const;
    })),
    db.select({ fur: sightings.tagFur, cnt: count() }).from(sightings).where(baseFilter).groupBy(sightings.tagFur),
    db.select({ catType: sightings.catType, cnt: count() }).from(sightings).where(baseFilter).groupBy(sightings.catType),
  ]);

  const existing = new Set(existingBadgeRows.map((r) => r.badgeId));
  const total = totalResult[0]?.total ?? 0;
  const streak = computeStreak(streakRows.map((r) => r.day));
  const colorCounts = Object.fromEntries(colorEntriesArr);
  const furCounts = Object.fromEntries(furRows.map((r) => [r.fur, r.cnt]));
  const typeCounts = Object.fromEntries(typeRows.map((r) => [r.catType, r.cnt]));

  async function tryAward(badgeId: string): Promise<void> {
    if (existing.has(badgeId)) return;
    try {
      await db.insert(userBadges).values({ userId, badgeId });
      awarded.push(badgeId);
      existing.add(badgeId);
    } catch {
      // FK violation (badge not in catalog) or race condition — ignore
    }
  }

  const checks: Array<Promise<void>> = [];

  // Milestone
  if (total >= 1) checks.push(tryAward('first_cat'));
  if (total >= 5) checks.push(tryAward('explorer_5'));
  if (total >= 10) checks.push(tryAward('cat_hunter_10'));
  if (total >= 50) checks.push(tryAward('cat_master_50'));
  if (total >= 100) checks.push(tryAward('cat_legend_100'));

  // Streak
  if (streak >= 2) checks.push(tryAward('streak_2'));
  if (streak >= 7) checks.push(tryAward('streak_7'));
  if (streak >= 14) checks.push(tryAward('streak_14'));
  if (streak >= 30) checks.push(tryAward('streak_30'));

  // Time (UTC hour)
  const hour = ts.getUTCHours();
  if (hour >= 22 || hour < 6) checks.push(tryAward('night_owl'));
  if (hour >= 5 && hour < 8) checks.push(tryAward('early_bird'));
  if (hour >= 17 && hour < 20) checks.push(tryAward('golden_hour'));

  // Color (target 5 each)
  for (const color of COLORS_LIST) {
    if ((colorCounts[color] ?? 0) >= 5) {
      checks.push(tryAward(COLOR_BADGE_MAP[color]));
    }
  }
  // Legacy panther_5 badge (same condition as color_black_5)
  if ((colorCounts['black'] ?? 0) >= 5) checks.push(tryAward('panther_5'));

  // Fur
  const shortCount = furCounts['short'] ?? 0;
  const longCount = furCounts['long'] ?? 0;
  if (shortCount >= 5) checks.push(tryAward('fur_short_5'));
  if (shortCount >= 10) checks.push(tryAward('fur_short_10'));
  if (longCount >= 5) checks.push(tryAward('fur_long_5'));
  if (longCount >= 10) checks.push(tryAward('fur_long_10'));

  // Type (stray + community = stray group)
  const strayCount = (typeCounts['stray'] ?? 0) + (typeCounts['community'] ?? 0);
  const domesticCount = typeCounts['domestic'] ?? 0;
  if (strayCount >= 5) checks.push(tryAward('type_stray_5'));
  if (strayCount >= 10) checks.push(tryAward('type_stray_10'));
  if (domesticCount >= 5) checks.push(tryAward('type_domestic_5'));
  if (domesticCount >= 10) checks.push(tryAward('type_domestic_10'));

  // Seasonal (based on timestamp UTC)
  const month = ts.getUTCMonth() + 1; // 1–12
  const day = ts.getUTCDate();
  const weekday = ts.getUTCDay(); // 0 = Sun, 5 = Fri

  if (month >= 3 && month <= 5) checks.push(tryAward('spring_cat'));
  if (month >= 6 && month <= 8) checks.push(tryAward('summer_cat'));
  if (month >= 9 && month <= 11) checks.push(tryAward('autumn_cat'));
  if (month === 12 || month <= 2) checks.push(tryAward('winter_cat'));

  if (day === 1 && month === 1) checks.push(tryAward('new_year_cat'));
  if (day === 25 && month === 12) checks.push(tryAward('christmas_cat'));
  if (day === 15 && month === 8) checks.push(tryAward('ferragosto'));
  if (day === 31 && month === 10) checks.push(tryAward('halloween_cat'));
  if (day === 13 && weekday === 5) checks.push(tryAward('friday_13'));

  await Promise.all(checks);

  // all_seasons: after all season badges are processed
  const seasonBadges = ['spring_cat', 'summer_cat', 'autumn_cat', 'winter_cat'];
  if (seasonBadges.every((b) => existing.has(b))) {
    await tryAward('all_seasons');
  }

  return awarded;
}
