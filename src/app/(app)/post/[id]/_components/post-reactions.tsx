'use client';

import { useOptimistic, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { toggleReaction } from '../actions';

interface Props {
  sightingId: string;
  emojis: string[];
  reactionCounts: Record<string, number>;
  myReaction: string | null;
}

type ReactionState = {
  counts: Record<string, number>;
  mine: string | null;
};

export default function PostReactions({ sightingId, emojis, reactionCounts, myReaction }: Props) {
  const [, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic<ReactionState, string>(
    { counts: reactionCounts, mine: myReaction },
    (state, emoji) => {
      const next = { ...state.counts };

      if (state.mine === emoji) {
        // remove
        next[emoji] = Math.max(0, (next[emoji] ?? 0) - 1);
        if (next[emoji] === 0) delete next[emoji];
        return { counts: next, mine: null };
      }

      if (state.mine) {
        // switch
        next[state.mine] = Math.max(0, (next[state.mine] ?? 0) - 1);
        if (next[state.mine] === 0) delete next[state.mine];
      }

      next[emoji] = (next[emoji] ?? 0) + 1;
      return { counts: next, mine: emoji };
    },
  );

  function handleTap(emoji: string) {
    startTransition(async () => {
      applyOptimistic(emoji);
      await toggleReaction(sightingId, emoji);
    });
  }

  const total = Object.values(optimistic.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        {emojis.map((emoji) => {
          const count = optimistic.counts[emoji] ?? 0;
          const isActive = optimistic.mine === emoji;

          return (
            <button
              key={emoji}
              onClick={() => handleTap(emoji)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                'border active:scale-95',
                isActive
                  ? 'bg-primary/10 border-primary/40 text-foreground'
                  : 'bg-muted border-transparent text-muted-foreground hover:border-border',
              )}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-xs font-medium">{count}</span>}
            </button>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          {total} {total === 1 ? 'reazione' : 'reazioni'}
        </p>
      )}
    </div>
  );
}
