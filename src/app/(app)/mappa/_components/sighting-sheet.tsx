'use client';

import type { MapSighting } from '../actions';

interface Props {
  sighting: MapSighting | null;
  onClose: () => void;
}

export default function SightingSheet({ sighting, onClose }: Props) {
  const isOpen = sighting !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-1001 bg-black/40 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-1002 bg-card rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {sighting && <SheetContent sighting={sighting} />}
      </div>
    </>
  );
}

function SheetContent({ sighting }: { sighting: MapSighting }) {
  const dateFormatted = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(
    new Date(sighting.createdAt),
  );

  return (
    <div className="px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {/* Foto */}
      <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-muted mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sighting.thumbnailUrl}
          alt={sighting.catNickname}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <h2 className="text-lg font-bold text-foreground leading-tight">{sighting.catNickname}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">@{sighting.username}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{dateFormatted}</p>

      {/* Colori */}
      {sighting.tagColors.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
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

      {/* CTA placeholder */}
      <button
        disabled
        className="w-full h-11 rounded-full bg-primary/40 text-primary-foreground text-sm font-medium cursor-not-allowed"
      >
        Vedi dettaglio (prossimamente)
      </button>
    </div>
  );
}
