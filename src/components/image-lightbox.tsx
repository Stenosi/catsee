'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
  circle?: boolean;
}

export default function ImageLightbox({ src, alt = '', open, onClose, circle = false }: Props) {
  useEffect(() => {
    if (!open) return;

    history.pushState({ lightbox: true }, '');

    function onPopState() { onClose(); }
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') history.back(); }

    window.addEventListener('popstate', onPopState);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-1000 bg-black/90 flex items-center justify-center p-4"
      onClick={() => history.back()}
    >
      <button
        onClick={() => history.back()}
        aria-label="Chiudi"
        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white"
      >
        <X className="w-5 h-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={circle ? 'w-64 h-64 object-cover rounded-full' : 'max-w-full max-h-full object-contain rounded-lg'}
      />
    </div>
  );
}
