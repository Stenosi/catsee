'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  src: string;
  alt: string;
}

export default function ZoomableImage({ src, alt }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const startDistRef = useRef<number | null>(null);
  const zoomingRef = useRef(false);

  const [zooming, setZooming] = useState(false);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState('50% 50%');
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function getDist() {
    const [a, b] = Array.from(pointersRef.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      const [a, b] = Array.from(pointersRef.current.values());
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      startDistRef.current = getDist();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setOrigin(`${((mid.x - r.left) / r.width) * 100}% ${((mid.y - r.top) / r.height) * 100}%`);
      setScale(1);
      setTransitioning(false);
      setZooming(true);
      zoomingRef.current = true;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!zoomingRef.current || pointersRef.current.size < 2 || startDistRef.current === null) return;
    setScale(Math.max(1, Math.min(5, getDist() / startDistRef.current)));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2 && zoomingRef.current) {
      startDistRef.current = null;
      setTransitioning(true);
      setScale(1);
      setTimeout(() => {
        setZooming(false);
        zoomingRef.current = false;
        setTransitioning(false);
        setRect(null);
      }, 250);
    }
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none', visibility: zooming ? 'hidden' : 'visible' }}
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />

      {mounted && zooming && rect && createPortal(
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'black',
              opacity: Math.min(0.75, (scale - 1) / 2.5),
              zIndex: 9998,
              transition: transitioning ? 'opacity 0.25s ease-out' : 'none',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="pointer-events-none select-none"
            style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              objectFit: 'cover',
              transform: `scale(${scale})`,
              transformOrigin: origin,
              transition: transitioning ? 'transform 0.25s ease-out' : 'none',
              zIndex: 9999,
              willChange: 'transform',
            }}
            draggable={false}
          />
        </>,
        document.body,
      )}
    </>
  );
}
