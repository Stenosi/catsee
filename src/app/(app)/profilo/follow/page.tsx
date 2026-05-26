import { Suspense } from 'react';
import { fetchFollowers, fetchFollowing } from '../actions';
import FollowTabs from './_components/follow-tabs';

export default async function FollowPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const defaultTab = tab === 'seguiti' ? 'seguiti' : 'follower';

  const [followers, following] = await Promise.all([fetchFollowers(), fetchFollowing()]);

  return (
    <Suspense>
      <FollowTabs defaultTab={defaultTab} followers={followers} following={following} />
    </Suspense>
  );
}
