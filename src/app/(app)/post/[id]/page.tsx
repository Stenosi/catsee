import { notFound } from 'next/navigation';
import Link from 'next/link';
import { REACTION_EMOJIS } from '@/db/schema/reactions';
import { fetchPostDetail } from './actions';
import PostReactions from './_components/post-reactions';

const COLOR_LABELS: Record<string, string> = {
  black: 'Nero',
  white: 'Bianco',
  gray: 'Grigio',
  orange: 'Arancione',
  brown: 'Marrone',
  tabby: 'Tigrato',
  other: 'Altro',
};

const FUR_LABELS: Record<string, string> = {
  short: 'Pelo corto',
  long: 'Pelo lungo',
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchPostDetail(id);

  if (!post) notFound();

  const dateFormatted = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(post.createdAt));

  return (
    <div className="flex flex-col min-h-full pb-[env(safe-area-inset-bottom)]">
      {/* Foto hero */}
      <div className="relative w-full aspect-3/4 bg-muted shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.photoUrl}
          alt={post.catNickname}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Contenuto */}
      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Autore */}
        <Link
          href={`/profilo/${post.user.username}`}
          className="flex items-center gap-3 active:opacity-70"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
            {post.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.user.avatarUrl}
                alt={post.user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary uppercase">
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
          <span className="ml-auto text-xs text-muted-foreground shrink-0">{dateFormatted}</span>
        </Link>

        {/* Nome gatto */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{post.catNickname}</h1>
          {post.note && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{post.note}</p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tagColors.map((c) => (
            <span
              key={c}
              className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize"
            >
              {COLOR_LABELS[c] ?? c}
            </span>
          ))}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {FUR_LABELS[post.tagFur] ?? post.tagFur}
          </span>
        </div>

        {/* Reazioni */}
        <PostReactions
          sightingId={post.id}
          emojis={REACTION_EMOJIS as unknown as string[]}
          reactionCounts={post.reactionCounts}
          myReaction={post.myReaction}
        />
      </div>
    </div>
  );
}
