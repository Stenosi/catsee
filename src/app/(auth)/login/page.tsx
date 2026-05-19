'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginWithEmail } from './actions';

const schema = z.object({
  email: z.string().email("Inserisci un'email valida."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  function onSubmit(values: FormValues) {
    setServerError('');
    const formData = new FormData();
    formData.set('email', values.email);
    startTransition(async () => {
      const result = await loginWithEmail(formData);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-4 pb-8">

      <Link
        href="/mappa"
        className="flex items-center gap-1 text-sm text-muted-foreground w-fit -ml-1 py-2"
        aria-label="Torna alla mappa"
      >
        <ArrowLeft className="w-4 h-4" />
        Mappa
      </Link>

      <div className="flex flex-col flex-1 justify-center gap-8 max-w-sm mx-auto w-full">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Bentornato</h1>
          <p className="text-sm text-muted-foreground">Inserisci la tua email per accedere.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="mario@esempio.com"
              disabled={isPending}
              aria-invalid={!!(errors.email || serverError)}
              {...register('email')}
            />
            {(errors.email || serverError) && (
              <p className="text-xs text-destructive" role="alert">
                {errors.email?.message ?? serverError}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending || !isValid} className="w-full">
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