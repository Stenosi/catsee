'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const REDIRECT_SECONDS = 10;

export default function NotFound() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      router.push('/mappa');
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, router]);

  return (
    <div className="flex flex-col min-h-dvh bg-background items-center justify-center px-6 gap-6 text-center">

      {/*
        MVP: emoji gatto come placeholder visivo.
        Future: sostituire con illustrazione/animazione di un gatto smarrito.
      */}
      <span className="text-7xl select-none" aria-hidden="true">🐱</span>

      <div className="flex flex-col gap-2 max-w-xs">
        <h1 className="text-2xl font-semibold text-foreground">Ti sei perso?</h1>
        <p className="text-sm text-muted-foreground">
          La pagina che cerchi non esiste. Anche i gatti a volte sbagliano strada.
        </p>
      </div>

      {/* Countdown */}
      <p className="text-sm text-muted-foreground">
        Torno alla mappa tra{' '}
        <span className="font-semibold tabular-nums text-foreground">{seconds}</span>
        {seconds === 1 ? ' secondo' : ' secondi'}…
      </p>

      <Button onClick={() => router.push('/mappa')}>
        Portami alla mappa
      </Button>

    </div>
  );
}
