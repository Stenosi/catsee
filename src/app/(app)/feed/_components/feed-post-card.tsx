'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { FeedPost } from '../actions';

const COLOR_LABELS: Record<string, string> = {
  black: 'Nero',
  white: 'Bianco',
  gray: 'Grigio',
  orange: 'Arancione',
  brown: 'Marrone',
  tabby: 'Tigrato',
  other: 'Altro',
};

export default function FeedPostCard({ post }: { post: FeedPost }) {
  const [loaded, setLoaded] = useState(false);

  const dateFormatted = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(post.createdAt));

  return (
    <article className="flex flex-col border-b border-border last:border-b-0">
      {/* Header autore */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href={`/profilo/${post.user.username}`}
          className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
            {post.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.user.avatarUrl}
                alt={post.user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary uppercase">
                  {post.user.username.slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {post.user.nickname}
            </span>
            <span className="text-xs text-muted-foreground">@{post.user.username}</span>
          </div>
        </Link>
        <span className="text-xs text-muted-foreground shrink-0">{dateFormatted}</span>
      </div>

      {/* Foto */}
      <Link href={`/post/${post.id}`} className="block relative aspect-[4/3] bg-muted">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.photoUrl}
          alt={post.catNickname}
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/post/${post.id}`}
            className="text-base font-bold text-foreground hover:underline active:opacity-70"
          >
            {post.catNickname}
          </Link>
          {post.totalReactions > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {post.totalReactions} {post.totalReactions === 1 ? 'reazione' : 'reazioni'}
            </span>
          )}
        </div>

        {post.note && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.note}</p>
        )}

        {post.tagColors.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {post.tagColors.map((c) => (
              <span
                key={c}
                className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize"
              >
                {COLOR_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
