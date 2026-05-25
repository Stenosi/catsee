'use client';

import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import type { MapSighting } from '../actions';

const CLOSE_THRESHOLD = 80;

interface Props {
  sighting: MapSighting | null;
  onClose: () => void;
}

export default function SightingSheet({ sighting, onClose }: Props) {
  const isOpen = sighting !== null;
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    startYRef.current = e.clientY;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || startYRef.current === null) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragY >= CLOSE_THRESHOLD) onClose();
    setDragY(0);
    startYRef.current = null;
  }

  const panelTransform = isOpen ? `translateY(${dragY}px)` : 'translateY(100%)';
  const panelTransition = draggingRef.current ? 'none' : 'transform 300ms ease-out';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-1001 bg-black/40 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 - dragY / 200 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-1002 bg-card rounded-t-2xl shadow-2xl select-none"
        style={{ transform: panelTransform, transition: panelTransition }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {sighting && <SheetContent sighting={sighting} />}
      </div>
    </>,
    document.body,
  );
}

function SheetContent({ sighting }: { sighting: MapSighting }) {
  const dateFormatted = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(
    new Date(sighting.createdAt),
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">

      <div className='flex gap-4'>
        {/* Foto */}
        <div className="w-1/3 aspect-square rounded-xl overflow-hidden bg-muted mb-4">
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
          <div className="flex items-center gap-2">
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
          </div>

          <div className='flex flex-col'>
            {/* Info */}
            <h2 className="text-lg font-bold text-foreground leading-tight">{sighting.catNickname}</h2>
            <p className="text-xs text-muted-foreground mt-1">{dateFormatted}</p>

            {/* Colori */}
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
