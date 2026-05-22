import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import { badges, userBadges, sightings } from '@/db/schema';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Traguardi',
  streak: 'Serie',
  time: 'Orari',
  color: 'Colori',
  special: 'Speciali',
};

const CATEGORY_ORDER = ['milestone', 'streak', 'time', 'color', 'special'];

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

  // Calcola i progressi solo per badge non ancora sbloccati con target
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

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof rows>>((acc, cat) => {
    const items = rows.filter((r) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      {/* Contatore totale */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Badge sbloccati</span>
          <span className="font-semibold text-muted-foreground">{unlockedCount}/{rows.length}</span>
        </div>
        <Progress value={rows.length > 0 ? (unlockedCount / rows.length) * 100 : 0} />
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[category] ?? category}
          </h2>

          <div className="flex flex-wrap gap-3">
            {items.map((badge) => {
              const unlocked = badge.unlockedAt !== null;
              const progress = progressMap[badge.id] ?? null;
              const showProgress = !unlocked && badge.target !== null && badge.target > 1 && progress !== null;

              return (
                <div
                  key={badge.id}
                  className={cn(
                    'flex flex-1 basis-[40%] sm:basis-[30%] md:basis-[20%] lg:basis-[10%] flex-col items-center gap-1.5 rounded-xl p-3',
                    'border border-border bg-card',
                    !unlocked && 'opacity-50',
                  )}
                >
                  <div className="relative inline-flex" aria-hidden="true">
                    <span className={cn('text-3xl leading-none pb-0.5', !unlocked && 'grayscale opacity-70')}>
                      {badge.icon}
                    </span>
                    {showProgress && (
                      <span
                        className="text-3xl leading-none pb-0.5 absolute inset-0"
                        style={{
                          maskImage: `linear-gradient(to top, black ${Math.min((progress! / badge.target!) * 100, 100)}%, transparent ${Math.min((progress! / badge.target!) * 100, 100)}%)`,
                          WebkitMaskImage: `linear-gradient(to top, black ${Math.min((progress! / badge.target!) * 100, 100)}%, transparent ${Math.min((progress! / badge.target!) * 100, 100)}%)`,
                        }}
                      >
                        {badge.icon}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {badge.name}
                  </span>

                  {unlocked ? (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(badge.unlockedAt!).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  ) : showProgress ? (
                    <div className="w-full flex flex-col gap-1 mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Progress
                          value={Math.min((progress / badge.target!) * 100, 100)}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {progress}/{badge.target}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {badge.description}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {badge.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nessun badge disponibile al momento.
        </p>
      )}

    </div>
  );
}
