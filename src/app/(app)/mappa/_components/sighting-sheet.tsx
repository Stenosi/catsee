'use client';

import { createPortal } from 'react-dom';
import { useRef, useState } from 'react';
import Link from 'next/link';
import type { MapSighting } from '../actions';

const CLOSE_THRESHOLD = 80;
const DRAG_INTENT_THRESHOLD = 6; // px di movimento verticale prima di confermare il drag

interface Props {
  sighting: MapSighting | null;
  onClose: () => void;
}

export default function SightingSheet({ sighting, onClose }: Props) {
  const isOpen = sighting !== null;
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false); // true = drag confermato (pointer catturato)

  function onPointerDown(e: React.PointerEvent) {
    startYRef.current = e.clientY;
    draggingRef.current = false;
    // setPointerCapture rimandato a onPointerMove: si cattura solo quando
    // il movimento supera la soglia, così i tap sui link arrivano normalmente.
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startYRef.current === null) return;
    const deltaY = e.clientY - startYRef.current;
    if (!draggingRef.current) {
      if (deltaY < DRAG_INTENT_THRESHOLD) return;
      // Soglia superata: è un drag - cattura il pointer e blocca i click
      draggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDragY(Math.max(0, deltaY));
  }

  function onPointerUp() {
    if (draggingRef.current && dragY >= CLOSE_THRESHOLD) onClose();
    draggingRef.current = false;
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
