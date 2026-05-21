'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/mappa' });
}

const emailSchema = z.email();

export async function loginWithEmail(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const result = emailSchema.safeParse(email);

  if (!result.success) {
    return { error: "Inserisci un'email valida." };
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_email_hint', result.data, {
    httpOnly: false,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
  });

  // redirect: false → signIn invia la mail e ritorna senza lanciare NEXT_REDIRECT.
  // In caso di errore Resend lancia AuthError.
  try {
    await signIn('resend', { email: result.data, redirectTo: '/mappa', redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'Errore durante invio email. Riprova.' };
    }
    throw err;
  }

  // Mail inviata con successo → redirect esplicito alla pagina di verifica.
  redirect('/login/verify');
}
