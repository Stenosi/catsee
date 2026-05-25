'use client';

import dynamic from 'next/dynamic';
import type { ProfileMapSighting } from './profile-map-inner';

const ProfileMapInner = dynamic(() => import('./profile-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Caricamento mappa…</p>
    </div>
  ),
});

interface Props {
  sightings: ProfileMapSighting[];
}

export default function ProfileMapView({ sightings }: Props) {
  return <ProfileMapInner sightings={sightings} />;
}
