import { Suspense } from 'react';
import { fetchExploreGrid } from './actions';
import CercaClient from './_components/cerca-client';

export default async function CercaPage() {
  const exploreItems = await fetchExploreGrid();
  return (
    <Suspense>
      <CercaClient exploreItems={exploreItems} />
    </Suspense>
  );
}
