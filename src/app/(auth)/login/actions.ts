'use server';

import { signIn } from '@/auth';
import { z } from 'zod';
import { cookies } from 'next/headers';

const emailSchema = z.string().email();

export async function loginWithEmail(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const result = emailSchema.safeParse(email);

  if (!result.success) {
    return { error: "Inserisci un'email valida." };
  }

  // Salviamo l'email in un cookie non-httpOnly così la pagina /verify
  // può mostrarla mascherata senza bisogno di un DB round-trip.
  const cookieStore = await cookies();
  cookieStore.set('auth_email_hint', result.data, {
    httpOnly: false,
    maxAge: 60 * 10, // 10 minuti
    path: '/',
    sameSite: 'lax',
  });

  // signIn lancia internamente un redirect, quindi non ritorna mai in caso di successo.
  // In caso di errore Auth.js (es. Resend down) lancia un'eccezione.
  try {
    await signIn('resend', { email: result.data, redirectTo: '/mappa' });
  } catch (err) {
    // I redirect di Next.js sono implementati come eccezioni: vanno rilanciati.
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    return { error: 'Errore durante invio email. Riprova.' };
  }
}
