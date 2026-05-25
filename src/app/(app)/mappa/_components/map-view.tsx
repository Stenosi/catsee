'use client';

import dynamic from 'next/dynamic';
import type { MapSighting } from '../actions';

const MapInner = dynamic(() => import('./map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Caricamento mappa…</p>
    </div>
  ),
});

interface Props {
  sightings: MapSighting[];
}

export default function MapView({ sightings }: Props) {
  return <MapInner sightings={sightings} />;
}
