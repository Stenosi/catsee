'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const SEEN_STORAGE_KEY = 'catsee_seen_badges';

const CONFETTI_COLORS = ['#e07828', '#f5a520', '#ffffff', '#fde8c8', '#c05518'];

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Traguardi',
  streak: 'Serie',
  time: 'Orari',
  color: 'Colori',
  special: 'Speciali',
};

const CATEGORY_ORDER = ['milestone', 'streak', 'time', 'color', 'special'];

export type BadgeRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  displayOrder: string;
  target: number | null;
  unlockedAt: string | null;
  progress: number | null;
};

type Props = {
  items: BadgeRow[];
  unlockedCount: number;
  totalCount: number;
};

export function BadgesClient({ items, unlockedCount, totalCount }: Props) {
  const [celebrateIds, setCelebrateIds] = useState<ReadonlySet<string>>(new Set());
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const unlockedIds = items.filter((b) => b.unlockedAt !== null).map((b) => b.id);
    if (unlockedIds.length === 0) return;

    let seen: Set<string>;
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      seen = raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set();
    } catch {
      seen = new Set();
    }

    const newIds = unlockedIds.filter((id) => !seen.has(id));
    if (newIds.length === 0) return;

    // Mark as seen immediately so re-renders don't re-trigger
    try {
      localStorage.setItem(
        SEEN_STORAGE_KEY,
        JSON.stringify([...seen, ...newIds]),
      );
    } catch {
      // storage full or blocked - ignore
    }

    // Confetti burst
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: CONFETTI_COLORS,
    });

    // Scroll to first new badge
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-badge-id="${newIds[0]}"]`,
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Pop animation fires after scroll settles
    const popTimer = setTimeout(() => {
      setCelebrateIds(new Set(newIds));
      setTimeout(() => setCelebrateIds(new Set()), 1600);
    }, 750);

    return () => clearTimeout(popTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = CATEGORY_ORDER.reduce<Record<string, BadgeRow[]>>((acc, cat) => {
    const catItems = items.filter((r) => r.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      {/* Contatore totale */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Badge sbloccati</span>
          <span className="font-semibold text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </div>
        <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} />
      </div>

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[category] ?? category}
          </h2>

          <div className="flex flex-wrap gap-3">
            {categoryItems.map((badge) => {
              const unlocked = badge.unlockedAt !== null;
              const showProgress =
                !unlocked &&
                badge.target !== null &&
                badge.target > 1 &&
                badge.progress !== null;
              const isCelebrating = celebrateIds.has(badge.id);

              return (
                <div
                  key={badge.id}
                  data-badge-id={badge.id}
                  className={cn(
                    'flex flex-1 basis-[40%] sm:basis-[30%] md:basis-[20%] lg:basis-[10%] flex-col items-center gap-1.5 rounded-xl p-3',
                    'border border-border bg-card',
                    !unlocked && 'opacity-50',
                    isCelebrating && 'badge-glow',
                  )}
                >
                  <div className="relative inline-flex" aria-hidden="true">
                    <span
                      className={cn(
                        'text-3xl leading-none pb-0.5',
                        !unlocked && 'grayscale opacity-70',
                      )}
                    >
                      {badge.icon}
                    </span>
                    {showProgress && (
                      <span
                        className="text-3xl leading-none pb-0.5 absolute inset-0"
                        style={{
                          maskImage: `linear-gradient(to top, black ${Math.min((badge.progress! / badge.target!) * 100, 100)}%, transparent ${Math.min((badge.progress! / badge.target!) * 100, 100)}%)`,
                          WebkitMaskImage: `linear-gradient(to top, black ${Math.min((badge.progress! / badge.target!) * 100, 100)}%, transparent ${Math.min((badge.progress! / badge.target!) * 100, 100)}%)`,
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
                          value={Math.min((badge.progress! / badge.target!) * 100, 100)}
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {badge.progress}/{badge.target}
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

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nessun badge disponibile al momento.
        </p>
      )}

    </div>
  );
}
