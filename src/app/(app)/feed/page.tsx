import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Users, Heart } from 'lucide-react';
import { getSession } from '@/lib/session';
import { fetchFollowingFeed } from './actions';
import FeedClient from './_components/feed-client';

export default async function FeedPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user?.id;

  const posts = isLoggedIn ? await fetchFollowingFeed() : [];

  if (!isLoggedIn) {
    return (
      <Empty className="h-full">
        <EmptyMedia>
          <Heart className="w-10 h-10 opacity-40" aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Accedi per vedere il tuo feed</EmptyTitle>
          <EmptyDescription>Segui altri utenti per vedere i loro avvistamenti qui.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/login" className={buttonVariants({ size: 'lg' })}>
            Accedi
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty className="h-full">
        <EmptyMedia>
          <Users className="w-10 h-10 opacity-40" aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Ancora nessun avvistamento</EmptyTitle>
          <EmptyDescription>Segui altri cacciatori di gatti per vedere i loro post qui.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/cerca" className={buttonVariants({ size: 'lg' })}>
            Cerca utenti
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return <FeedClient initialPosts={posts} />;
}
