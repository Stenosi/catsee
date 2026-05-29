'use client';

import { useRef } from 'react';
import Link from 'next/link';
import type { MapSighting } from '../actions';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

interface Props {
  sighting: MapSighting | null;
  onClose: () => void;
}

export default function SightingSheet({ sighting, onClose }: Props) {
  const lastSightingRef = useRef<MapSighting | null>(null);
  if (sighting) lastSightingRef.current = sighting;
  const displaySighting = lastSightingRef.current;

  return (
    <Drawer open={sighting !== null} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DrawerContent className="bg-card text-foreground">
        {displaySighting && <SheetContent sighting={displaySighting} />}
      </DrawerContent>
    </Drawer>
  );
}

function SheetContent({ sighting }: { sighting: MapSighting }) {
  const dateFormatted = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(
    new Date(sighting.createdAt),
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex gap-4">
        {/* Foto */}
        <div className="w-1/3 aspect-square rounded-xl overflow-hidden bg-muted shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sighting.thumbnailUrl}
            alt={sighting.catNickname}
            draggable={false}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-5 my-1 flex-1 min-w-0">
          {/* Profilo utente */}
          <Link
            href={`/profilo/${sighting.username}`}
            className="flex items-center gap-2 active:opacity-70"
            draggable={false}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
              {sighting.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sighting.avatarUrl} alt={sighting.username} draggable={false} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary uppercase">
                    {sighting.username.slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate">{sighting.username}</span>
          </Link>

          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground leading-tight">{sighting.catNickname}</h2>
            <p className="text-xs text-muted-foreground mt-1">{dateFormatted}</p>

            {sighting.tagColors.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {sighting.tagColors.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/post/${sighting.id}`}
        className="flex items-center justify-center w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium active:opacity-80 transition-opacity"
      >
        Vedi dettaglio
      </Link>
    </div>
  );
}
