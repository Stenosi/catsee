import Link from 'next/link';
import { ArrowLeft, Ban } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoginForm from './_components/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isBanned = error === 'banned';

  let bannedUntil: Date | null = null;
  if (isBanned) {
    const session = await auth();
    // Ban revocato o scaduto: l'utente è libero, lo mandiamo al profilo
    if (session?.user && !session.user.banned) {
      redirect('/profilo');
    }
    if (session?.user?.id) {
      const row = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { bannedUntil: true },
      });
      bannedUntil = row?.bannedUntil ?? null;
    }
  }

  const daysLeft = bannedUntil
    ? Math.max(0, Math.ceil((bannedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const expiryLabel = bannedUntil
    ? new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(bannedUntil)
    : null;

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
        {isBanned ? (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Account sospeso</h1>
              <p className="text-sm text-muted-foreground">
                Non puoi accedere a CatSee in questo momento.
              </p>
            </div>

            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertTitle>Accesso temporaneamente bloccato</AlertTitle>
              <AlertDescription className="mt-1 space-y-3">
                <p>
                  {expiryLabel && daysLeft !== null ? (
                    daysLeft === 0 ? (
                      <>Il tuo ban scade <strong>oggi</strong>. Riprova tra poco.</>
                    ) : (
                      <>
                        Il tuo ban scade il <strong>{expiryLabel}</strong>{' '}
                        ({daysLeft === 1 ? 'domani' : `tra ${daysLeft} giorni`}).
                      </>
                    )
                  ) : (
                    <>Il tuo account è stato sospeso.</>
                  )}
                </p>
                <p>
                  Nel frattempo ti invitiamo a rivedere i contenuti del tuo profilo (foto, nickname e
                  bio) e a correggere tutto ciò che potrebbe risultare inappropriato o offensivo.
                  Questo ti aiuterà a evitare ulteriori segnalazioni o ban futuri.
                </p>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Bentornato</h1>
              <p className="text-sm text-muted-foreground">
                Accedi per avvistare gatti e seguire la community.
              </p>
            </div>

            <LoginForm />

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
          </>
        )}
      </div>
    </div>
  );
}
