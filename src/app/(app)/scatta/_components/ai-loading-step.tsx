'use client';

import { useState, useEffect } from 'react';
import { PawPrint } from 'lucide-react';

const MESSAGES = [
  'Verifico presenza di zampe…',
  'Controllo la morbidezza del pelo…',
  'Conto i baffi…',
  'Consultando il registro felino…',
];

export default function AiLoadingStep() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 1700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-12 px-8">
      {/* Icona animata - container esplicito w-32 h-32 per contenere i cerchi */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute w-28 h-28 rounded-full bg-primary/8 motion-preset-pulse motion-duration-[2200ms]" />
        <div className="absolute w-20 h-20 rounded-full bg-primary/15 motion-preset-pulse motion-duration-[1400ms]" />
        <PawPrint className="relative w-9 h-9 text-primary" strokeWidth={1.5} />
      </div>

      {/* Testo rotante */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p
          className="text-base font-medium text-foreground"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 300ms ease-in-out',
          }}
        >
          {MESSAGES[index]}
        </p>
        <p className="text-sm text-muted-foreground">Verifica in corso…</p>
      </div>
    </div>
  );
}