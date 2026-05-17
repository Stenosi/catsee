'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginWithEmail } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.set('email', email);
    startTransition(async () => {
      const result = await loginWithEmail(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-4 pb-8">

      {/* Back */}
      <Link
        href="/mappa"
        className="flex items-center gap-1 text-sm text-muted-foreground w-fit -ml-1 py-2"
        aria-label="Torna alla mappa"
      >
        <ArrowLeft className="w-4 h-4" />
        Mappa
      </Link>

      {/* Contenuto centrato verticalmente */}
      <div className="flex flex-col flex-1 justify-center gap-8 max-w-sm mx-auto w-full">

        {/* Intestazione */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Bentornato</h1>
          <p className="text-sm text-muted-foreground">Inserisci la tua email per accedere.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="mario@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
            {error && (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending || !email.trim()} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Invio in corso…
              </>
            ) : (
              'Invia link magico'
            )}
          </Button>
        </form>

        {/* Disclaimer legale — no checkbox, pattern moderno GDPR */}
        <p className="text-xs text-muted-foreground text-center">
          Continuando accetti i{' '}
          <Link href="/termini" className="underline underline-offset-2 hover:text-foreground">
            Termini di servizio
          </Link>{' '}
          e la{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy policy
          </Link>
          .
        </p>

      </div>
    </div>
  );
}
